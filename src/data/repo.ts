import { DEFAULT_SETTINGS, type Card, type ImportMeta, type Progress, type ReviewLogEntry, type Session, type Settings, type UndoEntry } from '../domain/types';
import type { DB } from './db';

const SESSION_KEY = 'current';
const MAX_UNDO = 20;

export interface LoadedData {
  cards: Card[];
  progress: Map<string, Progress>;
  settings: Settings;
  importMeta: ImportMeta | null;
  session: Session | null;
}

export interface Backup {
  app: 'flipwise';
  backupVersion: 1;
  exportedAt: number;
  importMeta: ImportMeta | null;
  settings: Settings;
  cards: Card[];
  progress: Progress[];
  reviewLog: ReviewLogEntry[];
}

export class Repo {
  constructor(private db: DB) {}

  async loadAll(): Promise<LoadedData> {
    const tx = this.db.transaction(['cards', 'progress', 'meta', 'session']);
    const [cards, progress, settings, importMeta, session] = await Promise.all([
      tx.objectStore('cards').getAll(),
      tx.objectStore('progress').getAll(),
      tx.objectStore('meta').get('settings') as Promise<Settings | undefined>,
      tx.objectStore('meta').get('import') as Promise<ImportMeta | undefined>,
      tx.objectStore('session').get(SESSION_KEY),
    ]);
    await tx.done;
    cards.sort((a, b) => a.rowOrder - b.rowOrder);
    return {
      cards,
      progress: new Map(progress.map((p) => [p.cardId, p])),
      settings: { ...DEFAULT_SETTINGS, ...settings },
      importMeta: importMeta ?? null,
      session: session ?? null,
    };
  }

  /**
   * Replace all card content atomically. Progress is untouched: matching IDs keep
   * their progress, new cards have none (New), and progress for removed cards is
   * kept hidden in case they come back. The active session is cleared because
   * its cards may no longer exist.
   */
  async commitImport(cards: Card[], meta: ImportMeta): Promise<void> {
    const tx = this.db.transaction(['cards', 'meta', 'session'], 'readwrite');
    const store = tx.objectStore('cards');
    await store.clear();
    await Promise.all([
      ...cards.map((c) => store.put(c)),
      tx.objectStore('meta').put(meta, 'import'),
      tx.objectStore('session').delete(SESSION_KEY),
    ]);
    await tx.done;
  }

  /**
   * Save a rating: the new progress, a review-log entry, and the advanced
   * session (with an undo entry that references the log ID) in one transaction.
   */
  async recordRating(args: {
    progress: Progress;
    prevProgress: Progress | null;
    log: Omit<ReviewLogEntry, 'id'>;
    prevSession: Session;
    nextSession: Session;
  }): Promise<Session> {
    const tx = this.db.transaction(['progress', 'reviewLog', 'session'], 'readwrite');
    const [, logId] = await Promise.all([
      tx.objectStore('progress').put(args.progress),
      tx.objectStore('reviewLog').add(args.log as ReviewLogEntry),
    ]);
    const { undo: _prevUndo, ...prevSession } = args.prevSession;
    const entry: UndoEntry = { cardId: args.progress.cardId, prevProgress: args.prevProgress, logId, prevSession };
    const session: Session = { ...args.nextSession, undo: [...args.prevSession.undo, entry].slice(-MAX_UNDO) };
    await tx.objectStore('session').put(session, SESSION_KEY);
    await tx.done;
    return session;
  }

  /** Revert the most recent rating in the session. Returns the restored session. */
  async undoLastRating(session: Session): Promise<Session | null> {
    const entry = session.undo.at(-1);
    if (!entry) return null;
    const restored: Session = { ...entry.prevSession, undo: session.undo.slice(0, -1) };
    const tx = this.db.transaction(['progress', 'reviewLog', 'session'], 'readwrite');
    await Promise.all([
      entry.prevProgress
        ? tx.objectStore('progress').put(entry.prevProgress)
        : tx.objectStore('progress').delete(entry.cardId),
      tx.objectStore('reviewLog').delete(entry.logId),
      tx.objectStore('session').put(restored, SESSION_KEY),
    ]);
    await tx.done;
    return restored;
  }

  async saveSession(session: Session | null): Promise<void> {
    if (session) await this.db.put('session', session, SESSION_KEY);
    else await this.db.delete('session', SESSION_KEY);
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.db.put('meta', settings, 'settings');
  }

