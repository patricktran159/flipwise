import { shuffle, type Rng } from './queue';
import { statusOf } from './scheduler';
import type { Card, Progress, Settings, StudyMode } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function modeTitle(mode: StudyMode): string {
  switch (mode.kind) {
    case 'review': return 'Review';
    case 'new': return 'New Cards';
    case 'missed': return 'Missed Cards';
    case 'difficult': return 'Difficult Cards';
    case 'chapter': return mode.section ? `${mode.chapter} · ${mode.section}` : mode.chapter;
  }
}

const byCsvOrder = (a: Card, b: Card) => a.rowOrder - b.rowOrder;
const byChapterNumber = (a: Card, b: Card) => a.chapterOrder - b.chapterOrder || a.cardNumber - b.cardNumber;

/**
 * Pick and order the cards for a study mode. Shuffle is applied after the
 * cards are chosen, so Start Review's priority still decides which cards go in.
 */
export function selectCards(
  mode: StudyMode,
  cards: Card[],
  progress: Map<string, Progress>,
  settings: Pick<Settings, 'sessionSize' | 'resurfaceDays'>,
  now: number,
  shuffled: boolean,
  rng: Rng = Math.random,
): string[] {
  const p = (c: Card) => progress.get(c.id);
  const oldestFirst = (a: Card, b: Card) =>
    (p(a)?.lastReviewedAt ?? 0) - (p(b)?.lastReviewedAt ?? 0) || byCsvOrder(a, b);
  const limit = (list: Card[]) => (settings.sessionSize > 0 ? list.slice(0, settings.sessionSize) : list);

  let chosen: Card[];
  switch (mode.kind) {
    case 'chapter':
      chosen = cards
        .filter((c) => c.chapter === mode.chapter && (!mode.section || c.section === mode.section))
        .sort(byChapterNumber);
      break;
    case 'new':
      chosen = cards.filter((c) => !p(c)).sort(byCsvOrder);
      // When shuffling, sample from all new cards rather than only the first N.
      chosen = limit(shuffled ? shuffle(chosen, rng) : chosen);
      break;
    case 'missed':
      chosen = cards.filter((c) => p(c)?.missed).sort(oldestFirst);
      break;
    case 'difficult':
      chosen = cards.filter((c) => statusOf(p(c)) === 'difficult').sort(oldestFirst);
      break;
    case 'review': {
      const staleBefore = now - settings.resurfaceDays * DAY_MS;
      const tiers: Card[][] = [[], [], [], [], []];
      for (const c of cards) {
        const pr = p(c);
        const s = statusOf(pr);
        if (pr?.missed) tiers[0].push(c);
        else if (s === 'difficult') tiers[1].push(c);
        else if (s === 'learning') tiers[2].push(c);
        else if (s === 'new') tiers[3].push(c);
        else if (pr && pr.lastReviewedAt <= staleBefore) tiers[4].push(c);
      }
      tiers[0].sort(oldestFirst);
      tiers[1].sort(oldestFirst);
      tiers[2].sort(oldestFirst);
      tiers[3].sort(byCsvOrder);
      tiers[4].sort(oldestFirst);
      chosen = limit(tiers.flat());
      break;
    }
  }

  const ids = chosen.map((c) => c.id);
  return shuffled ? shuffle(ids, rng) : ids;
}
