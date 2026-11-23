import type { AppEdge, AppNode } from '@/lib/types';

interface LayoutOptions {
  gapX: number;
  gapY: number;
  fallbackHeight: number;
}

/**
 * Organiza os blocos em árvore da esquerda para a direita, a partir do cliente.
 * Cada bloco fica alinhado ao topo do seu primeiro filho; a ordem dos irmãos
 * respeita a posição vertical atual (o que o usuário já arrumou é mantido).
 * Blocos soltos (sem ligação com o cliente) vão para baixo da árvore.
 */
export function layoutTree(nodes: AppNode[], edges: AppEdge[], opts: LayoutOptions): AppNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const height = (n: AppNode) => n.measured?.height ?? opts.fallbackHeight;
  const children = (id: string) =>
    edges
      .filter((e) => e.source === id)
      .map((e) => byId.get(e.target))
      .filter((n): n is AppNode => Boolean(n))
      .sort((a, b) => a.position.y - b.position.y);

  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();

  /** Posiciona a subárvore e devolve o Y livre logo abaixo dela. */
  const place = (node: AppNode, depth: number, top: number): number => {
    visited.add(node.id);
    positions.set(node.id, { x: depth * opts.gapX, y: top });
    let cursor = top;
    for (const child of children(node.id)) {
      if (visited.has(child.id)) continue;
      cursor = place(child, depth + 1, cursor);
    }
    return Math.max(cursor, top + height(node) + opts.gapY);
  };

  const root = nodes.find((n) => n.type === 'client');
  let bottom = root ? place(root, 0, 0) : 0;

  const orphans = nodes.filter((n) => !visited.has(n.id)).sort((a, b) => a.position.y - b.position.y);
  for (const n of orphans) {
    if (visited.has(n.id)) continue;
    bottom = place(n, 1, bottom + opts.gapY);
  }

  return nodes.map((n) => {
    const p = positions.get(n.id);
    return p ? { ...n, position: p } : n;
  });
}
