import { describe, expect, it } from 'vitest';
import { applyRating, dayKey, statusOf } from '../../src/domain/scheduler';
import type { Progress, Rating, Status } from '../../src/domain/types';

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date(2026, 9, 4, 10, 0).getTime();
const ID = 'Ch#1';

function rateSequence(steps: [Rating, number][], threshold = 3): Progress {
  let p: Progress | undefined;
  for (const [rating, dayOffset] of steps) p = applyRating(p, ID, rating, T0 + dayOffset * DAY, threshold);
  return p!;
}

/** Build a progress record in a given status, last touched on an earlier day. */
function inStatus(status: Status): Progress | undefined {
  if (status === 'new') return undefined;
  const base = applyRating(undefined, ID, 'good', T0 - 10 * DAY, 3);
  return { ...base, status, goodStreak: status === 'mastered' ? 3 : 1, missed: false };
}

describe('applyRating transition table', () => {
  const table: [Status, Rating, Status][] = [
    ['new', 'again', 'learning'],
    ['new', 'hard', 'difficult'],
    ['new', 'good', 'learning'],
    ['learning', 'again', 'learning'],
    ['learning', 'hard', 'difficult'],
    ['learning', 'good', 'learning'],
    ['difficult', 'again', 'difficult'],
    ['difficult', 'hard', 'difficult'],
    ['difficult', 'good', 'difficult'],
    ['mastered', 'again', 'learning'],
    ['mastered', 'hard', 'difficult'],
    ['mastered', 'good', 'mastered'],
  ];
  it.each(table)('%s + %s → %s', (from, rating, to) => {
    const next = applyRating(inStatus(from), ID, rating, T0, 3);
    expect(next.status).toBe(to);
  });
});

describe('applyRating counters and flags', () => {
  it('creates a record for a new card and counts attempts per rating', () => {
    const p = rateSequence([['again', 0], ['hard', 0], ['good', 0], ['good', 1]]);
    expect(p).toMatchObject({ attempts: 4, againCount: 1, hardCount: 1, goodCount: 2, lastRating: 'good' });
    expect(p.firstReviewedAt).toBe(T0);
    expect(p.lastReviewedAt).toBe(T0 + DAY);
  });

  it('sets missed on Again, keeps it on Hard, clears it on Good', () => {
    let p = applyRating(undefined, ID, 'again', T0, 3);
    expect(p.missed).toBe(true);
    p = applyRating(p, ID, 'hard', T0, 3);
    expect(p.missed).toBe(true);
    p = applyRating(p, ID, 'good', T0, 3);
    expect(p.missed).toBe(false);
  });

  it('counts a lapse when a mastered card is rated Again', () => {
    const p = applyRating(inStatus('mastered'), ID, 'again', T0, 3);
    expect(p.lapses).toBe(1);
    expect(p.goodStreak).toBe(0);
  });

  it('does not mutate the previous record', () => {
    const prev = applyRating(undefined, ID, 'good', T0, 3);
    const snapshot = { ...prev };
    applyRating(prev, ID, 'again', T0 + DAY, 3);
    expect(prev).toEqual(snapshot);
  });
});

describe('mastery on separate days', () => {
  it('masters after 3 Good ratings on 3 different days', () => {
    expect(rateSequence([['good', 0], ['good', 1]]).status).toBe('learning');
    expect(rateSequence([['good', 0], ['good', 1], ['good', 2]]).status).toBe('mastered');
  });

  it('credits at most one Good per day', () => {
    const p = rateSequence([['good', 0], ['good', 0], ['good', 0], ['good', 0]]);
    expect(p.goodStreak).toBe(1);
    expect(p.status).toBe('learning');
  });

  it('gives no streak credit on a day the card was failed', () => {
    const p = rateSequence([['good', 0], ['again', 1], ['good', 1]]);
    expect(p.goodStreak).toBe(0);
    expect(rateSequence([['good', 0], ['again', 1], ['good', 1], ['good', 2]]).goodStreak).toBe(1);
  });

  it('takes a Difficult card straight to Mastered after enough Good days', () => {
    const p = rateSequence([['hard', 0], ['good', 1], ['good', 2], ['good', 3]]);
    expect(p.status).toBe('mastered');
  });

  it('respects a configurable threshold', () => {
    expect(rateSequence([['good', 0]], 1).status).toBe('mastered');
    expect(rateSequence([['good', 0], ['good', 1], ['good', 2]], 5).status).toBe('learning');
  });

  it('uses local calendar days', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 0, 6, 0, 1).getTime())).toBe('2026-01-06');
  });
});

describe('statusOf', () => {
  it('treats a missing record as New', () => {
    expect(statusOf(undefined)).toBe('new');
  });
});
