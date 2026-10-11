import { useRouter, type NavigateOptions } from '@tanstack/react-router';

/**
 * The back buttons of detail and form screens (Flutter `Navigator.pop`): back in the history,
 * so the list keeps its filters and page; on a screen opened from a link, its list instead.
 */
export function useGoBack(fallback: NavigateOptions['to']) {
  const router = useRouter();
  return () => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }
    void router.navigate({ to: fallback, replace: true });
  };
}
