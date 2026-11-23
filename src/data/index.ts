import { supabase } from '@/lib/supabase';
import { createLocalRepo } from './localRepo';
import { createSupabaseRepo } from './supabaseRepo';
import type { ProjectRepo } from './repo';

export const repo: ProjectRepo = supabase ? createSupabaseRepo(supabase) : createLocalRepo();
export type { ProjectRepo, NewProjectInput } from './repo';
