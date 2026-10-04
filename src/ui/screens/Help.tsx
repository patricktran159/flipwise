import { Fragment } from 'preact';
import { STATUS_LABEL, STATUSES, type Status } from '../../domain/types';
import { PageTitle, TopBar, plural } from '../components';
import { useStore } from '../store';

export function HelpScreen() {
  const { state } = useStore();
  const days = state.settings.masteryThreshold;
  const resurface = state.settings.resurfaceDays;

  const meaning: Record<Status, string> = {
    new: "You haven't studied it yet.",
    learning: `You've studied it, but haven't had Good on ${plural(days, 'separate day')} yet.`,
    difficult: 'You rated it Hard. It stays Difficult until you master it.',
    mastered: `Good on ${plural(days, 'separate day')}, with no Again or Hard in between. You know it.`,
  };

  return (
    <main class="screen help">
      <TopBar title="How Flipwise works" back="/" />
      <PageTitle>How Flipwise works</PageTitle>

      <h2 class="section-title">Every day</h2>
      <section class="card">
        <div class="step-head">
          <span class="step-n" aria-hidden="true">1</span>
          <div class="grow">
            <h2>Review</h2>
            <p class="muted small">Cards you've studied before that are due today. Do these first, until Home says "All caught up".</p>
          </div>
        </div>
        <div class="step-head" style={{ marginBottom: 0 }}>
          <span class="step-n" aria-hidden="true">2</span>
          <div class="grow">
            <h2>Learn new cards</h2>
            <p class="muted small">Cards you've never seen, in chapter order. Do as many as you have time for.</p>
          </div>
        </div>
      </section>
      <p class="muted small help-note">Then come back tomorrow. Short daily sessions work better than one long one.</p>

      <h2 class="section-title">Studying a card</h2>
      <section class="card">
        <p style={{ marginTop: 0 }}>Read the question, answer it in your head, tap to see the answer, then rate yourself:</p>
        <dl class="help-ratings">
          <dt class="again">Again</dt><dd>You didn't know it. It comes back a few cards later.</dd>
          <dt class="hard">Hard</dt><dd>You only just knew it. It comes back once at the end of the session.</dd>
          <dt class="good">Good</dt><dd>You knew it. It's done for this session.</dd>
        </dl>
      </section>

      <h2 class="section-title">Mastery takes {plural(days, 'day')}</h2>
      <section class="card">
        <p style={{ marginTop: 0 }}>
          A card is <strong>Mastered</strong> after <strong>Good on {plural(days, 'separate day')}</strong>.
          Only the first Good each day counts, and Again or Hard start the count again.
        </p>
        <p style={{ marginBottom: 0 }}>
          {days > 1 && <>So on your first day, mastery is always 0%, however much you study. That's normal. </>}
          Cards show their progress while you study, for example "Learning · day 1 of {days}".
        </p>
      </section>

      <h2 class="section-title">Card statuses</h2>
      <section class="card">
        <dl class="help-statuses">
          {STATUSES.map((s) => (
            <Fragment key={s}>
              <dt><span class={`dot st-${s}`} />{STATUS_LABEL[s]}</dt>
              <dd>{meaning[s]}</dd>
            </Fragment>
          ))}
        </dl>
        <p class="muted small" style={{ marginBottom: 0 }}>
          <strong>Missed</strong> is an extra flag, not a status: the card was rated Again and hasn't been rated Good since.
        </p>
      </section>

      <h2 class="section-title">What Review brings back</h2>
      <section class="card">
        <ul class="help-list">
          <li><strong>Missed</strong> cards, until you get them right.</li>
          <li><strong>Learning</strong> and <strong>Difficult</strong> cards once a day. After today's rating they wait for tomorrow, because more practice today wouldn't count.</li>
          <li><strong>Mastered</strong> cards you haven't seen for {plural(resurface, 'day')}, to check you still know them.</li>
        </ul>
      </section>

      <h2 class="section-title">Extra practice</h2>
      <section class="card">
        <p style={{ margin: 0 }}>
          <strong>Chapters</strong>, <strong>Missed Cards</strong> and <strong>Difficult Cards</strong> are there whenever you want
          more practice, for example on a weak topic or before the exam. They count like any session, but a card still gains at
          most one day towards mastery per day.
        </p>
      </section>

      <h2 class="section-title">Cards vs ratings</h2>
      <section class="card">
        <p style={{ margin: 0 }}>
          <strong>Cards</strong> counts different cards. <strong>Ratings</strong> counts every tap of Again, Hard or Good, including
          cards that came back. Studying 20 cards can take 40 ratings.
        </p>
      </section>
    </main>
  );
}
