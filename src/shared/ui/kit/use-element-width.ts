import { useCallback, useState } from 'react';

/**
 * Width of an element, kept up to date (Flutter's LayoutBuilder): screens choose their layout by
 * the width of their content area, not the window's, as the sidebar takes part of it. Null until
 * the element is measured. The width includes the element's padding and border.
 */
export function useElementWidth() {
  const [width, setWidth] = useState<number | null>(null);
  const ref = useCallback((element: Element | null) => {
    if (!element) return;
    const initial = element.getBoundingClientRect().width;
    if (initial > 0) setWidth(initial);
    const observer = new ResizeObserver((entries) => {
      const entry = entries.at(-1);
      if (entry) setWidth(entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  return [ref, width] as const;
}
