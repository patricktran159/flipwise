import { Bar, PageTitle, TopBar, plural } from '../components';
import { navigate } from '../router';
import { activityByDay, reviewedToday, useStore } from '../store';

export function ProgressScreen() {
  const { state, stats } = useStore();
  const o = stats.overall;
  const today = reviewedToday(state.recentLog);
  const days = activityByDay(state.recentLog);
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  const tile = (label: string, value: string | number, dot?: string) => (
    <div class="tile">
      <div class="v">{value}</div>
      <div class="k">{dot && <span class={`dot-inline st-${dot}`} />}{label}</div>
    </div>
  );

  return (
    <main class="screen">
      <TopBar title="Progress" back="/" />
      <PageTitle>Progress</PageTitle>

      <div class="tiles">
        {tile('Mastery', `${o.masteryPct}%`)}
        {tile('Total cards', o.total)}
        {tile('Reviewed today', today.cards)}
        {tile('Missed', o.missed)}
        {tile('New', o.new, 'new')}
        {tile('Learning', o.learning, 'learning')}
        {tile('Difficult', o.difficult, 'difficult')}
        {tile('Mastered', o.mastered, 'mastered')}
      </div>

      <section class="card">
        <h2>Last 7 days</h2>
        <div class="activity" aria-label="Ratings per day for the last 7 days">
          {days.map((d) => (
            <div class="col" key={d.start}>
              <span class="n">{d.count || ''}</span>
              <span class="b" style={{ height: `${(d.count / maxDay) * 64}px` }} />
              <span class="d">{new Date(d.start).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
            </div>
          ))}
        </div>
        <p class="muted small" style={{ margin: '8px 0 0' }}>
          Today: {plural(today.cards, 'card')}, {plural(today.ratings, 'rating')}
        </p>
      </section>

      <h2 class="section-title">By chapter</h2>
      <div class="menu">
        {stats.chapters.map((ch, i) => (
          <button key={ch.chapter} class="chapter-row" onClick={() => navigate(`/chapter/${i}`)}>
            <div class="name">{ch.chapter}</div>
            <div class="meta">
              <span>
                {ch.mastered}/{ch.total} mastered · {ch.difficult} difficult · {ch.learning} learning · {ch.new} new
              </span>
              <span class="pct">{ch.masteryPct}%</span>
            </div>
            <Bar value={ch.mastered} total={ch.total} />
          </button>
        ))}
      </div>
    </main>
  );
}
