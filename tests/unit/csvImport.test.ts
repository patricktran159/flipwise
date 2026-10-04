import { describe, expect, it } from 'vitest';
import { parseFlashcardCsv } from '../../src/domain/csvImport';

const HEADER = 'Chapter,CardNumber,Section,Question,Answer';

describe('parseFlashcardCsv', () => {
  it('parses quoted fields with commas, escaped quotes, apostrophes and brackets', () => {
    const csv = [
      HEADER,
      '"Chapter 1: Data Management","1","CDMP Exam Focus","What is DM, really?","It\'s the ""development"", execution (and) supervision [of plans]."',
    ].join('\n');
    const r = parseFlashcardCsv(csv);
    expect(r.ok).toBe(true);
    expect(r.cards).toHaveLength(1);
    expect(r.cards[0]).toMatchObject({
      id: 'Chapter 1: Data Management#1',
      chapter: 'Chapter 1: Data Management',
      cardNumber: 1,
      section: 'CDMP Exam Focus',
      question: 'What is DM, really?',
      answer: 'It\'s the "development", execution (and) supervision [of plans].',
    });
  });

  it('handles CRLF, a BOM, multi-line fields and unquoted fields', () => {
    const csv = '﻿' + HEADER + '\r\nCh A,1,S,Q1,"line one\r\nline two"\r\nCh A,2,S,Q2,A2\r\n';
    const r = parseFlashcardCsv(csv);
    expect(r.ok).toBe(true);
    expect(r.cards.map((c) => c.answer)).toEqual(['line one\r\nline two', 'A2']);
  });

  it('accepts headers in any order and case, and warns about extra columns', () => {
    const csv = 'answer, question ,Notes,SECTION,Card Number,chapter\nA1,Q1,x,S,7,Ch';
    const r = parseFlashcardCsv(csv);
    expect(r.ok).toBe(true);
    expect(r.cards[0]).toMatchObject({ chapter: 'Ch', cardNumber: 7, section: 'S', question: 'Q1', answer: 'A1' });
    expect(r.warnings.some((w) => w.message.includes('Notes'))).toBe(true);
  });

  it('rejects files missing required columns', () => {
    const r = parseFlashcardCsv('Chapter,CardNumber,Question,Answer\nCh,1,Q,A');
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toContain('Section');
  });

  it('rejects empty files and header-only files', () => {
    expect(parseFlashcardCsv('').ok).toBe(false);
    expect(parseFlashcardCsv('   \n').ok).toBe(false);
    const r = parseFlashcardCsv(HEADER + '\n');
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toContain('no cards');
  });

  it('skips and counts empty rows', () => {
    const csv = [HEADER, 'Ch,1,S,Q,A', '', ',,,,', '  , , , , ', 'Ch,2,S,Q,A', ''].join('\n');
    const r = parseFlashcardCsv(csv);
    expect(r.ok).toBe(true);
    expect(r.cards).toHaveLength(2);
    expect(r.skippedEmptyRows).toBe(3);
  });

  it('reports empty questions and answers with spreadsheet row numbers', () => {
    const csv = [HEADER, 'Ch,1,S,Q,A', 'Ch,2,S,,A', 'Ch,3,S,Q,"  "'].join('\n');
    const r = parseFlashcardCsv(csv);
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual([
      { row: 3, message: 'Question is empty.' },
      { row: 4, message: 'Answer is empty.' },
    ]);
  });

  it('reports duplicate identifiers, treating 01 and 1 and extra spaces as the same card', () => {
    const csv = [HEADER, 'Ch  A,1,S,Q,A', 'Ch A,01,S,Q2,A2'].join('\n');
    const r = parseFlashcardCsv(csv);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatchObject({ row: 3 });
    expect(r.errors[0].message).toContain('row 2');
  });

  it('allows the same card number in different chapters', () => {
    const r = parseFlashcardCsv([HEADER, 'Ch A,1,S,Q,A', 'Ch B,1,S,Q,A'].join('\n'));
    expect(r.ok).toBe(true);
  });

  it('rejects invalid card numbers and empty chapters', () => {
    const r = parseFlashcardCsv([HEADER, 'Ch,abc,S,Q,A', 'Ch,0,S,Q,A', ',1,S,Q,A', 'Ch,,S,Q,A'].join('\n'));
    expect(r.ok).toBe(false);
    expect(r.errors.map((e) => e.row)).toEqual([2, 3, 4, 5]);
  });

  it('rejects rows with the wrong number of columns (unquoted comma)', () => {
    const r = parseFlashcardCsv([HEADER, 'Ch,1,S,What is X, Y?,A'].join('\n'));
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toContain('Expected 5 columns but found 6');
  });

  it('rejects malformed quotes', () => {
    const r = parseFlashcardCsv([HEADER, 'Ch,1,S,"unclosed question,A'].join('\n'));
    expect(r.ok).toBe(false);
    expect(r.errors[0].message).toContain('Malformed quotes');
  });

  it('defaults an empty section to General with a warning', () => {
    const r = parseFlashcardCsv([HEADER, 'Ch,1,,Q,A'].join('\n'));
    expect(r.ok).toBe(true);
    expect(r.cards[0].section).toBe('General');
    expect(r.warnings).toHaveLength(1);
  });

  it('warns about replacement characters from a non-UTF-8 save', () => {
    const r = parseFlashcardCsv([HEADER, 'Ch,1,S,Caf�?,A'].join('\n'));
    expect(r.ok).toBe(true);
    expect(r.warnings[0].message).toContain('CSV UTF-8');
  });

  it('orders chapters and sections by first appearance, not alphabetically', () => {
    const csv = [HEADER, 'Chapter 2: B,1,Zeta,Q,A', 'Chapter 10: J,1,Alpha,Q,A', 'Chapter 2: B,2,Alpha,Q,A'].join('\n');
    const r = parseFlashcardCsv(csv);
    expect(r.cards.map((c) => [c.chapterOrder, c.sectionOrder])).toEqual([[0, 0], [1, 1], [0, 1]]);
    expect(r.chapterCount).toBe(2);
    expect(r.sectionCount).toBe(2);
  });

  it('parses 5,000 cards quickly', () => {
    const rows = [HEADER];
    for (let i = 1; i <= 5000; i++) {
      rows.push(`"Chapter ${(i % 17) + 1}: Topic","${i}","Section ${i % 8}","Question ${i}, with a comma?","${'Long answer text. '.repeat(20)}"`);
    }
    const t = performance.now();
    const r = parseFlashcardCsv(rows.join('\n'));
    expect(r.ok).toBe(true);
    expect(r.cards).toHaveLength(5000);
    expect(performance.now() - t).toBeLessThan(2000);
  });
});
