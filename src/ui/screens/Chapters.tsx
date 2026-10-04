import { useState } from 'preact/hooks';
import { Bar, PageTitle, StatusBreakdown, Toggle, TopBar, plural } from '../components';
import { navigate } from '../router';
import { useStore } from '../store';

export function Chapters() {
  const { stats } = useStore();
  return (
    <main class="screen">
      <TopBar title="Chapters" back="/" />
      <PageTitle>Chapters</PageTitle>
      {stats.chapters.length === 0 && <p class="card muted">No cards yet. Import a CSV first.</p>}
      <div class="menu">
        {stats.chapters.map((ch, i) => (
          <button key={ch.chapter} class="chapter-row" onClick={() => navigate(`/chapter/${i}`)}>
            <div class="name">{ch.chapter}</div>
            <div class="meta">
              <span>{plural(ch.total, 'card')} · {ch.mastered} mastered</span>
              <span class="pct">{ch.masteryPct}%</span>
            </div>
            <Bar value={ch.mastered} total={ch.total} />
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
      <p class="muted small center">{section ? section : 'All sections'} · {shuffle ? 'shuffled' : 'in card order'}</p>
    </main>
  );
}
