import { render } from 'preact';
import { App } from './app';
import { openFlashcardDB } from './data/db';
import { Repo } from './data/repo';
import { initServiceWorker } from './pwa/registerSW';
import { loadState, StoreProvider } from './ui/store';
import './ui/styles.css';

const root = document.getElementById('app')!;

async function boot() {
  root.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const repo = new Repo(await openFlashcardDB());
    const initial = await loadState(repo);
    root.innerHTML = '';
    render(
      <StoreProvider repo={repo} initial={initial}>
        <App />
      </StoreProvider>,
      root,
    );
  } catch (err) {
    root.innerHTML = '';
    render(
      <main class="screen">
        <div class="card error-card" role="alert">
          <h2>Can't open local storage</h2>
          <p>This app stores your cards in the browser's database (IndexedDB), and it isn't available here.
            Private browsing or blocked site data can cause this.</p>
          <p class="muted small">{String((err as Error)?.message ?? err)}</p>
        </div>
      </main>,
      root,
    );
  }
  void initServiceWorker();
}

void boot();
