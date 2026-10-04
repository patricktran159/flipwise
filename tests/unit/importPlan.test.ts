import { describe, expect, it } from 'vitest';
import { planImport } from '../../src/domain/importPlan';
import { makeCards } from './helpers';

describe('planImport', () => {
  const existing = makeCards([['Ch', 1], ['Ch', 2], ['Ch', 3]]);

  it('treats a first import as all-added', () => {
    const plan = planImport([], existing, []);
    expect(plan.isReplace).toBe(false);
    expect(plan.added).toHaveLength(3);
  });

  it('classifies added, removed, changed and unchanged cards', () => {
    const incoming = makeCards([['Ch', 1], ['Ch', 2], ['Ch', 4]]);
    incoming[1] = { ...incoming[1], answer: 'Updated answer' };
    const plan = planImport(existing, incoming, ['Ch#1', 'Ch#3']);
    expect(plan.isReplace).toBe(true);
    expect(plan.added.map((c) => c.id)).toEqual(['Ch#4']);
    expect(plan.removed.map((c) => c.id)).toEqual(['Ch#3']);
    expect(plan.changed.map((c) => c.id)).toEqual(['Ch#2']);
    expect(plan.unchanged).toBe(1);
    expect(plan.progressRetained).toBe(1);
    expect(plan.orphanedProgress).toBe(1);
  });

  it('restores progress kept from a card that was removed earlier', () => {
    const plan = planImport(makeCards([['Ch', 1]]), makeCards([['Ch', 1], ['Ch', 9]]), ['Ch#9']);
    expect(plan.added.map((c) => c.id)).toEqual(['Ch#9']);
    expect(plan.progressRestored).toBe(1);
    expect(plan.progressRetained).toBe(1);
    expect(plan.orphanedProgress).toBe(0);
  });
});
