import { describe, expect, it } from 'vitest';
import { applyRating } from '../../src/domain/scheduler';
import { selectCards } from '../../src/domain/selection';
import type { Progress, Rating } from '../../src/domain/types';
import { makeCards } from './helpers';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 9, 20, 12).getTime();
const settings = { sessionSize: 0, resurfaceDays: 7 };

const cards = makeCards([
  ['Ch A', 2, 'S1'],
  ['Ch A', 1, 'S2'],
  ['Ch A', 3, 'S1'],
  ['Ch B', 1, 'S1'],
  ['Ch B', 2, 'S2'],
  ['Ch B', 3, 'S2'],
]);

function progressOf(entries: [string, Rating[], number][]): Map<string, Progress> {
  const map = new Map<string, Progress>();
  for (const [id, ratings, daysAgo] of entries) {
    let p: Progress | undefined;
    ratings.forEach((r, i) => (p = applyRating(p, id, r, NOW - (daysAgo + ratings.length - 1 - i) * DAY, 3)));
    map.set(id, p!);
  }
  return map;
}

describe('selectCards', () => {
  it('chapter mode returns all cards in card-number order, optionally by section', () => {
    expect(selectCards({ kind: 'chapter', chapter: 'Ch A' }, cards, new Map(), settings, NOW, false))
      .toEqual(['Ch A#1', 'Ch A#2', 'Ch A#3']);
    expect(selectCards({ kind: 'chapter', chapter: 'Ch B', section: 'S2' }, cards, new Map(), settings, NOW, false))
      .toEqual(['Ch B#2', 'Ch B#3']);
  });

  it('new mode returns only unreviewed cards and honours the session size', () => {
    const progress = progressOf([['Ch A#2', ['good'], 0]]);
    expect(selectCards({ kind: 'new' }, cards, progress, { ...settings, sessionSize: 2 }, NOW, false))
      .toEqual(['Ch A#1', 'Ch A#3']);
  });

  it('missed and difficult modes filter by flag and status, oldest first', () => {
    const progress = progressOf([
      ['Ch A#1', ['again'], 1],
      ['Ch A#3', ['again'], 5],
      ['Ch B#1', ['hard'], 2],
      ['Ch B#2', ['hard', 'again'], 0],
    ]);
    expect(selectCards({ kind: 'missed' }, cards, progress, settings, NOW, false)).toEqual(['Ch A#3', 'Ch A#1', 'Ch B#2']);
    expect(selectCards({ kind: 'difficult' }, cards, progress, settings, NOW, false)).toEqual(['Ch B#1', 'Ch B#2']);
  });

  it('review mode orders missed → difficult → learning → new → stale mastered', () => {
    const progress = progressOf([
      ['Ch A#2', ['good', 'good', 'good'], 10], // mastered, stale
      ['Ch A#1', ['good', 'good', 'good'], 1], // mastered, recent → excluded
      ['Ch A#3', ['good'], 0], // learning
      ['Ch B#1', ['hard'], 0], // difficult
      ['Ch B#2', ['again'], 0], // missed
    ]);
    expect(selectCards({ kind: 'review' }, cards, progress, settings, NOW, false))
      .toEqual(['Ch B#2', 'Ch B#1', 'Ch A#3', 'Ch B#3', 'Ch A#2']);
  });

  it('review mode limits to the session size after prioritising', () => {
    const progress = progressOf([['Ch B#3', ['again'], 0]]);
    expect(selectCards({ kind: 'review' }, cards, progress, { ...settings, sessionSize: 2 }, NOW, false))
      .toEqual(['Ch B#3', 'Ch A#2']);
  });

  it('shuffle keeps the same chosen cards', () => {
    const progress = progressOf([['Ch B#3', ['again'], 0]]);
    const chosen = selectCards({ kind: 'review' }, cards, progress, { ...settings, sessionSize: 3 }, NOW, false);
    const shuffled = selectCards({ kind: 'review' }, cards, progress, { ...settings, sessionSize: 3 }, NOW, true, () => 0.1);
    expect([...shuffled].sort()).toEqual([...chosen].sort());
  });
});
