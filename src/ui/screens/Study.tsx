import { useEffect, useRef, useState } from 'preact/hooks';
import { statusOf } from '../../domain/scheduler';
import type { Rating } from '../../domain/types';
import { Bar, Icon, StatusPill, plural } from '../components';
import { navigate } from '../router';
import { useStore } from '../store';

export function Study() {
  const { state, actions } = useStore();
  const session = state.session;
  const [revealed, setRevealed] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // A "turn" advances with every rating and goes back on undo.
  const turn = session ? session.counts.again + session.counts.hard + session.counts.good : 0;
  const prevTurn = useRef(turn);
  useEffect(() => {
    // After an undo, show the card with its answer so it can be re-rated straight away.
    setRevealed(turn < prevTurn.current);
    prevTurn.current = turn;
    bodyRef.current?.scrollTo(0, 0);
  }, [turn]);

  const cardId = session?.queue[0];
  const card = cardId ? state.cardMap.get(cardId) : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || !card) return;
      if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        void actions.rate((['again', 'hard', 'good'] as Rating[])[Number(e.key) - 1]);
      } else if (e.key === 'u' || e.key === 'z') {
        void actions.undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, revealed, actions]);

  if (!session) {
    return (
      <main class="screen">
        <div class="card empty">
          <h2>No active session</h2>
          <button class="btn primary" onClick={() => navigate('/', true)}>Go to Home</button>
        </div>
      </main>
    );
  }

  const canUndo = session.undo.length > 0;

  if (!card) return <Summary />;

  const status = statusOf(state.progress.get(card.id));
  const position = Math.min(session.completed + 1, session.total);
  // Already rated earlier in this session (came back after Again or Hard).
  const repeat = (state.progress.get(card.id)?.lastReviewedAt ?? 0) >= session.startedAt;

  return (
    <div class="study">
      <header class="study-head">
        <div class="topbar">
          <button class="icon-btn" onClick={() => navigate('/')} aria-label="Close session (you can resume it later)">
            <Icon name="close" />
          </button>
          <span class="spacer" />
          <button class="icon-btn" onClick={() => void actions.undo()} disabled={!canUndo} aria-label="Undo last rating">
            <Icon name="undo" />
            <span>Undo</span>
          </button>
        </div>
        <div class="where">
          <strong>{card.chapter}</strong>
          <br />
          {card.section}
        </div>
        <div class="pos">
          <span>Card {position} of {session.total}{repeat ? ' · again' : ''}</span>
          <span>{plural(session.total - session.completed, 'card')} left</span>
        </div>
        <Bar value={session.completed} total={session.total} kind="primary" thin />
      </header>

      <div class="study-body" ref={bodyRef}>
        <article class="flashcard" onClick={() => setRevealed(true)} aria-live="polite">
          <div class="label">
            Question · #{card.cardNumber}
            <StatusPill status={status} />
          </div>
          <div class="text q">{card.question}</div>
          {revealed ? (
            <>
              <hr />
              <div class="label">Answer</div>
              <div class="text a">{card.answer}</div>
            </>
          ) : (
            <div class="hint">Tap to reveal the answer</div>
          )}
        </article>
      </div>

      <footer class="study-foot">
        {revealed ? (
          <div class="rate">
            <button class="again" onClick={() => void actions.rate('again')}>Again<small>Soon</small></button>
            <button class="hard" onClick={() => void actions.rate('hard')}>Hard<small>Later</small></button>
            <button class="good" onClick={() => void actions.rate('good')}>Good<small>Got it</small></button>
          </div>
        ) : (
          <button class="btn primary big" onClick={() => setRevealed(true)}>Show Answer</button>
        )}
        <div class="kbd-hint">{revealed ? '1 Again · 2 Hard · 3 Good · U Undo' : 'Space to reveal · U Undo'}</div>
      </footer>
    </div>
  );
}

function Summary() {
  const { state, actions } = useStore();
  const session = state.session!;
  const { again, hard, good } = session.counts;

  async function done() {
    await actions.endSession();
    navigate('/', true);
  }

  async function another() {
    const n = await actions.startSession({ kind: 'review' }, session.shuffled);
    if (!n) await done();
  }

  return (
    <main class="screen">
      <header class="topbar">
        <span class="spacer" />
        <button class="icon-btn" onClick={() => void actions.undo()} disabled={!session.undo.length}>
          <Icon name="undo" />
          <span>Undo</span>
        </button>
      </header>
      <div class="summary-hero">
        <div class="big" aria-hidden="true">🎉</div>
        <h1 style={{ margin: '0 0 4px' }}>Session complete</h1>
        <p class="muted" style={{ margin: 0 }}>{session.title} · {plural(session.total, 'card')}</p>
      </div>
      <div class="tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div class="tile"><div class="v" style={{ color: 'var(--again)' }}>{again}</div><div class="k">Again</div></div>
        <div class="tile"><div class="v" style={{ color: 'var(--hard)' }}>{hard}</div><div class="k">Hard</div></div>
        <div class="tile"><div class="v" style={{ color: 'var(--good)' }}>{good}</div><div class="k">Good</div></div>
      </div>
      {session.newlyMastered.length > 0 && (
        <p class="card ok-card">Newly mastered: <strong>{plural(session.newlyMastered.length, 'card')}</strong></p>
      )}
      <div class="stack">
        <button class="btn primary big" onClick={done}>Done</button>
        <button class="btn" onClick={another}>Start another review</button>
      </div>
    </main>
  );
}
