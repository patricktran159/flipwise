import { useEffect, useState } from 'preact/hooks';

type PwaState = { needRefresh: boolean; offlineReady: boolean };

let state: PwaState = { needRefresh: false, offlineReady: false };
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
let registration: ServiceWorkerRegistration | undefined;
const listeners = new Set<() => void>();

function set(partial: Partial<PwaState>) {
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
}

export async function initServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const { registerSW } = await import('virtual:pwa-register');
  updateSW = registerSW({
    onNeedRefresh: () => set({ needRefresh: true }),
    onOfflineReady: () => {
      set({ offlineReady: true });
      setTimeout(() => set({ offlineReady: false }), 4000);
    },
    onRegisteredSW: (_url, reg) => {
      registration = reg;
    },
  });
}

/** Activate the waiting service worker and reload into the new version. */
export function applyUpdate() {
  void updateSW?.(true);
}

export function dismissPwaMessage() {
  set({ needRefresh: false, offlineReady: false });
}

/** Ask the server for a newer version. Resolves to true if one is waiting. */
export async function checkForUpdate(): Promise<boolean | null> {
  if (!registration) return null;
  await registration.update();
  return !!registration.waiting || state.needRefresh;
}

export function usePwaState(): PwaState {
  const [s, setS] = useState(state);
  useEffect(() => {
    const l = () => setS(state);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return s;
}
