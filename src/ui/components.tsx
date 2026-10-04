import type { ComponentChildren } from 'preact';
import type { StatusCounts } from '../domain/stats';
import { STATUS_LABEL, STATUSES, type Status } from '../domain/types';
import { applyUpdate, dismissPwaMessage, usePwaState } from '../pwa/registerSW';
import { navigate } from './router';

const ICONS = {
  back: 'M15 18l-6-6 6-6',
  close: 'M18 6L6 18M6 6l12 12',
  undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11',
  play: 'M7 4.5v15l12-7.5z',
  book: 'M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5zM4 20.5A2.5 2.5 0 006.5 23H20v-5',
  missed: 'M12 3a9 9 0 100 18 9 9 0 000-18zM15 9l-6 6M9 9l6 6',
  difficult: 'M12 3l9.5 17h-19zM12 10v4M12 17.5v.01',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  shuffle: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
};

export type IconName = keyof typeof ICONS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill={name === 'play' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

export function TopBar(props: { title: string; back?: string; backLabel?: string; right?: ComponentChildren }) {
  return (
    <header class="topbar">
      {props.back !== undefined && (
        <button class="icon-btn" onClick={() => navigate(props.back!)} aria-label={`Back to ${props.backLabel ?? 'Home'}`}>
          <Icon name="back" />
          <span>{props.backLabel ?? 'Home'}</span>
        </button>
      )}
      {props.back !== undefined ? <span class="spacer" /> : <h1>{props.title}</h1>}
      {props.right}
    </header>
  );
}

/** Page heading shown under a TopBar that has a back button. */
export function PageTitle({ children }: { children: ComponentChildren }) {
  return <h1 style={{ margin: '0 4px 16px', fontSize: '1.6rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>{children}</h1>;
}

export function Bar({ value, total, kind = 'mastered', thin }: { value: number; total: number; kind?: 'mastered' | 'primary'; thin?: boolean }) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div class={`bar ${kind === 'primary' ? 'primary' : ''} ${thin ? 'thin' : ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatusBreakdown({ counts }: { counts: StatusCounts }) {
  return (
    <>
      <div class="stacked" aria-hidden="true">
        {STATUSES.map((s) => counts[s] > 0 && <span key={s} class={`st-${s}`} style={{ flex: counts[s] }} />)}
      </div>
      <div class="legend">
        {STATUSES.map((s) => (
          <div class="item" key={s}>
            <span class={`dot st-${s}`} />
            <span>{STATUS_LABEL[s]}</span>
            <span class="v">{counts[s]}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function StatusPill({ status }: { status: Status }) {
  return (
    <span class="status-pill">
      <span class={`dot st-${status}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Toggle(props: { label: ComponentChildren; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label class="toggle">
      <span class="grow">{props.label}</span>
      <input type="checkbox" role="switch" checked={props.checked} onChange={(e) => props.onChange(e.currentTarget.checked)} />
      <span class="track" aria-hidden="true" />
    </label>
  );
}

export function Segmented<T extends string>(props: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div class="segmented" role="group" aria-label={props.label}>
      {props.options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={props.value === v} onClick={() => props.onChange(v)}>{text}</button>
      ))}
    </div>
  );
}

export function PwaToast() {
  const { needRefresh, offlineReady } = usePwaState();
  if (!needRefresh && !offlineReady) return null;
  return (
    <div class="toast" role="status">
      <span class="grow">{needRefresh ? 'A new version is available.' : 'Ready to work offline.'}</span>
      {needRefresh && <button onClick={applyUpdate}>Reload</button>}
      <button class="x" onClick={dismissPwaMessage} aria-label="Dismiss"><Icon name="close" /></button>
    </div>
  );
}

export function plural(n: number, word: string, pluralWord = word + 's') {
  return `${n.toLocaleString()} ${n === 1 ? word : pluralWord}`;
}

export function formatDate(time: number) {
  return new Date(time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
