/** Trim and collapse internal whitespace so cosmetic edits don't change identity. */
export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function makeCardId(chapter: string, cardNumber: number): string {
  return `${normalizeText(chapter)}#${cardNumber}`;
}
