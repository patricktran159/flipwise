import { createContext, type ComponentChildren } from 'preact';
import { useContext, useMemo, useRef, useState } from 'preact/hooks';
import type { Backup, Repo } from '../data/repo';
import { createSession, rateInSession } from '../domain/queue';
import { applyRating, startOfDay, statusOf } from '../domain/scheduler';
import { modeTitle, selectCards } from '../domain/selection';
import { computeStats } from '../domain/stats';
import {
  DEFAULT_SETTINGS, type Card, type ImportMeta, type Progress, type Rating, type ReviewLogEntry,
  type Session, type Settings, type StudyMode,
} from '../domain/types';

/** How much review history is kept in memory for the activity chart. */
export const ACTIVITY_DAYS = 7;

export interface AppState {
  cards: Card[];
  cardMap: Map<string, Card>;
  progress: Map<string, Progress>;
  settings: Settings;
  importMeta: ImportMeta | null;
  session: Session | null;
  recentLog: ReviewLogEntry[];
}

function emptyState(): AppState {
  return {
    cards: [],
    cardMap: new Map(),
    progress: new Map(),
    settings: DEFAULT_SETTINGS,
    importMeta: null,
    session: null,
    recentLog: [],
  };
}

export async function loadState(repo: Repo): Promise<AppState> {
  const data = await repo.loadAll();
  const recentLog = await repo.reviewLogSince(dayStart(Date.now(), ACTIVITY_DAYS - 1));
  let session = data.session;
  const cardMap = new Map(data.cards.map((c) => [c.id, c]));
  // Drop a stored session whose cards no longer exist (defensive; imports clear sessions).
  if (session && session.queue.some((id) => !cardMap.has(id))) {
    session = null;
    await repo.saveSession(null);
  }
  return { ...emptyState(), ...data, cardMap, session, recentLog };
}

function useStoreValue(repo: Repo, initial: AppState) {
  const [state, setState] = useState(initial);
  const ref = useRef(state);
  const busy = useRef(false);

  const update = (partial: Partial<AppState>) => {
    ref.current = { ...ref.current, ...partial };
    setState(ref.current);
  };

  /** Run one write at a time so rapid taps can't double-rate a card. */
  const exclusive = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (busy.current) return undefined;
    busy.current = true;
    try {
      return await fn();
    } finally {
      busy.current = false;
    }
  };

  const stats = useMemo(() => computeStats(state.cards, state.progress), [state.cards, state.progress]);

  const actions = useMemo(() => ({
    async reload() {
      update(await loadState(repo));
    },

    /** Build a session for a mode. Returns the number of cards (0 = nothing to study). */
    async startSession(mode: StudyMode, shuffled: boolean): Promise<number> {
      const s = ref.current;
      const ids = selectCards(mode, s.cards, s.progress, s.settings, Date.now(), shuffled);
      if (!ids.length) return 0;
      const session = createSession(mode, modeTitle(mode), ids, shuffled, Date.now());
      await repo.saveSession(session);
      update({ session });
      return ids.length;
    },

    async endSession() {
      await repo.saveSession(null);
      update({ session: null });
    },

    rate(rating: Rating) {
      return exclusive(async () => {
        const s = ref.current;
        const session = s.session;
        const cardId = session?.queue[0];
        if (!session || !cardId) return;
        const now = Date.now();
        const prev = s.progress.get(cardId) ?? null;
        const next = applyRating(prev, cardId, rating, now, s.settings.masteryThreshold);
        const becameMastered = next.status === 'mastered' && statusOf(prev) !== 'mastered';
        const log = { cardId, rating, at: now, statusBefore: statusOf(prev), statusAfter: next.status };
        const saved = await repo.recordRating({
          progress: next,
          prevProgress: prev,
          log,
          prevSession: session,
          nextSession: rateInSession(session, rating, s.settings.againGap, becameMastered),
        });
        const progress = new Map(s.progress);
        progress.set(cardId, next);
        const logId = saved.undo.at(-1)!.logId;
        update({ session: saved, progress, recentLog: [...s.recentLog, { ...log, id: logId }] });
      });
    },

    undo() {
      return exclusive(async () => {
        const s = ref.current;
        if (!s.session?.undo.length) return false;
        const entry = s.session.undo.at(-1)!;
        const restored = await repo.undoLastRating(s.session);
        if (!restored) return false;
        const progress = new Map(s.progress);
        if (entry.prevProgress) progress.set(entry.cardId, entry.prevProgress);
        else progress.delete(entry.cardId);
        update({ session: restored, progress, recentLog: s.recentLog.filter((l) => l.id !== entry.logId) });
        return true;
      });
    },

    async commitImport(cards: Card[], sourceFileName: string) {
      await repo.commitImport(cards, { importedAt: Date.now(), sourceFileName, cardCount: cards.length });
      update(await loadState(repo));
    },

    async saveSettings(settings: Settings) {
      await repo.saveSettings(settings);
      update({ settings });
    },

    async clearOrphans() {
      const n = await repo.clearOrphanedProgress(new Set(ref.current.cardMap.keys()));
      update(await loadState(repo));
      return n;
    },

    async resetProgress() {
      await repo.resetProgress();
      update(await loadState(repo));
    },

    async deleteAll() {
      await repo.deleteAll();
      update(await loadState(repo));
    },

    exportBackup: () => repo.exportBackup(Date.now()),

    async restoreBackup(backup: Backup) {
      await repo.restoreBackup(backup);
      update(await loadState(repo));
    },
  }), [repo]);

  return { state, stats, actions };
}

export type Store = ReturnType<typeof useStoreValue>;

const StoreContext = createContext<Store | null>(null);

export function StoreProvider(props: { repo: Repo; initial: AppState; children: ComponentChildren }) {
  const store = useStoreValue(props.repo, props.initial);
  return <StoreContext.Provider value={store}>{props.children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

/** Distinct cards reviewed since local midnight, plus total ratings. */
export function reviewedToday(log: ReviewLogEntry[], now = Date.now()) {
  const since = startOfDay(now);
  const today = log.filter((l) => l.at >= since);
  return { cards: new Set(today.map((l) => l.cardId)).size, ratings: today.length };
}

/** Local midnight `daysAgo` calendar days before `now` (DST-safe). */
export function dayStart(now: number, daysAgo: number): number {
  const d = new Date(startOfDay(now));
  d.setDate(d.getDate() - daysAgo);
  return d.getTime();
}

/** Ratings per day for the last ACTIVITY_DAYS days, oldest first. */
export function activityByDay(log: ReviewLogEntry[], now = Date.now()) {
  return Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const daysAgo = ACTIVITY_DAYS - 1 - i;
    const start = dayStart(now, daysAgo);
    const end = dayStart(now, daysAgo - 1);
    return { start, count: log.filter((l) => l.at >= start && l.at < end).length };
  });
}
