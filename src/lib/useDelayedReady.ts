import { useEffect, useState } from 'react';

/** Brief loading gate so grids can show polished skeletons on first paint.
 *  Honours reduced-motion by resolving immediately. */
export function useDelayedReady(ms = 260): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const reduce =
      document.documentElement.getAttribute('data-reduced-motion') === 'true';
    if (reduce) {
      setReady(true);
      return;
    }
    const t = window.setTimeout(() => setReady(true), ms);
    return () => window.clearTimeout(t);
  }, [ms]);
  return ready;
}
