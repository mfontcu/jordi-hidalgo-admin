// jsdom has no matchMedia. This one answers `(min-width: Npx)`, `(max-width: Npx)`, and
// `(prefers-color-scheme: dark)` from a simulated viewport, and notifies listeners on change.

type Viewport = { width: number; prefersDark: boolean };

const DEFAULT_VIEWPORT: Viewport = { width: 1440, prefersDark: false };
let viewport: Viewport = { ...DEFAULT_VIEWPORT };
const lists = new Set<FakeMediaQueryList>();

function evaluate(query: string): boolean {
  return query.split(' and ').every((part) => {
    const minWidth = /min-width:\s*(\d+)px/.exec(part);
    if (minWidth) return viewport.width >= Number(minWidth[1]);
    const maxWidth = /max-width:\s*([\d.]+)px/.exec(part);
    if (maxWidth) return viewport.width <= Number(maxWidth[1]);
    if (part.includes('prefers-color-scheme: dark')) return viewport.prefersDark;
    return false;
  });
}

class FakeMediaQueryList extends EventTarget {
  readonly media: string;
  matches: boolean;
  onchange: ((event: MediaQueryListEvent) => void) | null = null;

  constructor(media: string) {
    super();
    this.media = media;
    this.matches = evaluate(media);
    lists.add(this);
  }

  addListener(listener: (event: MediaQueryListEvent) => void) {
    this.addEventListener('change', listener as EventListener);
  }

  removeListener(listener: (event: MediaQueryListEvent) => void) {
    this.removeEventListener('change', listener as EventListener);
  }

  refresh() {
    const matches = evaluate(this.media);
    if (matches === this.matches) return;
    this.matches = matches;
    this.dispatchEvent(Object.assign(new Event('change'), { matches, media: this.media }));
  }
}

export function installMatchMedia() {
  window.matchMedia = (query: string) => new FakeMediaQueryList(query);
}

/** Changes the simulated viewport and notifies the media queries whose answer changed. */
export function setViewport(next: Partial<Viewport>) {
  viewport = { ...viewport, ...next };
  for (const list of lists) list.refresh();
}

export function resetViewport() {
  viewport = { ...DEFAULT_VIEWPORT };
  lists.clear();
}
