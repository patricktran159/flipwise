import { describe, expect, it } from 'vitest';
import { applyRating } from '../../src/domain/scheduler';
import { computeStats } from '../../src/domain/stats';
import type { Progress } from '../../src/domain/types';
import { makeCards } from './helpers';

describe('computeStats', () => {
  const cards = makeCards([
    ['Ch 2', 1, 'Beta'],
    ['Ch 2', 2, 'Alpha'],
    ['Ch 10', 1, 'Alpha'],
    ['Ch 10', 2, 'Alpha'],
  ]);
  const progress = new Map<string, Progress>([
    ['Ch 2#1', { ...applyRating(undefined, 'Ch 2#1', 'good', 0, 1) }],
    ['Ch 10#1', applyRating(undefined, 'Ch 10#1', 'again', 0, 3)],
    ['Ch 10#2', applyRating(undefined, 'Ch 10#2', 'hard', 0, 3)],
    ['Orphan#1', applyRating(undefined, 'Orphan#1', 'good', 0, 1)],
  ]);
  const stats = computeStats(cards, progress);

  it('counts statuses overall and ignores orphaned progress', () => {
    expect(stats.overall).toEqual({ total: 4, new: 1, learning: 1, difficult: 1, mastered: 1, missed: 1, masteryPct: 25 });
  });

  it('groups chapters and sections in CSV order', () => {
    expect(stats.chapters.map((c) => c.chapter)).toEqual(['Ch 2', 'Ch 10']);
    expect(stats.chapters[0].sections.map((s) => s.section)).toEqual(['Beta', 'Alpha']);
    expect(stats.chapters[0]).toMatchObject({ total: 2, mastered: 1, masteryPct: 50 });
    expect(stats.chapters[1]).toMatchObject({ total: 2, mastered: 0, masteryPct: 0, difficult: 1, learning: 1 });
  });
});
