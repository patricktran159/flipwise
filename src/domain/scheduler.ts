import type { Progress, Rating, Status } from './types';

/** Local calendar day, e.g. "2026-10-04". */
export function dayKey(time: number): string {
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(time: number): number {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function statusOf(progress: Progress | undefined | null): Status {
  return progress ? progress.status : 'new';
}

/**
 * Apply a rating to a card's progress.
 *
 * - Again: back to Learning (Difficult stays Difficult), streak resets, card is marked missed.
 * - Hard: Difficult, streak resets.
 * - Good: streak +1 (at most once per day, and not on a day the card was failed);
 *   Mastered once the streak reaches the threshold. Clears the missed flag.
 */
export function applyRating(
  prev: Progress | undefined | null,
  cardId: string,
  rating: Rating,
  now: number,
  masteryThreshold: number,
): Progress {
  const today = dayKey(now);
  const before = statusOf(prev);
  const p: Progress = prev
    ? { ...prev }
    : {
        cardId,
        attempts: 0,
        againCount: 0,
        hardCount: 0,
        goodCount: 0,
        status: 'learning',
        goodStreak: 0,
        missed: false,
        lapses: 0,
        lastRating: rating,
        lastReviewedAt: now,
        firstReviewedAt: now,
      };

  p.attempts++;
  p.lastRating = rating;
  p.lastReviewedAt = now;

  switch (rating) {
    case 'again':
      p.againCount++;
      p.missed = true;
      p.goodStreak = 0;
      p.lastStreakDay = today;
      if (before === 'mastered') p.lapses++;
      p.status = before === 'difficult' ? 'difficult' : 'learning';
      break;
    case 'hard':
      p.hardCount++;
      p.goodStreak = 0;
      p.lastStreakDay = today;
      p.status = 'difficult';
      break;
    case 'good':
      p.goodCount++;
      p.missed = false;
      if (p.lastStreakDay !== today) {
        p.goodStreak++;
        p.lastStreakDay = today;
      }
      if (before === 'mastered' || p.goodStreak >= masteryThreshold) p.status = 'mastered';
      else if (before === 'new') p.status = 'learning';
      // Learning stays Learning; Difficult stays Difficult until mastered.
      break;
  }
  return p;
}
