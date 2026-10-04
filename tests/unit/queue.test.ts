import { describe, expect, it } from 'vitest';
import { againPosition, createSession, isFinished, rateInSession, shuffle } from '../../src/domain/queue';

const mid = () => 0.5; // jitter 0 → exact gap
const ids = (n: number) => Array.from({ length: n }, (_, i) => `c${i + 1}`);
const start = (n: number) => createSession({ kind: 'review' }, 'Review', ids(n), false, 0);

describe('rateInSession', () => {
  it('removes a card rated Good and counts it completed', () => {
    const s = rateInSession(start(3), 'good', 4, false, mid);
    expect(s.queue).toEqual(['c2', 'c3']);
    expect(s.completed).toBe(1);
    expect(s.counts.good).toBe(1);
  });

  it('reinserts an Again card after several other cards', () => {
    const s = rateInSession(start(10), 'again', 4, false, mid);
    expect(s.queue.slice(0, 5)).toEqual(['c2', 'c3', 'c4', 'c5', 'c1']);
    expect(s.queue).toHaveLength(10);
    expect(s.completed).toBe(0);
  });

  it('puts an Again card at the end when few cards remain', () => {
    const s = rateInSession(start(3), 'again', 4, false, mid);
    expect(s.queue).toEqual(['c2', 'c3', 'c1']);
  });

  it('shows the last remaining card again immediately after Again', () => {
    const s = rateInSession(start(1), 'again', 4, false, mid);
    expect(s.queue).toEqual(['c1']);
    expect(isFinished(s)).toBe(false);
  });

  it('requeues a Hard card once at the end, then finishes it', () => {
    let s = rateInSession(start(3), 'hard', 4, false, mid);
    expect(s.queue).toEqual(['c2', 'c3', 'c1']);
    s = rateInSession(s, 'good', 4, false, mid);
    s = rateInSession(s, 'good', 4, false, mid);
    s = rateInSession(s, 'hard', 4, false, mid);
    expect(isFinished(s)).toBe(true);
    expect(s.completed).toBe(3);
    expect(s.counts).toEqual({ again: 0, hard: 2, good: 2 });
  });

  it('records newly mastered cards once', () => {
    const s = rateInSession(start(2), 'good', 4, true, mid);
    expect(s.newlyMastered).toEqual(['c1']);
  });

  it('does not mutate the input session', () => {
    const s0 = start(3);
    const copy = structuredClone(s0);
    rateInSession(s0, 'again', 4, false, mid);
    rateInSession(s0, 'hard', 4, false, mid);
    expect(s0).toEqual(copy);
  });

  it('finishes a session only when every card has been rated Good or Hard twice', () => {
    let s = start(2);
    s = rateInSession(s, 'again', 4, false, mid); // c2, c1
    s = rateInSession(s, 'good', 4, false, mid); // c1
    s = rateInSession(s, 'again', 4, false, mid); // c1
    s = rateInSession(s, 'good', 4, false, mid);
    expect(isFinished(s)).toBe(true);
    expect(s.completed).toBe(2);
  });
});

describe('againPosition', () => {
  it('jitters the gap by ±1 and never returns less than 1', () => {
    expect(againPosition(4, 20, () => 0)).toBe(3);
    expect(againPosition(4, 20, () => 0.99)).toBe(5);
    expect(againPosition(1, 20, () => 0)).toBe(1);
    expect(againPosition(4, 0, () => 0.5)).toBe(0);
  });
});

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = ids(50);
    const out = shuffle(input);
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual([...input].sort());
  });
});
