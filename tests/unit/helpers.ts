import { makeCardId } from '../../src/domain/cardId';
import type { Card } from '../../src/domain/types';

/** Build cards: spec is [chapter, cardNumber, section?] tuples, in CSV order. */
export function makeCards(spec: [string, number, string?][]): Card[] {
  const chapters = new Map<string, number>();
  const sections = new Map<string, number>();
  return spec.map(([chapter, cardNumber, section = 'S'], rowOrder) => {
    if (!chapters.has(chapter)) chapters.set(chapter, chapters.size);
    if (!sections.has(section)) sections.set(section, sections.size);
    return {
      id: makeCardId(chapter, cardNumber),
      chapter,
      cardNumber,
      section,
      question: `Q ${chapter} ${cardNumber}`,
      answer: `A ${chapter} ${cardNumber}`,
      chapterOrder: chapters.get(chapter)!,
      sectionOrder: sections.get(section)!,
      rowOrder,
    };
  });
}
