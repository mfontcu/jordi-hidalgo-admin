import { createRoot } from 'react-dom/client';

// Parses the environment first: an invalid configuration stops the app before it renders.
import '@/shared/config/env';
import '@/shared/ui/styles/index.css';

import { syncThemeClass } from '@/shared/ui';

import { App } from './app';

// Sets .light or .dark before the first render, so the page never paints in the wrong mode.
syncThemeClass();

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(<App />);
