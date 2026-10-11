import { createRoot } from 'react-dom/client';

// Parses the environment first: an invalid configuration stops the app before it renders.
import '@/shared/config/env';
import '@/shared/ui/styles/index.css';

import { App } from './app';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(<App />);
