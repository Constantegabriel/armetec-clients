import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { ArrowLeft, ChevronDown, Copy, FileDown, FileText, LayoutGrid, Plus, Printer } from 'lucide-react';
import { repo } from '@/data';
import { Menu } from '@/components/Menu';
import { Modal } from '@/components/Modal';
import { Canvas } from '@/editor/Canvas';
import { PrintView } from '@/editor/PrintView';
import { SaveIndicator } from '@/editor/SaveIndicator';
import { buildOutline, downloadFile, slugify, toMarkdown } from '@/editor/outline';
import { useEditor } from '@/editor/store';
import { drafts, useAutosave } from '@/editor/useAutosave';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

export function EditorPage() {
  const { id = '' } = useParams();
  const [state, setState] = useState<LoadState>('loading');
  const { status, flush } = useAutosave();

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    (async () => {
      try {
        const remote = await repo.get(id);
        const draft = drafts.read(id);
        if (cancelled) return;
        // Se houver alterações locais mais novas que não chegaram ao servidor, elas vencem.
        const useDraft = draft && (!remote || draft.editedAt > Date.parse(remote.updatedAt));
        const project = useDraft ? draft.project : remote;
        if (!project) return setState('not-found');
        useEditor.getState().load(project);
        if (useDraft) useEditor.setState((s) => ({ revision: s.revision + 1 }));
        setState('ready');
      } catch (err) {
        console.error(err);
        const draft = drafts.read(id);
        if (cancelled) return;
        if (draft) {
          useEditor.getState().load(draft.project);
          useEditor.setState((s) => ({ revision: s.revision + 1 }));
          setState('ready');
        } else setState('error');
      }
    })();
    return () => {
      cancelled = true;
      // Garante que nada fica para trás ao sair; só limpa se nenhum outro projeto já foi aberto.
      void flush().finally(() => {
        if (useEditor.getState().project?.id === id) useEditor.getState().reset();
      });
    };
  }, [id, flush]);

  if (state === 'loading') return <div className="center-screen muted">Carregando projeto…</div>;
  if (state !== 'ready')
    return (
      <div className="center-screen">
        <p>{state === 'not-found' ? 'Projeto não encontrado.' : 'Não foi possível abrir o projeto. Verifique a conexão.'}</p>
        <Link className="btn" to="/">
          Voltar para projetos
        </Link>
      </div>
    );

  return (
    <ReactFlowProvider key={id}>
      <div className="editor">
        <EditorTopbar status={status} flush={flush} />
        <Canvas />
      </div>
    </ReactFlowProvider>
  );
}

function EditorTopbar({ status, flush }: { status: ReturnType<typeof useAutosave>['status']; flush: () => Promise<void> }) {
  const navigate = useNavigate();
  const { getViewport, fitView } = useReactFlow();
  const company = useEditor((s) => s.nodes.find((n) => n.type === 'client')?.data as { company: string; niche: string } | undefined);
  const [showText, setShowText] = useState(false);
  const [printing, setPrinting] = useState(false);

  const addBlock = () => {
    const { nodes, addChild, addNode } = useEditor.getState();
    const selected = nodes.find((n) => n.selected);
    if (selected) return addChild(selected.id);
    const vp = getViewport();
    const el = document.querySelector('.canvas')!.getBoundingClientRect();
    addNode({ x: (el.width / 2 - vp.x) / vp.zoom - 145, y: (el.height / 2 - vp.y) / vp.zoom - 80 });
  };

  const organize = () => {
    useEditor.getState().autoLayout();
    requestAnimationFrame(() => fitView({ padding: 0.2, maxZoom: 1, duration: 300 }));
  };

  const print = () => {
    setPrinting(true);
    requestAnimationFrame(() => {
      window.print();
      setPrinting(false);
    });
  };

  const exportJson = () => {
    const snap = useEditor.getState().snapshot();
    if (snap) downloadFile(`${slugify(snap.name)}.json`, JSON.stringify(snap, null, 2), 'application/json');
  };

  const duplicate = async () => {
    await flush();
    const snap = useEditor.getState().snapshot();
    if (!snap) return;
    const copy = await repo.create({ name: `${snap.name} (cópia)`, niche: snap.niche, data: snap.data });
    navigate(`/p/${copy.id}`);
  };

  return (
    <>
      <header className="topbar">
        <Link to="/" className="icon-btn" title="Voltar para projetos">
          <ArrowLeft size={18} />
        </Link>
        <div className="topbar-title">
          <strong>{company?.company.trim() || 'Novo cliente'}</strong>
          {company?.niche.trim() && <span className="muted"> · {company.niche.trim()}</span>}
        </div>
        <SaveIndicator status={status} />
        <span className="grow" />
        <button className="btn" onClick={organize} title="Organizar os blocos em árvore">
          <LayoutGrid size={16} />
          <span className="hide-sm">Organizar</span>
        </button>
        <Menu
          trigger={({ toggle }) => (
            <button className="btn" onClick={toggle}>
              <FileDown size={16} />
              <span className="hide-sm">Exportar</span>
              <ChevronDown size={14} />
            </button>
          )}
        >
          {(close) => (
            <>
              <button onClick={() => (setShowText(true), close())}>
                <FileText size={16} /> Ver escopo em texto
              </button>
              <button onClick={() => (print(), close())}>
                <Printer size={16} /> Imprimir / salvar PDF
              </button>
              <button onClick={() => (exportJson(), close())}>
                <FileDown size={16} /> Baixar backup (.json)
              </button>
              <hr />
              <button onClick={() => (void duplicate(), close())}>
                <Copy size={16} /> Duplicar como modelo
              </button>
            </>
          )}
        </Menu>
        <button className="btn primary" onClick={addBlock} title="Novo bloco (ligado ao bloco selecionado, se houver)">
          <Plus size={16} />
          <span className="hide-sm">Bloco</span>
        </button>
      </header>

      {showText && <ScopeTextModal onClose={() => setShowText(false)} />}
      {printing && <PrintSnapshot />}
    </>
  );
}

function PrintSnapshot() {
  const { nodes, edges } = useEditor.getState();
  // Renderiza fora do editor, que fica oculto na impressão.
  return createPortal(<PrintView outline={buildOutline(nodes, edges)} />, document.body);
}

function ScopeTextModal({ onClose }: { onClose: () => void }) {
  const markdown = useMemo(() => {
    const { nodes, edges } = useEditor.getState();
    return toMarkdown(buildOutline(nodes, edges));
  }, []);
  const [copied, setCopied] = useState(false);
  const name = useEditor.getState().snapshot()?.name ?? 'projeto';

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal
      title="Escopo em texto"
      onClose={onClose}
      wide
      actions={
        <>
          <button className="btn" onClick={copy}>
            {copied ? 'Copiado ✓' : 'Copiar'}
          </button>
          <button className="btn" onClick={() => downloadFile(`${slugify(name)}.md`, markdown, 'text/markdown')}>
            Baixar .md
          </button>
        </>
      }
    >
      <textarea className="markdown-out" readOnly value={markdown} />
    </Modal>
  );
}
