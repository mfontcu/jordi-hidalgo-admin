import { useEffect, useState } from 'react';

/** AdminDebouncedSearch: a search applies 350ms after the last keystroke, a cleared one at once. */
export const SEARCH_DEBOUNCE_MS = 350;

/**
 * A list's search field over its `search` URL parameter: the field's text runs ahead of the URL
 * while the debounce waits, and `apply` writes the trimmed text. A URL change from elsewhere (back,
 * a link) replaces the text.
 */
export function useDebouncedText(urlText: string, apply: (query: string) => void) {
  const [text, setText] = useState(urlText);
  const [syncedText, setSyncedText] = useState(urlText);
  if (urlText !== syncedText) {
    setSyncedText(urlText);
    if (text.trim() !== urlText) setText(urlText);
  }

  const query = text.trim();
  useEffect(() => {
    if (query === urlText) return;
    if (!query) {
      apply(query);
      return;
    }
    const timer = setTimeout(() => {
      apply(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [query, urlText, apply]);

  return { text, setText, query };
}
