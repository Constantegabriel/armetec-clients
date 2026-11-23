import { useEffect, useRef } from 'react';
import { useEditor } from '../store';
import { focusWhenReady } from './focusWhenReady';

/** Foca o campo de título quando o bloco acabou de ser criado. */
export function useFocusTitle<T extends HTMLInputElement>(nodeId: string) {
  const ref = useRef<T>(null);
  const shouldFocus = useEditor((s) => s.focus?.nodeId === nodeId && s.focus.target === 'title');
  useEffect(() => {
    if (!shouldFocus || !ref.current) return;
    focusWhenReady(ref.current, () => useEditor.getState().clearFocus());
  }, [shouldFocus]);
  return ref;
}