  async reviewLogSince(time: number): Promise<ReviewLogEntry[]> {
    return this.db.getAllFromIndex('reviewLog', 'at', IDBKeyRange.lowerBound(time));
  }

  /** Delete progress records that have no matching card. Returns how many were removed. */
  async clearOrphanedProgress(validIds: Set<string>): Promise<number> {
    const tx = this.db.transaction('progress', 'readwrite');
    const keys = await tx.store.getAllKeys();
    const orphans = keys.filter((k) => !validIds.has(k));
    await Promise.all(orphans.map((k) => tx.store.delete(k)));
    await tx.done;
    return orphans.length;
  }

  async resetProgress(): Promise<void> {
    const tx = this.db.transaction(['progress', 'reviewLog', 'session'], 'readwrite');
    await Promise.all([
      tx.objectStore('progress').clear(),
      tx.objectStore('reviewLog').clear(),
      tx.objectStore('session').clear(),
    ]);
    await tx.done;
  }

  async deleteAll(): Promise<void> {
    const tx = this.db.transaction(['cards', 'progress', 'reviewLog', 'session', 'meta'], 'readwrite');
    await Promise.all([
      tx.objectStore('cards').clear(),
      tx.objectStore('progress').clear(),
      tx.objectStore('reviewLog').clear(),
      tx.objectStore('session').clear(),
      tx.objectStore('meta').clear(),
    ]);
    await tx.done;
  }

  async exportBackup(now: number): Promise<Backup> {
    const tx = this.db.transaction(['cards', 'progress', 'reviewLog', 'meta']);
    const [cards, progress, reviewLog, settings, importMeta] = await Promise.all([
      tx.objectStore('cards').getAll(),
      tx.objectStore('progress').getAll(),
      tx.objectStore('reviewLog').getAll(),
      tx.objectStore('meta').get('settings') as Promise<Settings | undefined>,
      tx.objectStore('meta').get('import') as Promise<ImportMeta | undefined>,
    ]);
    await tx.done;
    return {
      app: 'flipwise',
      backupVersion: 1,
      exportedAt: now,
      importMeta: importMeta ?? null,
      settings: { ...DEFAULT_SETTINGS, ...settings },
      cards,
      progress,
      reviewLog,
    };
  }

  /** Replace everything on this device with the backup's contents. */
  async restoreBackup(backup: Backup): Promise<void> {
    const tx = this.db.transaction(['cards', 'progress', 'reviewLog', 'session', 'meta'], 'readwrite');
    await Promise.all([
      tx.objectStore('cards').clear(),
      tx.objectStore('progress').clear(),
      tx.objectStore('reviewLog').clear(),
      tx.objectStore('session').clear(),
      tx.objectStore('meta').clear(),
    ]);
    await Promise.all([
      ...backup.cards.map((c) => tx.objectStore('cards').put(c)),
      ...backup.progress.map((p) => tx.objectStore('progress').put(p)),
      ...backup.reviewLog.map((l) => tx.objectStore('reviewLog').put(l)),
      tx.objectStore('meta').put({ ...DEFAULT_SETTINGS, ...backup.settings }, 'settings'),
      ...(backup.importMeta ? [tx.objectStore('meta').put(backup.importMeta, 'import')] : []),
    ]);
    await tx.done;
  }
}

/** Validate an untrusted parsed JSON value as a backup file. Throws with a readable message. */
export function validateBackup(value: unknown): Backup {
  const b = value as Partial<Backup> | null;
  if (!b || typeof b !== 'object' || b.app !== 'flipwise') {
    throw new Error('This is not a Flipwise backup file.');
  }
  if (b.backupVersion !== 1) throw new Error(`Unsupported backup version: ${String(b.backupVersion)}.`);
  if (!Array.isArray(b.cards) || !Array.isArray(b.progress) || !Array.isArray(b.reviewLog)) {
    throw new Error('The backup file is incomplete or damaged.');
  }
  const badCard = b.cards.find((c) => typeof c?.id !== 'string' || typeof c.question !== 'string' || typeof c.answer !== 'string');
  const badProgress = b.progress.find((p) => typeof p?.cardId !== 'string' || typeof p.status !== 'string');
  if (badCard || badProgress) throw new Error('The backup file contains invalid records.');
  return b as Backup;
}
