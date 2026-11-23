import { Check, CloudOff, HardDrive, Loader2, TriangleAlert } from 'lucide-react';
import { isCloud } from '@/lib/supabase';
import type { SaveStatus } from './useAutosave';

const LABELS: Record<SaveStatus, string> = {
  saved: isCloud ? 'Salvo na nuvem' : 'Salvo neste navegador',
  pending: 'Alterações não salvas…',
  saving: 'Salvando…',
  offline: 'Sem internet · guardado no notebook',
  error: 'Erro ao salvar · tentando de novo',
};

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const icon =
    status === 'saving' || status === 'pending' ? (
      <Loader2 size={14} className="spin" />
    ) : status === 'offline' ? (
      <CloudOff size={14} />
    ) : status === 'error' ? (
      <TriangleAlert size={14} />
    ) : isCloud ? (
      <Check size={14} />
    ) : (
      <HardDrive size={14} />
    );
  return (
    <span className={`save-indicator is-${status}`} title={LABELS[status]}>
      {icon}
      <span className="save-label">{LABELS[status]}</span>
    </span>
  );
}
