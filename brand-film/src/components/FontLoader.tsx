import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT_FILES} from '../config/theme';

let loaded: Promise<void> | null = null;
const loadAll = () => {
  if (!loaded) {
    loaded = Promise.all(
      FONT_FILES.map(async (f) => {
        const face = new FontFace(f.family, `url(${staticFile(f.file)}) format('woff2')`, {weight: f.weight});
        await face.load();
        document.fonts.add(face);
      }),
    ).then(() => undefined);
  }
  return loaded;
};

/** Blocks rendering until the brand fonts are ready (no FOUT in any frame). */
export const FontLoader: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadAll()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
        setReady(true);
      });
  }, [handle]);
  return ready ? <>{children}</> : null;
};
