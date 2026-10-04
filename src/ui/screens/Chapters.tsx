import { useState } from 'preact/hooks';
import { PageTitle, StatusBar, StatusBreakdown, Toggle, TopBar, plural } from '../components';
import { nextNewChapter } from '../../domain/selection';
import { navigate } from '../router';
import { useStore } from '../store';

export function Chapters() {
  const { stats } = useStore();
  return (
    <main class="screen">
      <TopBar title="Chapters" back="/" />
      <PageTitle>Chapters</PageTitle>
      <p class="muted small" style={{ margin: '-8px 4px 12px' }}>
        Pick a chapter to study all its cards, for example to learn a topic in order or revise it before the exam.
        The bar shows grey New, blue Learning, orange Difficult and green Mastered cards.
      </p>
      {stats.chapters.length === 0 && <p class="card muted">No cards yet. Import a CSV first.</p>}
      <div class="menu">
        {stats.chapters.map((ch, i) => (
          <button key={ch.chapter} class="chapter-row" onClick={() => navigate(`/chapter/${i}`)}>
            <div class="name">{ch.chapter}</div>
            <div class="meta">
              <span>{plural(ch.total, 'card')} · {ch.total - ch.new} studied · {ch.mastered} mastered</span>
              <span class="pct">{ch.masteryPct}%</span>
            </div>
            <StatusBar counts={ch} thin />
          </button>
        ))}
      </div>
    </main>
  );
}

export function ChapterDetail({ index }: { index: number }) {
  const { state, stats, actions } = useStore();
  const [section, setSection] = useState<string | undefined>(undefined);
  const [shuffle, setShuffle] = useState(state.settings.shuffleDefault);
  const ch = stats.chapters[index];

  if (!ch) {
    return (
      <main class="screen">
        <TopBar title="Chapter" back="/chapters" backLabel="Chapters" />
        <p class="card muted">This chapter no longer exists.</p>
      </main>
    );
  }

  const selected = section ? ch.sections.find((s) => s.section === section) ?? ch : ch;
  const next = nextNewChapter(state.cards, state.progress);
  const hint =
    selected.new === selected.total
      ? next?.chapter === ch.chapter
        ? 'Learn New Cards on Home is up to this chapter. You can learn it here instead, or from Home.'
        : "You haven't started this yet. Learn New Cards on Home will reach it in chapter order, or you can study it here now."
      : selected.mastered === selected.total
        ? "All mastered. Study it again before the exam to refresh it. Daily Review also checks these cards from time to time."
        : selected.difficult > 0
          ? `${plural(selected.difficult, 'difficult card')} here. Studying the whole ${section ? 'section' : 'chapter'} is a good way to practise them in context.`
          : 'In progress. Daily Review brings these cards back when they are due, so studying here is optional extra practice.';

  async function study() {
    if (state.session && !confirm('You have a session in progress. Discard it and start a new one?')) return;
    const n = await actions.startSession({ kind: 'chapter', chapter: ch.chapter, section }, shuffle);
    if (n) navigate('/study');
  }

  return (
    <main class="screen">
      <TopBar title={ch.chapter} back="/chapters" backLabel="Chapters" />
      <PageTitle>{ch.chapter}</PageTitle>

      <div class="chips" role="group" aria-label="Filter by section">
        <button class="chip" aria-pressed={!section} onClick={() => setSection(undefined)}>
          All Sections<span class="n">{ch.total}</span>
        </button>
        {ch.sections.map((s) => (
          <button key={s.section} class="chip" aria-pressed={section === s.section} onClick={() => setSection(s.section)}>
            {s.section}<span class="n">{s.total}</span>
          </button>
        ))}
      </div>

      <section class="card">
        <div class="hero-stat">
          <span class="big">{selected.masteryPct}%</span>
          <span class="muted">mastered · {selected.mastered} of {selected.total}</span>
        </div>
        <StatusBreakdown counts={selected} />
      </section>

      <div class="card" style={{ padding: '4px 16px' }}>
        <Toggle label="Shuffle cards" checked={shuffle} onChange={setShuffle} />
      </div>

      <button class="btn primary big" onClick={study}>
        Study {plural(selected.total, 'card')}
      </button>
      <p class="muted small center">{section ? section : 'All sections'} · {shuffle ? 'shuffled' : 'in card order'} · includes mastered cards</p>

      <p class="card small hint-card" role="note">
        <span aria-hidden="true">💡</span>
        <span>
          {hint} A card gains at most one day towards mastery per day, wherever you study it.{' '}
          <button class="link-btn" onClick={() => navigate('/help')}>How it works</button>
        </span>
      </p>
    </main>
  );
}
