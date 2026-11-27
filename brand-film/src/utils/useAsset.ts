import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

/**
 * Resolve an async asset while holding the render (deterministic frames).
 * The hold is released only after React has committed the loaded value.
 */
export function useAsset<T>(key: string, load: () => Promise<T>): T | null {
  const [state, setState] = useState<{key: string; value: T | null; done: boolean} | null>(null);
  const [handle] = useState(() => delayRender(`asset:${key}`));
  useEffect(() => {
    let alive = true;
    load()
      .then((v) => alive && setState({key, value: v, done: true}))
      .catch((e) => {
        console.error(e);
        if (alive) setState({key, value: null, done: true});
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const done = !!state?.done;
  useEffect(() => {
    if (done) {
      // one more frame so children that depend on the value (WebGL) commit too
      requestAnimationFrame(() => continueRender(handle));
    }
  }, [done, handle]);
  return state ? state.value : null;
}
