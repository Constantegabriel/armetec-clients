import { KINDS } from '@/lib/kinds';
import type { AppEdge, AppNode, ClientNodeData, ScopeNodeData } from '@/lib/types';

export interface OutlineEntry {
  node: AppNode & { type: 'scope'; data: ScopeNodeData };
  depth: number;
}

export interface Outline {
  client: ClientNodeData | null;
  entries: OutlineEntry[];
}

/**
 * Transforma o grafo numa lista ordenada: percorre a partir do cliente seguindo as
 * ligações (irmãos de cima para baixo). Blocos soltos entram no final.
 */
export function buildOutline(nodes: AppNode[], edges: AppEdge[]): Outline {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  const entries: OutlineEntry[] = [];

  const walk = (node: AppNode, depth: number) => {
    if (seen.has(node.id)) return;
    seen.add(node.id);
    if (node.type === 'scope') entries.push({ node: node as OutlineEntry['node'], depth });
    edges
      .filter((e) => e.source === node.id)
      .map((e) => byId.get(e.target))
      .filter((n): n is AppNode => Boolean(n))
      .sort((a, b) => a.position.y - b.position.y)
      .forEach((child) => walk(child, depth + 1));
  };

  const client = nodes.find((n) => n.type === 'client');
  if (client) walk(client, 0);
  nodes
    .filter((n) => !seen.has(n.id))
    .sort((a, b) => a.position.y - b.position.y)
    .forEach((n) => walk(n, 1));

  return { client: client?.type === 'client' ? client.data : null, entries };
}

const filled = <T extends { text: string }>(items: T[]) => items.filter((i) => i.text.trim());

export function toMarkdown(outline: Outline): string {
  const { client, entries } = outline;
  const lines: string[] = [];
  lines.push(`# ${client?.company.trim() || 'Projeto sem nome'}`);
  if (client?.niche.trim()) lines.push(`**Nicho:** ${client.niche.trim()}  `);
  lines.push(`_Escopo atualizado em ${new Date().toLocaleString('pt-BR')}_`, '');

  const notes = client ? filled(client.items) : [];
  if (notes.length) {
    lines.push('## Observações gerais', ...notes.map((i) => `- ${i.text.trim()}`), '');
  }

  for (const { node, depth } of entries) {
    const heading = '#'.repeat(Math.min(6, depth + 1));
    lines.push(`${heading} ${node.data.title.trim() || '(sem título)'} · ${KINDS[node.data.kind].label}`);
    const items = filled(node.data.items);
    if (items.length) lines.push(...items.map((i) => `- ${i.done ? '[x] ' : ''}${i.text.trim()}`));
    lines.push('');
  }
  return lines.join('\n').trim() + '\n';
}

export function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\w]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'projeto'
  );
}

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
