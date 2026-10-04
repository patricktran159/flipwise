export type Rating = 'again' | 'hard' | 'good';
export type Status = 'new' | 'learning' | 'difficult' | 'mastered';

export const STATUSES: Status[] = ['new', 'learning', 'difficult', 'mastered'];

export const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  learning: 'Learning',
  difficult: 'Difficult',
  mastered: 'Mastered',
};

export interface Card {
  /** Stable identifier: normalized Chapter + "#" + CardNumber. */
  id: string;
  chapter: string;
  cardNumber: number;
  section: string;
  question: string;
  answer: string;
  /** Order of first appearance of the chapter in the CSV (0-based). */
  chapterOrder: number;
  /** Order of first appearance of the section in the CSV (0-based). */
  sectionOrder: number;
  /** Row order in the CSV (0-based, data rows only). */
  rowOrder: number;
}

/** Study progress for one card. A card without a record is New. */
export interface Progress {
  cardId: string;
  attempts: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  status: Exclude<Status, 'new'>;
  /** Consecutive Good ratings, credited at most once per day. */
  goodStreak: number;
  /** Local day key (YYYY-MM-DD) on which the streak last changed or a failure consumed the day. */
  lastStreakDay?: string;
  /** Set by Again, cleared by Good. */
  missed: boolean;
  /** Times a Mastered card was rated Again. */
  lapses: number;
  lastRating: Rating;
  lastReviewedAt: number;
  firstReviewedAt: number;
}

export interface ReviewLogEntry {
  id?: number;
  cardId: string;
  rating: Rating;
  at: number;
  statusBefore: Status;
  statusAfter: Status;
}

export type TextSize = 's' | 'm' | 'l' | 'xl';
export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  /** Cards per Start Review / New Cards session; 0 means all. */
  sessionSize: number;
  masteryThreshold: number;
  /** Number of other cards shown before an Again card returns (randomized ±1). */
  againGap: number;
  shuffleDefault: boolean;
  /** Mastered cards return to Start Review after this many days without review. */
  resurfaceDays: number;
  textSize: TextSize;
  theme: Theme;
}

export const DEFAULT_SETTINGS: Settings = {
  sessionSize: 20,
  masteryThreshold: 3,
  againGap: 4,
  shuffleDefault: false,
  resurfaceDays: 7,
  textSize: 'm',
  theme: 'system',
};

export type StudyMode =
  | { kind: 'review' }
  | { kind: 'chapter'; chapter: string; section?: string }
  | { kind: 'new' }
  | { kind: 'missed' }
  | { kind: 'difficult' };

export interface UndoEntry {
  cardId: string;
  /** Progress before the rating; null if the card was New. */
  prevProgress: Progress | null;
  logId: number;
  /** Session state before the rating (without its own undo stack). */
  prevSession: Omit<Session, 'undo'>;
}

export interface Session {
  mode: StudyMode;
  title: string;
  shuffled: boolean;
  /** Remaining card IDs; queue[0] is the current card. */
  queue: string[];
  /** Number of distinct cards in the session. */
  total: number;
  /** Distinct cards finished (Good, or Hard after their one requeue). */
  completed: number;
  counts: Record<Rating, number>;
  hardRequeued: string[];
  newlyMastered: string[];
  startedAt: number;
  undo: UndoEntry[];
}

export interface ImportMeta {
  importedAt: number;
  sourceFileName: string;
  cardCount: number;
}
