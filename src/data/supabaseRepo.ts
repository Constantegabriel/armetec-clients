import type { SupabaseClient } from '@supabase/supabase-js';
import { countBlocks } from '@/lib/templates';
import type { Project, ProjectGraph } from '@/lib/types';
import type { ProjectRepo } from './repo';

interface Row {
  id: string;
  name: string;
  niche: string;
  data: ProjectGraph;
  created_at: string;
  updated_at: string;
}

const fromRow = (r: Row): Project => ({
  id: r.id,
  name: r.name,
  niche: r.niche,
  data: r.data,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export function createSupabaseRepo(db: SupabaseClient): ProjectRepo {
  const table = () => db.from('projects');

  return {
    async list() {
      const { data, error } = await table()
        .select('id,name,niche,data,created_at,updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data as Row[]).map((r) => {
        const { data: graph, ...rest } = fromRow(r);
        return { ...rest, blockCount: countBlocks(graph) };
      });
    },

    async get(id) {
      const { data, error } = await table().select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? fromRow(data as Row) : null;
    },

    async create(input) {
      const { data, error } = await table()
        .insert({ name: input.name, niche: input.niche, data: input.data })
        .select('*')
        .single();
      if (error) throw error;
      return fromRow(data as Row);
    },

    async save(project) {
      const updatedAt = new Date().toISOString();
      const { error } = await table()
        .update({ name: project.name, niche: project.niche, data: project.data, updated_at: updatedAt })
        .eq('id', project.id);
      if (error) throw error;
      return { ...project, updatedAt };
    },

    async remove(id) {
      const { error } = await table().delete().eq('id', id);
      if (error) throw error;
    },
  };
}
