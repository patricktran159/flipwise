import { statusOf } from './scheduler';
import type { Card, Progress, Status } from './types';

export interface StatusCounts {
  total: number;
  new: number;
  learning: number;
  difficult: number;
  mastered: number;
  missed: number;
  /** Mastered / total, rounded to a whole percent. */
  masteryPct: number;
}

export interface SectionStats extends StatusCounts {
  section: string;
}

export interface ChapterStats extends StatusCounts {
  chapter: string;
  chapterOrder: number;
  sections: SectionStats[];
}

function empty(): StatusCounts {
  return { total: 0, new: 0, learning: 0, difficult: 0, mastered: 0, missed: 0, masteryPct: 0 };
}

function add(counts: StatusCounts, status: Status, missed: boolean) {
  counts.total++;
  counts[status]++;
  if (missed) counts.missed++;
}

function finish<T extends StatusCounts>(counts: T): T {
  counts.masteryPct = counts.total ? Math.round((counts.mastered / counts.total) * 100) : 0;
  return counts;
}

export function computeStats(cards: Card[], progress: Map<string, Progress>) {
  const overall = empty();
  const chapters = new Map<string, ChapterStats & { sectionMap: Map<string, SectionStats & { order: number }> }>();

  for (const card of cards) {
    const p = progress.get(card.id);
    const status = statusOf(p);
    const missed = !!p?.missed;
    add(overall, status, missed);

    let ch = chapters.get(card.chapter);
    if (!ch) {
      ch = { ...empty(), chapter: card.chapter, chapterOrder: card.chapterOrder, sections: [], sectionMap: new Map() };
      chapters.set(card.chapter, ch);
    }
    add(ch, status, missed);

    let sec = ch.sectionMap.get(card.section);
    if (!sec) {
      sec = { ...empty(), section: card.section, order: card.sectionOrder };
      ch.sectionMap.set(card.section, sec);
    }
    add(sec, status, missed);
  }

  const chapterList: ChapterStats[] = [...chapters.values()]
    .sort((a, b) => a.chapterOrder - b.chapterOrder)
    .map(({ sectionMap, ...ch }) => ({
      ...finish(ch),
      sections: [...sectionMap.values()]
        .sort((a, b) => a.order - b.order)
        .map(({ order: _order, ...s }) => finish(s)),
    }));

  return { overall: finish(overall), chapters: chapterList };
}
