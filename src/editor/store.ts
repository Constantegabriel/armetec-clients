import { create } from 'zustand';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type Viewport,
  type XYPosition,
} from '@xyflow/react';
import { childKindOf } from '@/lib/kinds';
import { newId } from '@/lib/id';
import { CLIENT_NODE_ID } from '@/lib/templates';
import type {
  AppEdge,
  AppNode,
  ClientNodeData,
  Project,
  ProjectGraph,
  ScopeItem,
  ScopeKind,
  ScopeNodeData,
} from '@/lib/types';
import { layoutTree } from './layout';

/** Pedido de foco: o componente do bloco correspondente foca o campo e limpa o pedido. */
export interface FocusRequest {
  nodeId: string;
  /** 'title' ou o id de um item da lista. */
  target: 'title' | string;
}

interface EditorState {
  project: Project | null;
  nodes: AppNode[];
  edges: AppEdge[];
  viewport: Viewport | undefined;
  /** Incrementa a cada alteração que precisa ser salva. */
  revision: number;
  focus: FocusRequest | null;

  load(project: Project): void;
  reset(): void;
  snapshot(): Project | null;
  clearFocus(): void;

  onNodesChange(changes: NodeChange<AppNode>[]): void;
  onEdgesChange(changes: EdgeChange<AppEdge>[]): void;
  onConnect(connection: Connection): void;
  setViewport(viewport: Viewport): void;

  updateClient(patch: Partial<Omit<ClientNodeData, 'items'>>): void;
  updateScope(id: string, patch: Partial<Omit<ScopeNodeData, 'items'>>): void;

  addItem(nodeId: string, afterItemId?: string): void;
  updateItem(nodeId: string, itemId: string, patch: Partial<Omit<ScopeItem, 'id'>>): void;
  removeItem(nodeId: string, itemId: string, opts?: { focusPrevious?: boolean }): void;

  addNode(position: XYPosition, kind?: ScopeKind, parentId?: string): string;
  addChild(parentId: string): string;
  duplicateNode(id: string): void;
  deleteNode(id: string): void;
  autoLayout(): void;
}

const emptyItem = (): ScopeItem => ({ id: newId(), text: '' });

const NODE_GAP_X = 380;
const NODE_GAP_Y = 32;
const FALLBACK_HEIGHT = 170;

/** Aplica `fn` aos itens de um bloco, criando novos objetos (imutável). */
function mapItems(nodes: AppNode[], nodeId: string, fn: (items: ScopeItem[]) => ScopeItem[]): AppNode[] {
  return nodes.map((n) => (n.id === nodeId ? ({ ...n, data: { ...n.data, items: fn(n.data.items) } } as AppNode) : n));
}

