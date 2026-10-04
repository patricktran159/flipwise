import { useEffect, useState } from 'preact/hooks';
import { validateBackup } from '../../data/repo';
import type { Settings, TextSize, Theme } from '../../domain/types';
import { checkForUpdate } from '../../pwa/registerSW';
import { PageTitle, Segmented, Toggle, TopBar, plural } from '../components';
import { useStore } from '../store';

function SelectField<T extends number>(props: { label: string; hint?: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  const id = `f-${props.label.replace(/\W+/g, '-')}`;
  return (
    <div class="field">
      <label for={id}>
        {props.label}
        {props.hint && <span class="muted small" style={{ display: 'block' }}>{props.hint}</span>}
      </label>
      <select id={id} value={props.value} onChange={(e) => props.onChange(Number(e.currentTarget.value) as T)}>
        {props.options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </div>
  );
}

export function SettingsScreen() {
  const { state, actions } = useStore();
  const s = state.settings;
  const [message, setMessage] = useState('');
  const [storage, setStorage] = useState<{ persisted?: boolean; usage?: number }>({});
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const orphans = [...state.progress.keys()].filter((id) => !state.cardMap.has(id)).length;

  useEffect(() => {
    void (async () => {
      const persisted = await navigator.storage?.persisted?.();
      const estimate = await navigator.storage?.estimate?.();
      setStorage({ persisted, usage: estimate?.usage });
    })();
  }, [state.cards, state.progress]);

  const set = (patch: Partial<Settings>) => void actions.saveSettings({ ...s, ...patch });

  async function prepareBackup() {
    const backup = await actions.exportBackup();
    const stamp = new Date().toISOString().slice(0, 10);
    setBackupFile(new File([JSON.stringify(backup)], `flipwise-backup-${stamp}.json`, { type: 'application/json' }));
  }

  async function saveBackup() {
    if (!backupFile) return;
    // On iPhone the share sheet offers "Save to Files"; elsewhere fall back to a download.
    if (navigator.canShare?.({ files: [backupFile] })) {
      try {
        await navigator.share({ files: [backupFile], title: backupFile.name });
        setMessage('Backup shared.');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setMessage(`Could not share: ${(err as Error).message}`);
      }
    } else {
      const url = URL.createObjectURL(backupFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFile.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setMessage('Backup downloaded.');
    }
  }

  async function restore(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const backup = validateBackup(JSON.parse(await file.text()));
      const when = new Date(backup.exportedAt).toLocaleString();
      if (!confirm(`Restore backup from ${when}? This replaces all cards and progress on this device with ${plural(backup.cards.length, 'card')} and ${plural(backup.progress.length, 'progress record')}.`)) return;
      await actions.restoreBackup(backup);
      setMessage('Backup restored.');
    } catch (err) {
      setMessage(err instanceof SyntaxError ? 'That file is not valid JSON.' : (err as Error).message);
    }
  }

  async function update() {
    const result = await checkForUpdate();
    setMessage(result === null ? 'Updates are checked automatically in the installed app.' : result ? 'Update found. Use the Reload button.' : 'You have the latest version.');
  }

  return (
    <main class="screen">
      <TopBar title="Settings" back="/" />
      <PageTitle>Settings</PageTitle>
      {message && <p class="card small" role="status">{message}</p>}

      <h2 class="section-title">Study</h2>
      <section class="card" style={{ padding: '0 16px' }}>
        <SelectField label="Session size" hint="Start Review and New Cards" value={s.sessionSize}
          options={[[10, '10'], [20, '20'], [30, '30'], [50, '50'], [100, '100'], [0, 'All']]} onChange={(v) => set({ sessionSize: v })} />
        <SelectField label="Mastery" hint="Good ratings needed, on separate days" value={s.masteryThreshold}
          options={[[1, '1 day'], [2, '2 days'], [3, '3 days'], [4, '4 days'], [5, '5 days']]} onChange={(v) => set({ masteryThreshold: v })} />
        <SelectField label="Again returns after" hint="Other cards shown first (±1)" value={s.againGap}
          options={[[2, '2 cards'], [3, '3 cards'], [4, '4 cards'], [6, '6 cards'], [8, '8 cards']]} onChange={(v) => set({ againGap: v })} />
        <SelectField label="Mastered cards return" hint="In Start Review, if not seen for" value={s.resurfaceDays}
          options={[[3, '3 days'], [7, '7 days'], [14, '14 days'], [30, '30 days'], [3650, 'Never']]} onChange={(v) => set({ resurfaceDays: v })} />
        <div class="field">
          <Toggle label="Shuffle by default" checked={s.shuffleDefault} onChange={(v) => set({ shuffleDefault: v })} />
        </div>
      </section>

      <h2 class="section-title">Display</h2>
      <section class="card stack">
        <div class="small muted">Card text size</div>
        <Segmented<TextSize> label="Card text size" value={s.textSize} onChange={(v) => set({ textSize: v })}
          options={[['s', 'S'], ['m', 'M'], ['l', 'L'], ['xl', 'XL']]} />
        <div class="small muted">Theme</div>
        <Segmented<Theme> label="Theme" value={s.theme} onChange={(v) => set({ theme: v })}
          options={[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]} />
      </section>

      <h2 class="section-title">Backup</h2>
      <section class="card stack">
        <p class="small muted" style={{ margin: 0 }}>
          Removing the app from your Home Screen deletes its data. A backup file holds your cards, progress and settings,
          and you can keep it in the Files app.
        </p>
        {backupFile
          ? <button class="btn primary" onClick={saveBackup}>Save {backupFile.name}</button>
          : <button class="btn" onClick={prepareBackup} disabled={!state.cards.length}>Export backup</button>}
        <label class="btn">
          Restore from backup
          <input class="file-input" type="file" accept=".json,application/json" onChange={restore} />
        </label>
      </section>

      <h2 class="section-title">Data on this device</h2>
      <section class="card stack">
        <dl class="kv">
          <dt>Cards</dt><dd>{state.cards.length}</dd>
          <dt>Progress records</dt><dd>{state.progress.size - orphans}</dd>
          {storage.usage !== undefined && <><dt>Storage used</dt><dd>{(storage.usage / 1048576).toFixed(1)} MB</dd></>}
          {storage.persisted !== undefined && <><dt>Protected from cleanup</dt><dd>{storage.persisted ? 'Yes' : 'No'}</dd></>}
        </dl>
        {orphans > 0 && (
          <button class="btn" onClick={async () => {
            if (!confirm(`Delete hidden progress for ${plural(orphans, 'card')} that are no longer in your CSV?`)) return;
            setMessage(`Cleared ${plural(await actions.clearOrphans(), 'record')}.`);
          }}>
            Clear hidden progress ({orphans})
          </button>
        )}
        <button class="btn danger" disabled={!state.progress.size} onClick={async () => {
          if (!confirm('Reset all study progress? Your cards are kept. This cannot be undone.')) return;
          await actions.resetProgress();
          setMessage('Progress reset.');
        }}>Reset progress</button>
        <button class="btn danger" onClick={async () => {
          if (!confirm('Delete all cards, progress and settings from this device? This cannot be undone.')) return;
          await actions.deleteAll();
          setMessage('All data deleted.');
        }}>Delete all data</button>
      </section>

      <h2 class="section-title">About</h2>
      <section class="card stack">
        <p class="small muted" style={{ margin: 0 }}>
          Flipwise v{__APP_VERSION__}. Works offline. Your cards and progress stay on this device: no accounts,
          no analytics, no uploads.
        </p>
        <button class="btn" onClick={update}>Check for updates</button>
      </section>
    </main>
  );
}
