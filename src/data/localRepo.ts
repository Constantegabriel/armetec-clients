import { newId } from '@/lib/id';
import { countBlocks } from '@/lib/templates';
import type { Project } from '@/lib/types';
import type { ProjectRepo } from './repo';

const KEY = 'escopo:projects';

function readAll(): Record<string, Project> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Project>;
  } catch {
    return {};
  }
}
function writeAll(all: Record<string, Project>) {
  localStorage.setItem(KEY, JSON.stringify(all));
}

/** Armazenamento só neste navegador. Usado quando o Supabase não está configurado. */
export function createLocalRepo(): ProjectRepo {
  return {
    async list() {
      return Object.values(readAll())
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(({ data, ...rest }) => ({ ...rest, blockCount: countBlocks(data) }));
    },
    async get(id) {
      return readAll()[id] ?? null;
    },
    async create(input) {
      const now = new Date().toISOString();
      const project: Project = { id: newId(), ...input, createdAt: now, updatedAt: now };
      writeAll({ ...readAll(), [project.id]: project });
      return project;
    },
    async save(project) {
      const saved = { ...project, updatedAt: new Date().toISOString() };
      writeAll({ ...readAll(), [project.id]: saved });
      return saved;
    },
    async remove(id) {
      const all = readAll();
      delete all[id];
      writeAll(all);
    },
  };
}
