import { useCallback, useEffect, useRef, useState } from 'react';
import { repo } from '@/data';
import type { Project } from '@/lib/types';
import { useEditor } from './store';

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'offline' | 'error';

const DEBOUNCE_MS = 700;
const RETRY_MS = 8000;
const draftKey = (id: string) => `escopo:draft:${id}`;

interface Draft {
  project: Project;
  /** Momento da última edição local (ms). */
  editedAt: number;
}

/** Cópia local de segurança: fica guardada até o servidor confirmar o salvamento. */
export const drafts = {
  read(id: string): Draft | null {
    try {
      return JSON.parse(localStorage.getItem(draftKey(id)) ?? 'null') as Draft | null;
    } catch {
      return null;
    }
  },
  write(project: Project) {
    try {
      localStorage.setItem(draftKey(project.id), JSON.stringify({ project, editedAt: Date.now() } satisfies Draft));
    } catch {
      /* armazenamento cheio ou bloqueado: segue só com o servidor */
    }
  },
  clear(id: string) {
    localStorage.removeItem(draftKey(id));
  },
};

/**
 * Salva o projeto aberto sempre que algo muda (com um pequeno atraso),
 * guarda um rascunho local a cada alteração e tenta de novo quando a conexão volta.
 */
export function useAutosave(): { status: SaveStatus; flush: () => Promise<void> } {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const savedRevision = useRef(0);
  const inFlight = useRef<Promise<void> | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const save = useCallback(async (): Promise<void> => {
    if (inFlight.current) await inFlight.current;
    const { revision, snapshot } = useEditor.getState();
    if (revision === savedRevision.current) return;
    const project = snapshot();
    if (!project) return;

    setStatus('saving');
    inFlight.current = (async () => {
      try {
        await repo.save(project);
        savedRevision.current = revision;
        if (useEditor.getState().revision === revision) {
          drafts.clear(project.id);
          setStatus('saved');
        } else {
          setStatus('pending');
        }
      } catch (err) {
        console.error('Falha ao salvar', err);
        setStatus(navigator.onLine ? 'error' : 'offline');
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => void save(), RETRY_MS);
      } finally {
        inFlight.current = null;
      }
    })();
    return inFlight.current;
  }, []);

  useEffect(() => {
    const unsubscribe = useEditor.subscribe((state, prev) => {
      if (state.project && state.project.id !== prev.project?.id) savedRevision.current = state.revision;
      if (state.revision === prev.revision || state.revision === savedRevision.current) return;
      const snap = state.snapshot();
      if (snap) drafts.write(snap);
      setStatus((s) => (s === 'offline' || s === 'error' ? s : 'pending'));
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void save(), DEBOUNCE_MS);
    });

    const onOnline = () => void save();
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useEditor.getState().revision !== savedRevision.current) e.preventDefault();
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      unsubscribe();
      window.clearTimeout(timer.current);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [save]);

  return { status, flush: save };
}