export const useEditor = create<EditorState>((set, get) => {
  /** Atualiza o estado e marca como "precisa salvar". */
  const commit = (partial: Partial<EditorState> | ((s: EditorState) => Partial<EditorState>)) =>
    set((s) => ({ ...(typeof partial === 'function' ? partial(s) : partial), revision: s.revision + 1 }));

  return {
    project: null,
    nodes: [],
    edges: [],
    viewport: undefined,
    revision: 0,
    focus: null,

    load(project) {
      set({
        project,
        nodes: project.data.nodes,
        edges: project.data.edges,
        viewport: project.data.viewport,
        revision: 0,
        focus: null,
      });
    },

    reset() {
      set({ project: null, nodes: [], edges: [], viewport: undefined, revision: 0, focus: null });
    },

    snapshot() {
      const { project, nodes, edges, viewport } = get();
      if (!project) return null;
      const client = nodes.find((n) => n.type === 'client');
      const company = client?.type === 'client' ? client.data.company.trim() : '';
      const niche = client?.type === 'client' ? client.data.niche.trim() : '';
      const data: ProjectGraph = {
        version: 1,
        // Remove estado de interface (seleção, arrasto) antes de salvar.
        nodes: nodes.map(({ selected: _s, dragging: _d, ...n }) => n as AppNode),
        edges: edges.map(({ selected: _s, ...e }) => e),
        viewport,
      };
      return { ...project, name: company || 'Sem nome', niche, data };
    },

    clearFocus: () => set({ focus: null }),

    onNodesChange(changes) {
      // Seleção e medição de tamanho não precisam ser salvas.
      const persistent = changes.some(
        (c) => c.type === 'remove' || c.type === 'add' || (c.type === 'position' && !c.dragging),
      );
      const update = (s: EditorState) => ({ nodes: applyNodeChanges(changes, s.nodes) });
      if (persistent) commit(update);
      else set(update);
    },

    onEdgesChange(changes) {
      const persistent = changes.some((c) => c.type === 'remove' || c.type === 'add');
      const update = (s: EditorState) => ({ edges: applyEdgeChanges(changes, s.edges) });
      if (persistent) commit(update);
      else set(update);
    },

    onConnect(connection) {
      if (connection.source === connection.target) return;
      commit((s) => ({ edges: addEdge({ ...connection, id: newId() }, s.edges) }));
    },

    setViewport(viewport) {
      commit({ viewport });
    },

    updateClient(patch) {
      commit((s) => ({
        nodes: s.nodes.map((n) => (n.type === 'client' ? { ...n, data: { ...n.data, ...patch } } : n)),
      }));
    },

    updateScope(id, patch) {
      commit((s) => ({
        nodes: s.nodes.map((n) => (n.id === id && n.type === 'scope' ? { ...n, data: { ...n.data, ...patch } } : n)),
      }));
    },

    addItem(nodeId, afterItemId) {
      const item = emptyItem();
      commit((s) => ({
        nodes: mapItems(s.nodes, nodeId, (items) => {
          const at = afterItemId ? items.findIndex((i) => i.id === afterItemId) + 1 : items.length;
          return [...items.slice(0, at), item, ...items.slice(at)];
        }),
        focus: { nodeId, target: item.id },
      }));
    },

    updateItem(nodeId, itemId, patch) {
      commit((s) => ({
        nodes: mapItems(s.nodes, nodeId, (items) => items.map((i) => (i.id === itemId ? { ...i, ...patch } : i))),
      }));
    },

    removeItem(nodeId, itemId, opts) {
      commit((s) => {
        const node = s.nodes.find((n) => n.id === nodeId);
        if (!node) return {};
        const idx = node.data.items.findIndex((i) => i.id === itemId);
        const remaining = node.data.items.filter((i) => i.id !== itemId);
        const items = remaining.length ? remaining : [emptyItem()];
        const prev = items[Math.max(0, idx - 1)];
        return {
          nodes: mapItems(s.nodes, nodeId, () => items),
          focus: opts?.focusPrevious ? { nodeId, target: prev.id } : s.focus,
        };
      });
    },

    addNode(position, kind = 'page', parentId) {
      const id = newId();
      commit((s) => ({
        nodes: [
          ...s.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
          {
            id,
            type: 'scope',
            position,
            selected: true,
            // Tamanho estimado: faz o React Flow exibir o bloco já no primeiro quadro (e o foco funcionar).
            initialWidth: 290,
            initialHeight: FALLBACK_HEIGHT,
            data: { kind, title: '', items: [emptyItem()] },
          } as AppNode,
        ],
        edges: parentId ? [...s.edges, { id: newId(), source: parentId, target: id }] : s.edges,
        focus: { nodeId: id, target: 'title' },
      }));
      return id;
    },

    addChild(parentId) {
      const { nodes, edges } = get();
      const parent = nodes.find((n) => n.id === parentId);
      if (!parent) return '';
      const siblings = edges
        .filter((e) => e.source === parentId)
        .map((e) => nodes.find((n) => n.id === e.target))
        .filter((n): n is AppNode => Boolean(n));

      let y = parent.position.y;
      if (siblings.length) {
        const lowest = siblings.reduce((a, b) =>
          b.position.y + (b.measured?.height ?? FALLBACK_HEIGHT) > a.position.y + (a.measured?.height ?? FALLBACK_HEIGHT) ? b : a,
        );
        y = lowest.position.y + (lowest.measured?.height ?? FALLBACK_HEIGHT) + NODE_GAP_Y;
      }
      const kind = childKindOf(parent.type === 'client' ? 'client' : parent.data.kind);
      return get().addNode({ x: parent.position.x + NODE_GAP_X, y }, kind, parentId);
    },

    duplicateNode(id) {
      const { nodes, edges } = get();
      const src = nodes.find((n) => n.id === id);
      if (!src || src.type !== 'scope') return;
      const copyId = newId();
      const copy: AppNode = {
        ...src,
        id: copyId,
        selected: true,
        position: { x: src.position.x + 40, y: src.position.y + 40 },
        data: {
          ...src.data,
          title: src.data.title ? `${src.data.title} (cópia)` : '',
          items: src.data.items.map((i) => ({ ...i, id: newId() })),
        },
      };
      const incoming = edges.filter((e) => e.target === id).map((e) => ({ id: newId(), source: e.source, target: copyId }));
      commit({
        nodes: [...nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), copy],
        edges: [...edges, ...incoming],
      });
    },

    deleteNode(id) {
      if (id === CLIENT_NODE_ID) return;
      commit((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      }));
    },

    autoLayout() {
      commit((s) => ({ nodes: layoutTree(s.nodes, s.edges, { gapX: NODE_GAP_X, gapY: NODE_GAP_Y, fallbackHeight: FALLBACK_HEIGHT }) }));
    },
  };
});
