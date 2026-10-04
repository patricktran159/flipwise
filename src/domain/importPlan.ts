import type { Card } from './types';

export interface ImportPlan {
  isReplace: boolean;
  added: Card[];
  removed: Card[];
  /** Cards whose ID matches but whose text or section changed (progress is kept). */
  changed: Card[];
  unchanged: number;
  /** Incoming cards that already have progress (including restored orphans). */
  progressRetained: number;
  /** Incoming cards that regain progress kept from an earlier removal. */
  progressRestored: number;
  /** Progress records that will have no matching card after the import. */
  orphanedProgress: number;
}

export function planImport(existing: Card[], incoming: Card[], progressIds: Iterable<string>): ImportPlan {
  const before = new Map(existing.map((c) => [c.id, c]));
  const after = new Set(incoming.map((c) => c.id));
  const withProgress = new Set(progressIds);

  const added: Card[] = [];
  const changed: Card[] = [];
  let unchanged = 0;
  let progressRetained = 0;
  let progressRestored = 0;

  for (const card of incoming) {
    const old = before.get(card.id);
    if (withProgress.has(card.id)) {
      progressRetained++;
      if (!old) progressRestored++;
    }
    if (!old) added.push(card);
    else if (old.question !== card.question || old.answer !== card.answer || old.section !== card.section) changed.push(card);
    else unchanged++;
  }

  const removed = existing.filter((c) => !after.has(c.id));
  let orphanedProgress = 0;
  for (const id of withProgress) if (!after.has(id)) orphanedProgress++;

  return {
    isReplace: existing.length > 0,
    added,
    removed,
    changed,
    unchanged,
    progressRetained,
    progressRestored,
    orphanedProgress,
  };
}
