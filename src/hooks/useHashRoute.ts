import { useCallback, useSyncExternalStore } from 'react';

/** Current hash route, normalised to a leading-slash path ("/", "/app"). */
function getRoute(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h.startsWith('/') ? h : '/';
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/**
 * A dependency-free hash router. Returns the active route and a `navigate`
 * helper. Hash routing keeps the app a single static bundle (no server rewrites
 * needed) while still giving each screen a shareable URL.
 */
export function useHashRoute() {
  const route = useSyncExternalStore(subscribe, getRoute, () => '/');

  const navigate = useCallback((to: string) => {
    const path = to.startsWith('/') ? to : `/${to}`;
    if (window.location.hash !== `#${path}`) {
      window.location.hash = `#${path}`;
    }
    // New screen always starts at the top.
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return { route, navigate };
}
