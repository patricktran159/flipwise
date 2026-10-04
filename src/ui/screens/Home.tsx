import { useState } from 'preact/hooks';
import type { StudyMode } from '../../domain/types';
import { Icon, PwaToast, StatusBreakdown, Toggle, plural, type IconName } from '../components';
import { navigate } from '../router';
import { reviewedToday, useStore } from '../store';

function MenuItem(props: { icon: IconName; label: string; sub?: string; badge?: number; badgeKind?: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button class="menu-item" onClick={props.onClick} disabled={props.disabled}>
      <span class="menu-icon"><Icon name={props.icon} /></span>
      <span class="label">
        {props.label}
        {props.sub && <span class="sub">{props.sub}</span>}
      </span>
      {props.badge !== undefined && <span class={`badge ${props.badgeKind ?? ''}`}>{props.badge}</span>}
      <span class="chev" aria-hidden="true">›</span>
    </button>
  );
}

export function Home() {
  const { state, stats, actions } = useStore();
  const [shuffle, setShuffle] = useState(state.settings.shuffleDefault);
  const [message, setMessage] = useState('');
  const o = stats.overall;
  const today = reviewedToday(state.recentLog);
  const session = state.session;

  async function start(mode: StudyMode, emptyMessage: string) {
    if (session && !confirm('You have a session in progress. Discard it and start a new one?')) return;
    const n = await actions.startSession(mode, shuffle);
    if (n) navigate('/study');
    else setMessage(emptyMessage);
  }

  if (!state.cards.length) {
    return (
      <main class="screen">
        <TopBarHome />
        <div class="card empty">
          <img class="art" src="./pwa-192x192.png" alt="" />
          <h2>Welcome</h2>
          <p class="muted">Import your flashcard CSV to get started. Everything stays on this device.</p>
          <button class="btn primary big" onClick={() => navigate('/import')}>Import CSV</button>
          <p class="muted small" style={{ marginTop: 16 }}>
            On iPhone, add this app to your Home Screen first (Share → Add to Home Screen), then import from the
            Home Screen app. Safari and the Home Screen app keep separate storage.
          </p>
        </div>
        <div class="menu">
          <MenuItem icon="gear" label="Settings" onClick={() => navigate('/settings')} />
        </div>
        <PwaToast />
      </main>
    );
  }

  const sessionSize = state.settings.sessionSize;
  return (
    <main class="screen">
      <TopBarHome />

      <section class="card" aria-label="Overall progress">
        <div class="hero-stat">
          <span class="big">{o.masteryPct}%</span>
          <span class="muted">mastered · {o.mastered} of {o.total}</span>
        </div>
        <StatusBreakdown counts={o} />
        <p class="muted small" style={{ margin: '12px 0 0' }}>
          Reviewed today: <strong>{plural(today.cards, 'card')}</strong>
          {today.ratings > today.cards && ` (${today.ratings} ratings)`}
        </p>
      </section>

      {session && session.queue.length > 0 && (
        <button class="btn" style={{ marginBottom: 12 }} onClick={() => navigate('/study')}>
          <span>
            Resume session
            <span class="btn-sub">{session.title} · {plural(session.total - session.completed, 'card')} left</span>
          </span>
        </button>
      )}

      <button class="btn primary big" onClick={() => start({ kind: 'review' }, 'Nothing to review right now: every card is mastered and was reviewed recently. Pick a chapter to study instead.')}>
        <Icon name="play" />
        <span>
          Start Review
          <span class="btn-sub">{sessionSize ? `Up to ${sessionSize} cards` : 'All due cards'} · weakest first</span>
        </span>
      </button>

      <div class="card" style={{ marginTop: 12, padding: '4px 16px' }}>
        <Toggle label={<span class="row"><Icon name="shuffle" />Shuffle cards</span>} checked={shuffle} onChange={setShuffle} />
      </div>

      {message && <p class="card small" role="status">{message}</p>}

      <h2 class="section-title">Study</h2>
      <div class="menu">
        <MenuItem icon="book" label="Chapters" sub={plural(stats.chapters.length, 'chapter')} onClick={() => navigate('/chapters')} />
        <MenuItem icon="missed" label="Review Missed" sub="Cards you rated Again" badge={o.missed} badgeKind={o.missed ? 'bad' : ''} disabled={!o.missed}
          onClick={() => start({ kind: 'missed' }, 'No missed cards.')} />
        <MenuItem icon="difficult" label="Review Difficult" sub="Cards you rated Hard" badge={o.difficult} badgeKind={o.difficult ? 'warn' : ''} disabled={!o.difficult}
          onClick={() => start({ kind: 'difficult' }, 'No difficult cards.')} />
        <MenuItem icon="sparkle" label="New Cards" sub={sessionSize ? `Up to ${sessionSize} at a time` : 'Cards not yet studied'} badge={o.new} disabled={!o.new}
          onClick={() => start({ kind: 'new' }, 'No new cards.')} />
      </div>

      <h2 class="section-title">More</h2>
      <div class="menu">
        <MenuItem icon="chart" label="Progress" onClick={() => navigate('/progress')} />
        <MenuItem icon="upload" label="Import / Replace CSV" sub={state.importMeta?.sourceFileName} onClick={() => navigate('/import')} />
        <MenuItem icon="gear" label="Settings" onClick={() => navigate('/settings')} />
      </div>
      <PwaToast />
    </main>
  );
}

function TopBarHome() {
  return (
    <header class="topbar">
      <h1>Flipwise</h1>
    </header>
  );
}
