import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { openFlashcardDB } from '../../src/data/db';
import { Repo, validateBackup } from '../../src/data/repo';
import { parseFlashcardCsv } from '../../src/domain/csvImport';
import { planImport } from '../../src/domain/importPlan';
import { createSession, rateInSession } from '../../src/domain/queue';
import { applyRating, statusOf } from '../../src/domain/scheduler';
import type { Rating, Session } from '../../src/domain/types';

const HEADER = 'Chapter,CardNumber,Section,Question,Answer';
const csv = (...rows: string[]) => parseFlashcardCsv([HEADER, ...rows].join('\n')).cards;
const NOW = new Date(2026, 9, 4, 9).getTime();

let repo: Repo;
let dbCounter = 0;

beforeEach(async () => {
  repo = new Repo(await openFlashcardDB(`test-${++dbCounter}`));
});

async function rate(session: Session, rating: Rating, now = NOW): Promise<Session> {
  const data = await repo.loadAll();
  const cardId = session.queue[0];
  const prev = data.progress.get(cardId) ?? null;
  const next = applyRating(prev, cardId, rating, now, data.settings.masteryThreshold);
  return repo.recordRating({
    progress: next,
    prevProgress: prev,
    log: { cardId, rating, at: now, statusBefore: statusOf(prev), statusAfter: next.status },
    prevSession: session,
    nextSession: rateInSession(session, rating, 4, false, () => 0.5),
  });
}

