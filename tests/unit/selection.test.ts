import { describe, expect, it } from 'vitest';
import { applyRating } from '../../src/domain/scheduler';
import { countDue, countDueTomorrow, newSessionCount, nextNewChapter, selectCards } from '../../src/domain/selection';
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

  it('new mode stays within the first chapter that has new cards', () => {
    expect(selectCards({ kind: 'new' }, cards, new Map(), settings, NOW, false)).toEqual(['Ch A#2', 'Ch A#1', 'Ch A#3']);
    const progress = progressOf([['Ch A#1', ['good'], 0], ['Ch A#2', ['good'], 0], ['Ch A#3', ['good'], 0], ['Ch B#1', ['good'], 0]]);
    expect(selectCards({ kind: 'new' }, cards, progress, settings, NOW, false)).toEqual(['Ch B#2', 'Ch B#3']);
  });

  it('new mode takes a whole chapter when it is at most half a session bigger', () => {
    const big = makeCards(Array.from({ length: 50 }, (_, i): [string, number] => [i < 23 ? 'One' : 'Two', i + 1]));
    expect(selectCards({ kind: 'new' }, big, new Map(), { ...settings, sessionSize: 20 }, NOW, false)).toHaveLength(23);
    const twoOnly = big.filter((c) => c.chapter === 'Two'); // 27 cards
    expect(selectCards({ kind: 'new' }, twoOnly, new Map(), { ...settings, sessionSize: 20 }, NOW, false)).toHaveLength(27);
    expect(selectCards({ kind: 'new' }, big.map((c) => ({ ...c, chapter: 'One' })), new Map(), { ...settings, sessionSize: 20 }, NOW, false)).toHaveLength(20);
  });

  it('newSessionCount keeps small remainders in the same session', () => {
    expect(newSessionCount(23, 20)).toBe(23);
    expect(newSessionCount(30, 20)).toBe(30);
    expect(newSessionCount(31, 20)).toBe(20);
    expect(newSessionCount(12, 20)).toBe(12);
    expect(newSessionCount(500, 0)).toBe(500);
  });

  it('countDueTomorrow counts cards rated today plus mastered cards reaching their check', () => {
    const progress = progressOf([
      ['Ch A#1', ['good'], 0], // learning, credited today → due tomorrow
      ['Ch A#2', ['good', 'good', 'good'], 6], // mastered 6 days ago → due tomorrow (7 days)
      ['Ch A#3', ['good', 'good', 'good'], 2], // mastered recently → not due
    ]);
    expect(countDue(cards, progress, 7, NOW)).toBe(0);
    expect(countDueTomorrow(cards, progress, 7, NOW)).toBe(2);
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

  it('review mode takes due cards only: missed → difficult → learning → stale mastered', () => {
    const progress = progressOf([
      ['Ch A#2', ['good', 'good', 'good'], 10], // mastered, stale
      ['Ch A#1', ['good', 'good', 'good'], 1], // mastered, recent → not due
      ['Ch A#3', ['good'], 1], // learning, last seen yesterday
      ['Ch B#1', ['hard'], 2], // difficult, last seen 2 days ago
      ['Ch B#2', ['again'], 0], // missed today → still due
      // Ch B#3 is new → learned separately, not reviewed
    ]);
    expect(selectCards({ kind: 'review' }, cards, progress, settings, NOW, false))
      .toEqual(['Ch B#2', 'Ch B#1', 'Ch A#3', 'Ch A#2']);
  });

  it('review mode skips learning and difficult cards already rated today', () => {
    const progress = progressOf([
      ['Ch A#1', ['good'], 0], // credited today → back tomorrow
      ['Ch A#2', ['hard'], 0], // rated today → back tomorrow
      ['Ch A#3', ['again', 'good'], 0], // missed then got right today → back tomorrow
      ['Ch B#1', ['good'], 1],
    ]);
    expect(selectCards({ kind: 'review' }, cards, progress, settings, NOW, false)).toEqual(['Ch B#1']);
    expect(countDue(cards, progress, settings.resurfaceDays, NOW)).toBe(1);
    expect(countDue(cards, progress, settings.resurfaceDays, NOW + DAY)).toBe(4);
  });

  it('review mode limits to the session size after prioritising', () => {
    const progress = progressOf([['Ch B#3', ['again'], 0], ['Ch A#1', ['good'], 1], ['Ch A#2', ['good'], 2]]);
    expect(selectCards({ kind: 'review' }, cards, progress, { ...settings, sessionSize: 2 }, NOW, false))
      .toEqual(['Ch B#3', 'Ch A#2']);
  });

  it('nextNewChapter points at the first chapter with new cards', () => {
    expect(nextNewChapter(cards, new Map())).toEqual({ chapter: 'Ch A', newCount: 3 });
    const progress = progressOf([['Ch A#1', ['good'], 0], ['Ch A#2', ['good'], 0], ['Ch A#3', ['good'], 0], ['Ch B#2', ['good'], 0]]);
    expect(nextNewChapter(cards, progress)).toEqual({ chapter: 'Ch B', newCount: 2 });
  });

  it('shuffle keeps the same chosen cards', () => {
    const progress = progressOf([['Ch B#3', ['again'], 0], ['Ch A#1', ['good'], 1], ['Ch A#2', ['good'], 2]]);
    const chosen = selectCards({ kind: 'review' }, cards, progress, { ...settings, sessionSize: 3 }, NOW, false);
    const shuffled = selectCards({ kind: 'review' }, cards, progress, { ...settings, sessionSize: 3 }, NOW, true, () => 0.1);
    expect([...shuffled].sort()).toEqual([...chosen].sort());
  });
});
