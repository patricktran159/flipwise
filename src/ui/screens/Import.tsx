import { useState } from 'preact/hooks';
import { parseFlashcardCsv, REQUIRED_COLUMNS, type ParseResult } from '../../domain/csvImport';
import { planImport, type ImportPlan } from '../../domain/importPlan';
import type { Card } from '../../domain/types';
import { PageTitle, TopBar, formatDate, plural } from '../components';
import { navigate } from '../router';
import { useStore } from '../store';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_LISTED = 100;

type Stage =
  | { kind: 'pick'; error?: string }
  | { kind: 'invalid'; fileName: string; result: ParseResult }
  | { kind: 'preview'; fileName: string; result: ParseResult; plan: ImportPlan }
  | { kind: 'done'; fileName: string; plan: ImportPlan; count: number };

export function ImportScreen() {
  const { state, actions } = useStore();
  const [stage, setStage] = useState<Stage>({ kind: 'pick' });
  const [busy, setBusy] = useState(false);

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setStage({ kind: 'pick', error: `That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 20 MB.` });
      return;
    }
    const result = parseFlashcardCsv(await file.text());
    if (!result.ok) {
      setStage({ kind: 'invalid', fileName: file.name, result });
      return;
    }
    const plan = planImport(state.cards, result.cards, state.progress.keys());
    setStage({ kind: 'preview', fileName: file.name, result, plan });
  }

  async function confirmImport(fileName: string, cards: Card[], plan: ImportPlan) {
    setBusy(true);
    try {
      await actions.commitImport(cards, fileName);
      // Ask the browser not to evict our data (no-op where unsupported).
      void navigator.storage?.persist?.();
      setStage({ kind: 'done', fileName, plan, count: cards.length });
    } catch (err) {
      setStage({ kind: 'pick', error: `Import failed: ${(err as Error).message}. Nothing was changed.` });
    } finally {
      setBusy(false);
    }
  }

  const picker = (label: string, primary = true) => (
    <label class={`btn ${primary ? 'primary big' : ''}`}>
      {label}
      <input class="file-input" type="file" accept=".csv,text/csv,text/comma-separated-values,application/vnd.ms-excel" onChange={onFile} />
    </label>
  );

  return (
    <main class="screen">
      <TopBar title="Import" back="/" />
      <PageTitle>{state.cards.length ? 'Replace CSV' : 'Import CSV'}</PageTitle>

      {stage.kind === 'pick' && (
        <>
          {stage.error && <p class="card error-card" role="alert">{stage.error}</p>}
          <section class="card">
            <h2>Choose a CSV file</h2>
            <p class="muted small" style={{ marginTop: 0 }}>
              The first row must have these columns: <code>{REQUIRED_COLUMNS.join(', ')}</code>.
              Text with commas must be in double quotes, which Excel does automatically. Save as <strong>CSV UTF-8</strong>.
            </p>
            {state.cards.length > 0 && (
              <p class="small">
                Current set: <strong>{plural(state.cards.length, 'card')}</strong>
                {state.importMeta && <> from <code>{state.importMeta.sourceFileName}</code>, imported {formatDate(state.importMeta.importedAt)}</>}.
                Progress is kept for cards with the same chapter and card number.
              </p>
            )}
            {picker('Choose CSV file')}
          </section>
          <p class="muted small center">The file is read on this device only. Nothing is uploaded.</p>
        </>
      )}

      {stage.kind === 'invalid' && (
        <>
          <section class="card error-card" role="alert">
            <h2>Can't import this file</h2>
            <p class="small" style={{ margin: 0 }}>
              <code>{stage.fileName}</code> has {plural(stage.result.errors.length, 'problem')}. Fix them and import again. Nothing was changed.
            </p>
            <ul class="issues">
              {stage.result.errors.slice(0, MAX_LISTED).map((e, i) => (
                <li key={i}>{e.row !== undefined && <span class="rowno">Row {e.row}:</span>}{e.message}</li>
              ))}
              {stage.result.errors.length > MAX_LISTED && <li class="muted">…and {stage.result.errors.length - MAX_LISTED} more</li>}
            </ul>
          </section>
          {picker('Choose another file')}
        </>
      )}

      {stage.kind === 'preview' && (
        <Preview stage={stage} busy={busy} onCancel={() => setStage({ kind: 'pick' })}
          onConfirm={() => confirmImport(stage.fileName, stage.result.cards, stage.plan)}
          sessionActive={!!state.session} />
      )}

      {stage.kind === 'done' && (
        <section class="card ok-card" role="status">
          <h2>Import complete</h2>
          <p style={{ marginTop: 0 }}>
            {plural(stage.count, 'card')} from <code>{stage.fileName}</code> are saved on this device.
            {stage.plan.isReplace && <> {plural(stage.plan.progressRetained, 'card')} kept their progress.</>}
          </p>
          <button class="btn primary big" onClick={() => navigate('/', true)}>Go to Home</button>
        </section>
      )}
    </main>
  );
}

