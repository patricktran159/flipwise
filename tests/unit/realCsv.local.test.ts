import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseFlashcardCsv } from '../../src/domain/csvImport';

const FILE = 'CDMP_flashcards_30_per_chapter.csv';

// Runs only on a machine that has the real (uncommitted) CSV.
describe.skipIf(!existsSync(FILE))('local study CSV (optional)', () => {
  it('imports cleanly', () => {
    const r = parseFlashcardCsv(readFileSync(FILE, 'utf8'));
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.cards.length).toBeGreaterThan(0);
    expect(r.chapterCount).toBe(17);
  });
});
