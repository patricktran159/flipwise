import type { Rating, Session, StudyMode } from './types';

export type Rng = () => number;

export function createSession(mode: StudyMode, title: string, cardIds: string[], shuffled: boolean, now: number): Session {
  return {
    mode,
    title,
    shuffled,
    queue: [...cardIds],
    total: cardIds.length,
    completed: 0,
    counts: { again: 0, hard: 0, good: 0 },
    hardRequeued: [],
    newlyMastered: [],
    startedAt: now,
    undo: [],
  };
}

export function currentCardId(session: Session): string | undefined {
  return session.queue[0];
}

export function isFinished(session: Session): boolean {
  return session.queue.length === 0;
}

/** Gap of againGap ±1 other cards, at least 1. */
export function againPosition(againGap: number, remaining: number, rng: Rng): number {
  const jitter = Math.floor(rng() * 3) - 1;
  const gap = Math.max(1, againGap + jitter);
  return Math.min(gap, remaining);
}

/**
 * Advance the session after rating the current card. Returns a new session
 * (the undo stack is carried over untouched; callers push undo entries).
 *
 * - Good: the card leaves the queue.
 * - Again: the card returns after several other cards (immediately if it is the last one).
 * - Hard: the card returns once, at the end of the queue; a second Hard finishes it.
 */
export function rateInSession(
  session: Session,
  rating: Rating,
  againGap: number,
  becameMastered: boolean,
  rng: Rng = Math.random,
): Session {
  const [cardId, ...rest] = session.queue;
  if (cardId === undefined) return session;

  const next: Session = {
    ...session,
    queue: rest,
    counts: { ...session.counts, [rating]: session.counts[rating] + 1 },
    hardRequeued: session.hardRequeued,
    newlyMastered: becameMastered && !session.newlyMastered.includes(cardId)
      ? [...session.newlyMastered, cardId]
      : session.newlyMastered,
  };

  if (rating === 'good') {
    next.completed++;
  } else if (rating === 'again') {
    const pos = againPosition(againGap, rest.length, rng);
    next.queue = [...rest.slice(0, pos), cardId, ...rest.slice(pos)];
  } else if (session.hardRequeued.includes(cardId)) {
    next.completed++;
  } else {
    next.queue = [...rest, cardId];
    next.hardRequeued = [...session.hardRequeued, cardId];
  }
  return next;
}

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
