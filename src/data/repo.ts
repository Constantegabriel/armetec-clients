import type { Project, ProjectGraph, ProjectSummary } from '@/lib/types';

export interface NewProjectInput {
  name: string;
  niche: string;
  data: ProjectGraph;
}

/**
 * Contrato de armazenamento. Hoje há duas implementações:
 * Supabase (nuvem, com login) e localStorage (modo local / sem configuração).
 */
export interface ProjectRepo {
  list(): Promise<ProjectSummary[]>;
  get(id: string): Promise<Project | null>;
  create(input: NewProjectInput): Promise<Project>;
  save(project: Project): Promise<Project>;
  remove(id: string): Promise<void>;
}
