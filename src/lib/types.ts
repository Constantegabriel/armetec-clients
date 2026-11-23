import type { Edge, Node, Viewport } from '@xyflow/react';

/** Tipos de bloco de escopo (o bloco do cliente é tratado à parte). */
export type ScopeKind = 'page' | 'feature' | 'integration' | 'note';

export interface ScopeItem {
  id: string;
  text: string;
  done?: boolean;
}

export type ClientNodeData = {
  company: string;
  niche: string;
  items: ScopeItem[];
};

export type ScopeNodeData = {
  kind: ScopeKind;
  title: string;
  items: ScopeItem[];
};

export type ClientNode = Node<ClientNodeData, 'client'>;
export type ScopeNode = Node<ScopeNodeData, 'scope'>;
export type AppNode = ClientNode | ScopeNode;
export type AppEdge = Edge;

/** O que fica salvo na coluna `data` (jsonb). */
export interface ProjectGraph {
  version: 1;
  nodes: AppNode[];
  edges: AppEdge[];
  viewport?: Viewport;
}

export interface Project {
  id: string;
  name: string;
  niche: string;
  data: ProjectGraph;
  createdAt: string;
  updatedAt: string;
}

export type ProjectSummary = Omit<Project, 'data'> & { blockCount: number };
