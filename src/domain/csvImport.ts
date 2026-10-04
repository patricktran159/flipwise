import Papa from 'papaparse';
import { makeCardId, normalizeText } from './cardId';
import type { Card } from './types';

export const REQUIRED_COLUMNS = ['Chapter', 'CardNumber', 'Section', 'Question', 'Answer'] as const;
type Column = (typeof REQUIRED_COLUMNS)[number];

export const DEFAULT_SECTION = 'General';

export interface ImportIssue {
  /** Spreadsheet row number (header is row 1), when the issue belongs to a row. */
  row?: number;
  message: string;
}

export interface ParseResult {
  ok: boolean;
  cards: Card[];
  errors: ImportIssue[];
  warnings: ImportIssue[];
  skippedEmptyRows: number;
  chapterCount: number;
  sectionCount: number;
}

const headerKey = (h: string) => h.replace(/^﻿/, '').replace(/[\s_-]+/g, '').toLowerCase();

export function parseFlashcardCsv(text: string): ParseResult {
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const fail = (): ParseResult => ({
    ok: false, cards: [], errors, warnings, skippedEmptyRows: 0, chapterCount: 0, sectionCount: 0,
  });

  const source = text.replace(/^﻿/, '');
  if (source.trim() === '') {
    errors.push({ message: 'The file is empty.' });
    return fail();
  }

  const parsed = Papa.parse<string[]>(source, {
    header: false,
    skipEmptyLines: false,
    delimitersToGuess: [',', ';', '\t'],
  });

  for (const e of parsed.errors) {
    if (e.code === 'UndetectableDelimiter') continue; // single-column files are caught by the header check
    errors.push({
      row: e.row !== undefined ? e.row + 1 : undefined,
      message: e.code === 'MissingQuotes' || e.code === 'InvalidQuotes'
        ? 'Malformed quotes: a quoted field is not closed or contains an unescaped quote. Use "" for a quote inside a quoted field.'
        : e.message,
    });
  }
  if (errors.length) return fail();

  const rows = parsed.data;
  const header = rows[0] ?? [];
  const index = new Map<Column, number>();
  const seen = new Map<string, number>();
  header.forEach((h, i) => {
    const key = headerKey(h);
    if (seen.has(key) && key) errors.push({ row: 1, message: `Column "${h.trim()}" appears more than once.` });
    seen.set(key, i);
  });
  const missing: string[] = [];
  for (const col of REQUIRED_COLUMNS) {
    const i = seen.get(col.toLowerCase());
    if (i === undefined) missing.push(col);
    else index.set(col, i);
  }
  if (missing.length) {
    errors.push({
      row: 1,
      message: `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. ` +
        `The first row must contain: ${REQUIRED_COLUMNS.join(', ')}.`,
    });
  }
  if (errors.length) return fail();

  const extra = header.filter((h) => !REQUIRED_COLUMNS.some((c) => c.toLowerCase() === headerKey(h)) && h.trim());
  if (extra.length) warnings.push({ row: 1, message: `Ignored extra column(s): ${extra.map((h) => h.trim()).join(', ')}.` });

  const cards: Card[] = [];
  const idRow = new Map<string, number>();
  const chapterOrder = new Map<string, number>();
  const sectionOrder = new Map<string, number>();
  let skippedEmptyRows = 0;
  let replacementCharRows = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNo = r + 1;
    if (row.every((f) => f.trim() === '')) {
      // A trailing newline produces one empty record; don't count it as a skipped row.
      if (!(r === rows.length - 1 && row.length === 1)) skippedEmptyRows++;
      continue;
    }
    if (row.length !== header.length) {
      errors.push({
        row: rowNo,
        message: `Expected ${header.length} columns but found ${row.length}. ` +
          'Text containing commas must be wrapped in double quotes.',
      });
      continue;
    }

    const get = (c: Column) => row[index.get(c)!];
    const chapter = normalizeText(get('Chapter'));
    const numberText = get('CardNumber').trim();
    const sectionRaw = normalizeText(get('Section'));
    const question = get('Question').trim();
    const answer = get('Answer').trim();

    const rowErrors: string[] = [];
    if (!chapter) rowErrors.push('Chapter is empty');
    if (!/^\d+$/.test(numberText) || Number(numberText) < 1) {
      rowErrors.push(numberText ? `CardNumber "${numberText}" is not a positive whole number` : 'CardNumber is empty');
    }
    if (!question) rowErrors.push('Question is empty');
    if (!answer) rowErrors.push('Answer is empty');
    if (rowErrors.length) {
      errors.push({ row: rowNo, message: rowErrors.join('; ') + '.' });
      continue;
    }

    const cardNumber = Number(numberText);
    const id = makeCardId(chapter, cardNumber);
    const firstRow = idRow.get(id);
    if (firstRow !== undefined) {
      errors.push({ row: rowNo, message: `Duplicate card: "${chapter}" #${cardNumber} also appears on row ${firstRow}.` });
      continue;
    }
    idRow.set(id, rowNo);

    let section = sectionRaw;
    if (!section) {
      section = DEFAULT_SECTION;
      warnings.push({ row: rowNo, message: `Section is empty; using "${DEFAULT_SECTION}".` });
    }
    if (row.some((f) => f.includes('�'))) replacementCharRows++;

    if (!chapterOrder.has(chapter)) chapterOrder.set(chapter, chapterOrder.size);
    if (!sectionOrder.has(section)) sectionOrder.set(section, sectionOrder.size);

    cards.push({
      id,
      chapter,
      cardNumber,
      section,
      question,
      answer,
      chapterOrder: chapterOrder.get(chapter)!,
      sectionOrder: sectionOrder.get(section)!,
      rowOrder: cards.length,
    });
  }

  if (replacementCharRows) {
    warnings.push({
      message: `${replacementCharRows} row(s) contain unreadable characters (�). ` +
        'Re-save the file as "CSV UTF-8" in Excel to fix accented letters and symbols.',
    });
  }
  if (!errors.length && cards.length === 0) errors.push({ message: 'The file has a header row but no cards.' });

  if (errors.length) return fail();
  return {
    ok: true,
    cards,
    errors,
    warnings,
    skippedEmptyRows,
    chapterCount: chapterOrder.size,
    sectionCount: sectionOrder.size,
  };
}
