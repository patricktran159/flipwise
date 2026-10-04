import { shuffle, type Rng } from './queue';
import { dayKey, startOfDay, statusOf } from './scheduler';
import type { Card, Progress, Settings, StudyMode } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function modeTitle(mode: StudyMode): string {
  switch (mode.kind) {
    case 'review': return 'Review';
    case 'new': return 'Learn New Cards';
    case 'missed': return 'Missed Cards';
    case 'difficult': return 'Difficult Cards';
    case 'chapter': return mode.section ? `${mode.chapter} · ${mode.section}` : mode.chapter;
  }
}

/**
 * Whether a studied card belongs in today's Review. New cards are learned separately.
 * - Missed cards stay due until they are rated Good.
 * - Learning and Difficult cards are due once a day: only one Good a day counts towards
 *   mastery, so after today's rating they wait for tomorrow.
 * - Mastered cards come back after `resurfaceDays` without review.
 */
export function isDue(p: Progress | undefined, now: number, resurfaceDays: number): boolean {
  if (!p) return false;
  if (p.missed) return true;
  if (p.status === 'mastered') return p.lastReviewedAt <= now - resurfaceDays * DAY_MS;
  return p.lastStreakDay !== dayKey(now);
}

export function countDue(cards: Card[], progress: Map<string, Progress>, resurfaceDays: number, now: number): number {
  return cards.reduce((n, c) => n + (isDue(progress.get(c.id), now, resurfaceDays) ? 1 : 0), 0);
}

/**
 * Size of a Learn New Cards session drawn from `available` new cards. Normally the session size, but
 * a remainder of up to half a session is included rather than left as a tiny extra session
 * (a 23-card chapter with session size 20 is learned in one go; a 50-card chapter as 20 + 30).
 */
export function newSessionCount(available: number, sessionSize: number): number {
  if (sessionSize <= 0 || available <= Math.floor(sessionSize * 1.5)) return available;
  return sessionSize;
}

/** Cards that will be due tomorrow (includes any still due today). */
export function countDueTomorrow(cards: Card[], progress: Map<string, Progress>, resurfaceDays: number, now: number): number {
  const tomorrow = new Date(startOfDay(now));
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12);
  return countDue(cards, progress, resurfaceDays, tomorrow.getTime());
}

/** Where Learn New Cards continues: the first chapter (in CSV order) that still has new cards. */
export function nextNewChapter(cards: Card[], progress: Map<string, Progress>): { chapter: string; newCount: number } | null {
  let first: Card | undefined;
  for (const c of cards) if (!progress.has(c.id) && (!first || c.rowOrder < first.rowOrder)) first = c;
  if (!first) return null;
  const chapter = first.chapter;
  return { chapter, newCount: cards.filter((c) => c.chapter === chapter && !progress.has(c.id)).length };
}

const byCsvOrder = (a: Card, b: Card) => a.rowOrder - b.rowOrder;
const byChapterNumber = (a: Card, b: Card) => a.chapterOrder - b.chapterOrder || a.cardNumber - b.cardNumber;

/**
 * Pick and order the cards for a study mode. Shuffle is applied after the
 * cards are chosen, so Start Review's priority still decides which cards go in.
 */
export function selectCards(
  mode: StudyMode,
  cards: Card[],
  progress: Map<string, Progress>,
  settings: Pick<Settings, 'sessionSize' | 'resurfaceDays'>,
  now: number,
  shuffled: boolean,
  rng: Rng = Math.random,
): string[] {
  const p = (c: Card) => progress.get(c.id);
  const oldestFirst = (a: Card, b: Card) =>
    (p(a)?.lastReviewedAt ?? 0) - (p(b)?.lastReviewedAt ?? 0) || byCsvOrder(a, b);
  const limit = (list: Card[]) => (settings.sessionSize > 0 ? list.slice(0, settings.sessionSize) : list);

  let chosen: Card[];
  switch (mode.kind) {
    case 'chapter':
      chosen = cards
        .filter((c) => c.chapter === mode.chapter && (!mode.section || c.section === mode.section))
        .sort(byChapterNumber);
      break;
    case 'new': {
      const fresh = cards.filter((c) => !p(c)).sort(byCsvOrder);
      // One chapter at a time; when shuffling, sample from all new cards instead.
      const pool = shuffled ? shuffle(fresh, rng) : fresh.filter((c) => c.chapter === fresh[0]?.chapter);
      chosen = pool.slice(0, newSessionCount(pool.length, settings.sessionSize));
      break;
    }
    case 'missed':
      chosen = cards.filter((c) => p(c)?.missed).sort(oldestFirst);
      break;
    case 'difficult':
      chosen = cards.filter((c) => statusOf(p(c)) === 'difficult').sort(oldestFirst);
      break;
    case 'review': {
      // Only cards that are due today; new cards are learned separately.
      const tiers: Card[][] = [[], [], [], []];
      for (const c of cards) {
        const pr = p(c);
        if (!pr || !isDue(pr, now, settings.resurfaceDays)) continue;
        if (pr.missed) tiers[0].push(c);
        else if (pr.status === 'difficult') tiers[1].push(c);
        else if (pr.status === 'learning') tiers[2].push(c);
        else tiers[3].push(c);
      }
      for (const t of tiers) t.sort(oldestFirst);
      chosen = limit(tiers.flat());
      break;
    }
  }

  const ids = chosen.map((c) => c.id);
  return shuffled ? shuffle(ids, rng) : ids;
}
