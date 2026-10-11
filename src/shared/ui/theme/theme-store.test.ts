import { setViewport } from '@/test/match-media';

import { resolveScheme, syncThemeClass, useThemeStore } from './theme-store';

describe('resolveScheme', () => {
  it('follows the device in system mode and the choice otherwise', () => {
    expect(resolveScheme('system', true)).toBe('dark');
    expect(resolveScheme('system', false)).toBe('light');
    expect(resolveScheme('light', true)).toBe('light');
    expect(resolveScheme('dark', false)).toBe('dark');
  });
});

describe('syncThemeClass', () => {
  let stop: () => void;
  const root = document.createElement('div');

  afterEach(() => {
    stop();
    useThemeStore.setState({ mode: 'system' });
  });

  it('puts .light or .dark on the root and follows the device in system mode', () => {
    stop = syncThemeClass(root);
    expect(root.className).toBe('light');

    setViewport({ prefersDark: true });
    expect(root.className).toBe('dark');
  });

  it('applies and stores the chosen mode', () => {
    stop = syncThemeClass(root);
    useThemeStore.getState().setMode('dark');
    expect(root.className).toBe('dark');

    useThemeStore.getState().setMode('light');
    setViewport({ prefersDark: true });
    expect(root.className).toBe('light');
    expect(JSON.parse(localStorage.getItem('hj_admin.theme') ?? '{}')).toMatchObject({
      state: { mode: 'light' },
    });
  });
});
