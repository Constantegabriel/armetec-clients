import { FileText, Puzzle, PlugZap, StickyNote, type LucideIcon } from 'lucide-react';
import type { ScopeKind } from './types';

export interface KindMeta {
  label: string;
  /** Plural usado nos resumos. */
  plural: string;
  color: string;
  icon: LucideIcon;
  titlePlaceholder: string;
  itemPlaceholder: string;
}

export const KINDS: Record<ScopeKind, KindMeta> = {
  page: {
    label: 'Página',
    plural: 'Páginas',
    color: 'var(--kind-page)',
    icon: FileText,
    titlePlaceholder: 'Ex.: Página inicial',
    itemPlaceholder: 'O que a página vai conter…',
  },
  feature: {
    label: 'Funcionalidade',
    plural: 'Funcionalidades',
    color: 'var(--kind-feature)',
    icon: Puzzle,
    titlePlaceholder: 'Ex.: Formulário de orçamento',
    itemPlaceholder: 'Detalhe da funcionalidade…',
  },
  integration: {
    label: 'Integração',
    plural: 'Integrações',
    color: 'var(--kind-integration)',
    icon: PlugZap,
    titlePlaceholder: 'Ex.: WhatsApp, Instagram…',
    itemPlaceholder: 'Como vai integrar…',
  },
  note: {
    label: 'Observação',
    plural: 'Observações',
    color: 'var(--kind-note)',
    icon: StickyNote,
    titlePlaceholder: 'Ex.: Identidade visual',
    itemPlaceholder: 'Anotação…',
  },
};

export const KIND_ORDER: ScopeKind[] = ['page', 'feature', 'integration', 'note'];

/** Tipo sugerido para um bloco criado a partir de outro. */
export function childKindOf(parent: ScopeKind | 'client'): ScopeKind {
  if (parent === 'client') return 'page';
  if (parent === 'page') return 'feature';
  return parent;
}
