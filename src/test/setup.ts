import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { toast } from 'sonner';

import { installMatchMedia, resetViewport } from './match-media';
import { server } from './msw/server';

installMatchMedia();
// jsdom reports en-US; the panel's tests expect the Spanish a browser in Spain gets.
Object.defineProperty(navigator, 'languages', { value: ['es-ES'], configurable: true });

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  cleanup();
  // Sonner keeps toasts after the toaster unmounts and replays them on the next screen.
  toast.dismiss();
  server.resetHandlers();
  localStorage.clear();
  resetViewport();
});
afterAll(() => {
  server.close();
});
