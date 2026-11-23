import { newId } from './id';
import type { AppEdge, AppNode, ProjectGraph, ScopeItem, ScopeKind } from './types';

const items = (...texts: string[]): ScopeItem[] =>
  (texts.length ? texts : ['']).map((text) => ({ id: newId(), text }));

interface Branch {
  kind: ScopeKind;
  title: string;
  items?: string[];
  children?: Branch[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  branches: Branch[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Em branco',
    description: 'Só o bloco do cliente. Você monta tudo na hora.',
    branches: [],
  },
  {
    id: 'site',
    name: 'Site institucional',
    description: 'Início, Sobre, Serviços e Contato já ligados.',
    branches: [
      { kind: 'page', title: 'Página inicial', items: ['Banner principal com chamada para ação', 'Resumo dos serviços', 'Depoimentos'] },
      { kind: 'page', title: 'Sobre', items: ['História da empresa', 'Equipe'] },
      { kind: 'page', title: 'Serviços', items: [''] },
      {
        kind: 'page',
        title: 'Contato',
        items: ['Formulário de contato', 'Mapa'],
        children: [{ kind: 'integration', title: 'WhatsApp', items: ['Botão flutuante'] }],
      },
    ],
  },
  {
    id: 'system',
    name: 'Sistema / painel',
    description: 'Login, painel, cadastros e relatórios.',
    branches: [
      { kind: 'feature', title: 'Login e usuários', items: ['Níveis de acesso'] },
      { kind: 'page', title: 'Painel (dashboard)', items: ['Indicadores principais'] },
      { kind: 'feature', title: 'Cadastros', items: [''] },
      { kind: 'feature', title: 'Relatórios', items: ['Exportar PDF / Excel'] },
    ],
  },
];

export const CLIENT_NODE_ID = 'client';

/** Monta o grafo inicial de um projeto a partir de um modelo. */
export function buildGraph(template: Template, company = '', niche = ''): ProjectGraph {
  const nodes: AppNode[] = [
    {
      id: CLIENT_NODE_ID,
      type: 'client',
      position: { x: 0, y: 0 },
      deletable: false,
      data: { company, niche, items: items() },
    },
  ];
  const edges: AppEdge[] = [];

  const place = (branches: Branch[], parentId: string, depth: number, startY: number): number => {
    let y = startY;
    for (const b of branches) {
      const id = newId();
      nodes.push({
        id,
        type: 'scope',
        position: { x: depth * 380, y },
        data: { kind: b.kind, title: b.title, items: items(...(b.items ?? [])) },
      });
      edges.push({ id: newId(), source: parentId, target: id });
      const childEnd = b.children ? place(b.children, id, depth + 1, y) : y;
      y = Math.max(y + 60 + 40 * Math.max(1, b.items?.length ?? 1) + 60, childEnd);
    }
    return y;
  };
  place(template.branches, CLIENT_NODE_ID, 1, 0);

  return { version: 1, nodes, edges };
}

export function countBlocks(graph: ProjectGraph): number {
  return graph.nodes.filter((n) => n.type === 'scope').length;
}
