import { useEffect, useState } from 'preact/hooks';

export type Route =
  | { name: 'home' }
  | { name: 'chapters' }
  | { name: 'chapter'; index: number }
  | { name: 'study' }
  | { name: 'progress' }
  | { name: 'import' }
  | { name: 'settings' }
  | { name: 'help' };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0];
  const [head, arg] = path.split('/');
  switch (head) {
    case 'chapters': return { name: 'chapters' };
    case 'chapter': return Number.isInteger(Number(arg)) ? { name: 'chapter', index: Number(arg) } : { name: 'chapters' };
    case 'study': return { name: 'study' };
    case 'progress': return { name: 'progress' };
    case 'import': return { name: 'import' };
    case 'settings': return { name: 'settings' };
    case 'help': return { name: 'help' };
    default: return { name: 'home' };
  }
}

export function navigate(path: string, replace = false) {
  const hash = '#' + path;
  if (replace) location.replace(hash);
  else location.hash = hash;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
