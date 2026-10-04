import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { countDue, countDueTomorrow, newSessionCount, nextNewChapter } from '../../domain/selection';
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

function Step(props: { n: number; title: string; sub: string; children: ComponentChildren }) {
  return (
    <section class="card step" aria-label={props.title}>
      <div class="step-head">
        <span class="step-n" aria-hidden="true">{props.n}</span>
        <div class="grow">
          <h2>{props.title}</h2>
          <p class="muted small">{props.sub}</p>
        </div>
      </div>
      {props.children}
    </section>
  );
}

export function Home() {
  const { state, stats, actions } = useStore();
  const [shuffle, setShuffle] = useState(state.settings.shuffleDefault);
  const o = stats.overall;
  const today = reviewedToday(state.recentLog);
  const session = state.session;

  async function start(mode: StudyMode) {
    if (session && !confirm('You have a session in progress. Discard it and start a new one?')) return;
    if (await actions.startSession(mode, shuffle)) navigate('/study');
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
          <MenuItem icon="help" label="How Flipwise works" sub="The daily routine, statuses and mastery" onClick={() => navigate('/help')} />
          <MenuItem icon="gear" label="Settings" onClick={() => navigate('/settings')} />
        </div>
        <PwaToast />
      </main>
    );
  }

  const sessionSize = state.settings.sessionSize;
  const perSession = sessionSize ? ` · up to ${sessionSize} per session` : '';
  const due = countDue(state.cards, state.progress, state.settings.resurfaceDays, Date.now());
  const dueTomorrow = due ? 0 : countDueTomorrow(state.cards, state.progress, state.settings.resurfaceDays, Date.now());
  const next = nextNewChapter(state.cards, state.progress);
  const learnCount = next ? newSessionCount(shuffle ? o.new : next.newCount, sessionSize) : 0;

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
          Studied today: <strong>{plural(today.cards, 'card')}</strong>
          {today.ratings > today.cards && ` · ${plural(today.ratings, 'rating')} including repeats`}
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

      <h2 class="section-title">Today</h2>

      <Step n={1} title="Review" sub="Cards you've studied before that are due today. Do these first.">
        {due > 0 ? (
          <button class="btn primary big" onClick={() => start({ kind: 'review' })}>
            <Icon name="play" />
            <span>
              Start Review
              <span class="btn-sub">{plural(due, 'card')} due{perSession}</span>
            </span>
          </button>
        ) : o.total > o.new ? (
          <p class="step-done">
            ✓ All caught up for today.
            <span class="step-done-sub">
              {dueTomorrow ? `${plural(dueTomorrow, 'card')} will be due tomorrow.` : 'Nothing is due tomorrow.'}
            </span>
          </p>
        ) : (
          <p class="step-done neutral">Nothing to review yet. Start with step 2: cards you learn today come back here tomorrow.</p>
        )}
      </Step>

      <Step n={2} title="Learn new cards" sub={`${plural(o.new, 'card')} you haven't studied yet, one chapter at a time.`}>
        {next ? (
          <button class={`btn big ${due === 0 ? 'primary' : ''}`} onClick={() => start({ kind: 'new' })}>
            <Icon name="sparkle" />
            <span>
              Learn New Cards
              <span class="btn-sub">
                {shuffle
                  ? `${plural(learnCount, 'card')} picked at random from all chapters`
                  : `${next.chapter} · ${learnCount < next.newCount ? `${learnCount} of ${next.newCount} new cards`
                    : next.newCount === 1 ? 'last new card' : `all ${next.newCount} new cards`}`}
              </span>
            </span>
          </button>
        ) : (
          <p class="step-done">✓ You've started every card.</p>
        )}
      </Step>

      <div class="card" style={{ padding: '4px 16px' }}>
        <Toggle label={<span class="row"><Icon name="shuffle" />Shuffle cards</span>} checked={shuffle} onChange={setShuffle} />
      </div>

      <h2 class="section-title">Extra practice</h2>
      <div class="menu">
        <MenuItem icon="book" label="Chapters" sub="Study every card in a chapter or section" onClick={() => navigate('/chapters')} />
        <MenuItem icon="missed" label="Missed Cards" sub="Rated Again and not yet Good" badge={o.missed} badgeKind={o.missed ? 'bad' : ''} disabled={!o.missed}
          onClick={() => start({ kind: 'missed' })} />
        <MenuItem icon="difficult" label="Difficult Cards" sub="Rated Hard and not yet mastered" badge={o.difficult} badgeKind={o.difficult ? 'warn' : ''} disabled={!o.difficult}
          onClick={() => start({ kind: 'difficult' })} />
      </div>
      <p class="muted small" style={{ margin: '8px 4px 0' }}>
        Extra practice helps you remember, but a card's mastery count goes up at most once a day.
      </p>

      <h2 class="section-title">More</h2>
      <div class="menu">
        <MenuItem icon="help" label="How Flipwise works" sub="The daily routine, statuses and mastery" onClick={() => navigate('/help')} />
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
      <button class="icon-btn" onClick={() => navigate('/help')} aria-label="How Flipwise works">
        <Icon name="help" />
        <span>Help</span>
      </button>
    </header>
  );
}
