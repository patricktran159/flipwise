import { useEffect } from 'preact/hooks';
import { ChapterDetail, Chapters } from './ui/screens/Chapters';
import { HelpScreen } from './ui/screens/Help';
import { Home } from './ui/screens/Home';
import { ImportScreen } from './ui/screens/Import';
import { ProgressScreen } from './ui/screens/Progress';
import { SettingsScreen } from './ui/screens/Settings';
import { Study } from './ui/screens/Study';
import { useRoute } from './ui/router';
import { useStore } from './ui/store';

export function App() {
  const route = useRoute();
  const { state } = useStore();
  const { theme, textSize } = state.settings;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    root.dataset.text = textSize;
  }, [theme, textSize]);

  switch (route.name) {
    case 'chapters': return <Chapters />;
    case 'chapter': return <ChapterDetail key={route.index} index={route.index} />;
    case 'study': return <Study />;
    case 'progress': return <ProgressScreen />;
    case 'import': return <ImportScreen />;
    case 'settings': return <SettingsScreen />;
    case 'help': return <HelpScreen />;
    default: return <Home />;
  }
}
