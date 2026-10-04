import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Card, ImportMeta, Progress, ReviewLogEntry, Session, Settings } from '../domain/types';

export const DB_NAME = 'flipwise';
export const DB_VERSION = 1;

export interface MetaValues {
  import: ImportMeta;
  settings: Settings;
}

export interface FlashcardDB extends DBSchema {
  /** Flashcard content from the CSV. Replaced on import. */
  cards: { key: string; value: Card };
  /** Study progress, keyed by card ID. Kept separate from content. */
  progress: { key: string; value: Progress };
  reviewLog: { key: number; value: ReviewLogEntry; indexes: { at: number } };
  /** The active study session, under the key "current". */
  session: { key: string; value: Session };
  meta: { key: keyof MetaValues; value: MetaValues[keyof MetaValues] };
}

export type DB = IDBPDatabase<FlashcardDB>;

export function openFlashcardDB(name = DB_NAME): Promise<DB> {
  return openDB<FlashcardDB>(name, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Versioned migrations: add a `case` for each future schema version.
      if (oldVersion < 1) {
        db.createObjectStore('cards', { keyPath: 'id' });
        db.createObjectStore('progress', { keyPath: 'cardId' });
        const log = db.createObjectStore('reviewLog', { keyPath: 'id', autoIncrement: true });
        log.createIndex('at', 'at');
        db.createObjectStore('session');
        db.createObjectStore('meta');
      }
    },
  });
}