describe('Repo', () => {
  it('imports cards and loads them back in CSV order', async () => {
    const cards = csv('Ch,2,S,Q2,A2', 'Ch,1,S,Q1,A1');
    await repo.commitImport(cards, { importedAt: NOW, sourceFileName: 'a.csv', cardCount: 2 });
    const data = await repo.loadAll();
    expect(data.cards.map((c) => c.id)).toEqual(['Ch#2', 'Ch#1']);
    expect(data.importMeta?.sourceFileName).toBe('a.csv');
    expect(data.settings.masteryThreshold).toBe(3);
  });

  it('records a rating, progress, log and session together', async () => {
    await repo.commitImport(csv('Ch,1,S,Q,A', 'Ch,2,S,Q,A'), { importedAt: NOW, sourceFileName: 'a.csv', cardCount: 2 });
    let s = createSession({ kind: 'review' }, 'Review', ['Ch#1', 'Ch#2'], false, NOW);
    s = await rate(s, 'again');
    const data = await repo.loadAll();
    expect(data.progress.get('Ch#1')).toMatchObject({ status: 'learning', missed: true, againCount: 1 });
    expect(data.session?.queue).toEqual(['Ch#2', 'Ch#1']);
    expect(await repo.reviewLogSince(NOW - 1)).toHaveLength(1);
    expect(s.undo).toHaveLength(1);
  });

  it('undo restores the previous progress, log and session', async () => {
    await repo.commitImport(csv('Ch,1,S,Q,A', 'Ch,2,S,Q,A'), { importedAt: NOW, sourceFileName: 'a.csv', cardCount: 2 });
    let s = createSession({ kind: 'review' }, 'Review', ['Ch#1', 'Ch#2'], false, NOW);
    s = await rate(s, 'good');
    s = await rate(s, 'hard');
    s = (await repo.undoLastRating(s))!;
    let data = await repo.loadAll();
    expect(data.progress.has('Ch#2')).toBe(false);
    expect(s.queue).toEqual(['Ch#2']);
    expect(s.undo).toHaveLength(1);
    s = (await repo.undoLastRating(s))!;
    data = await repo.loadAll();
    expect(data.progress.size).toBe(0);
    expect(data.session?.queue).toEqual(['Ch#1', 'Ch#2']);
    expect(await repo.reviewLogSince(0)).toHaveLength(0);
    expect(await repo.undoLastRating(s)).toBeNull();
  });

  it('replacing the CSV keeps progress for matching IDs and hides progress for removed cards', async () => {
    await repo.commitImport(csv('Ch,1,S,Q,A', 'Ch,2,S,Q,A', 'Ch,3,S,Q,A'), { importedAt: NOW, sourceFileName: 'v1.csv', cardCount: 3 });
    let s = createSession({ kind: 'review' }, 'Review', ['Ch#1', 'Ch#3'], false, NOW);
    s = await rate(s, 'good');
    await rate(s, 'hard');

    const before = await repo.loadAll();
    const incoming = csv('Ch,1,S,Q,"A, revised"', 'Ch,2,S,Q,A', 'Ch,4,S,Q,A');
    const plan = planImport(before.cards, incoming, before.progress.keys());
    expect(plan).toMatchObject({ progressRetained: 1, orphanedProgress: 1 });
    await repo.commitImport(incoming, { importedAt: NOW, sourceFileName: 'v2.csv', cardCount: 3 });

    const after = await repo.loadAll();
    expect(after.cards.map((c) => c.id)).toEqual(['Ch#1', 'Ch#2', 'Ch#4']);
    expect(after.cards[0].answer).toBe('A, revised');
    expect(after.progress.get('Ch#1')?.status).toBe('learning');
    expect(after.progress.has('Ch#3')).toBe(true); // hidden orphan
    expect(after.session).toBeNull();

    expect(await repo.clearOrphanedProgress(new Set(after.cards.map((c) => c.id)))).toBe(1);
    expect((await repo.loadAll()).progress.has('Ch#3')).toBe(false);
  });

  it('reviewLogSince only returns entries from the given time', async () => {
    await repo.commitImport(csv('Ch,1,S,Q,A'), { importedAt: NOW, sourceFileName: 'a.csv', cardCount: 1 });
    let s = createSession({ kind: 'review' }, 'Review', ['Ch#1'], false, NOW);
    s = await rate(s, 'again', NOW - 2 * 86_400_000);
    await rate(s, 'good', NOW);
    expect(await repo.reviewLogSince(NOW - 1000)).toHaveLength(1);
  });

  it('exports and restores a backup round trip', async () => {
    await repo.commitImport(csv('Ch,1,S,Q,A'), { importedAt: NOW, sourceFileName: 'a.csv', cardCount: 1 });
    await repo.saveSettings({ ...(await repo.loadAll()).settings, sessionSize: 50 });
    await rate(createSession({ kind: 'review' }, 'Review', ['Ch#1'], false, NOW), 'good');
    const backup = validateBackup(JSON.parse(JSON.stringify(await repo.exportBackup(NOW))));

    await repo.deleteAll();
    expect((await repo.loadAll()).cards).toHaveLength(0);

    await repo.restoreBackup(backup);
    const data = await repo.loadAll();
    expect(data.cards).toHaveLength(1);
    expect(data.progress.get('Ch#1')?.goodCount).toBe(1);
    expect(data.settings.sessionSize).toBe(50);
    expect(await repo.reviewLogSince(0)).toHaveLength(1);
  });

  it('rejects files that are not backups', () => {
    expect(() => validateBackup({ hello: 1 })).toThrow('not a Flipwise backup');
    expect(() => validateBackup({ app: 'flipwise', backupVersion: 1, cards: [] })).toThrow('incomplete');
  });

  it('resetProgress clears progress, log and session but keeps cards', async () => {
    await repo.commitImport(csv('Ch,1,S,Q,A'), { importedAt: NOW, sourceFileName: 'a.csv', cardCount: 1 });
    await rate(createSession({ kind: 'review' }, 'Review', ['Ch#1', 'Ch#1'], false, NOW), 'good');
    await repo.resetProgress();
    const data = await repo.loadAll();
    expect(data.cards).toHaveLength(1);
    expect(data.progress.size).toBe(0);
    expect(data.session).toBeNull();
  });
});