function Preview(props: {
  stage: Extract<Stage, { kind: 'preview' }>;
  busy: boolean;
  sessionActive: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { result, plan, fileName } = props.stage;
  const listCards = (cards: Card[]) => (
    <ul>
      {cards.slice(0, MAX_LISTED).map((c) => <li key={c.id}>{c.chapter} #{c.cardNumber}: {c.question}</li>)}
      {cards.length > MAX_LISTED && <li class="muted">…and {cards.length - MAX_LISTED} more</li>}
    </ul>
  );

  return (
    <>
      <section class="card ok-card">
        <h2>Ready to {plan.isReplace ? 'replace' : 'import'}</h2>
        <p class="small" style={{ marginTop: 0 }}><code>{fileName}</code></p>
        <dl class="kv">
          <dt>Cards</dt><dd>{result.cards.length}</dd>
          <dt>Chapters</dt><dd>{result.chapterCount}</dd>
          <dt>Sections</dt><dd>{result.sectionCount}</dd>
          {result.skippedEmptyRows > 0 && <><dt>Empty rows skipped</dt><dd>{result.skippedEmptyRows}</dd></>}
        </dl>
      </section>

      {plan.isReplace && (
        <section class="card">
          <h2>Changes</h2>
          <dl class="kv">
            <dt>Unchanged</dt><dd>{plan.unchanged}</dd>
            <dt>Text updated (progress kept)</dt><dd>{plan.changed.length}</dd>
            <dt>New cards</dt><dd>{plan.added.length}</dd>
            <dt>Removed cards</dt><dd>{plan.removed.length}</dd>
            <dt>Cards keeping progress</dt><dd>{plan.progressRetained}</dd>
            {plan.progressRestored > 0 && <><dt>Progress restored from earlier</dt><dd>{plan.progressRestored}</dd></>}
          </dl>
          {plan.changed.length > 0 && <details><summary>Updated cards ({plan.changed.length})</summary>{listCards(plan.changed)}</details>}
          {plan.added.length > 0 && <details><summary>New cards ({plan.added.length})</summary>{listCards(plan.added)}</details>}
          {plan.removed.length > 0 && <details><summary>Removed cards ({plan.removed.length})</summary>{listCards(plan.removed)}</details>}
          {plan.orphanedProgress > 0 && (
            <p class="muted small">
              Progress for {plural(plan.orphanedProgress, 'removed card')} will be kept hidden and restored if those cards come back.
              You can clear it in Settings.
            </p>
          )}
        </section>
      )}

      {result.warnings.length > 0 && (
        <section class="card">
          <details>
            <summary>{plural(result.warnings.length, 'warning')}</summary>
            <ul class="issues">
              {result.warnings.slice(0, MAX_LISTED).map((w, i) => (
                <li key={i}>{w.row !== undefined && <span class="rowno">Row {w.row}:</span>}{w.message}</li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {props.sessionActive && <p class="muted small center">Your current study session will end.</p>}
      <div class="stack">
        <button class="btn primary big" disabled={props.busy} onClick={props.onConfirm}>
          {props.busy ? 'Saving…' : plan.isReplace ? `Replace with ${plural(result.cards.length, 'card')}` : `Import ${plural(result.cards.length, 'card')}`}
        </button>
        <button class="btn" disabled={props.busy} onClick={props.onCancel}>Cancel</button>
      </div>
    </>
  );
}
