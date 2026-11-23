import { memo, type CSSProperties, useRef, type KeyboardEvent } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2, Plus } from 'lucide-react';
import type { ClientNode as ClientNodeType } from '@/lib/types';
import { useEditor } from '../store';
import { ItemList } from './ItemList';
import { useFocusTitle } from './useFocusTitle';

function ClientNodeView({ id, data, selected }: NodeProps<ClientNodeType>) {
  const { updateClient, addItem, addChild } = useEditor.getState();
  const companyRef = useFocusTitle<HTMLInputElement>(id);
  const nicheRef = useRef<HTMLInputElement>(null);

  const onCompanyKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nicheRef.current?.focus();
    }
  };
  const onNicheKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      useEditor.setState({ focus: { nodeId: id, target: data.items[0]?.id ?? '' } });
    }
  };

  return (
    <div className={`block block-client${selected ? ' is-selected' : ''}`} style={{ '--c': 'var(--kind-client)' } as CSSProperties}>
      <div className="block-head">
        <span className="block-kind">
          <Building2 size={14} /> Cliente
        </span>
      </div>
      <input
        ref={companyRef}
        className="block-title nodrag"
        value={data.company}
        placeholder="Nome da empresa"
        onChange={(e) => updateClient({ company: e.target.value })}
        onKeyDown={onCompanyKey}
      />
      <input
        ref={nicheRef}
        className="block-subtitle nodrag"
        value={data.niche}
        placeholder="Nicho (ex.: clínica odontológica)"
        onChange={(e) => updateClient({ niche: e.target.value })}
        onKeyDown={onNicheKey}
      />
      <ItemList nodeId={id} items={data.items} placeholder="Observação: prazo, valor, contato…" />
      <div className="block-foot">
        <button type="button" className="nodrag" onClick={() => addItem(id)}>
          <Plus size={14} /> item
        </button>
        <button type="button" className="nodrag" onClick={() => addChild(id)}>
          <Plus size={14} /> página ligada
        </button>
      </div>
      <Handle type="source" position={Position.Right} className="port" title="Arraste para ligar a outro bloco" />
    </div>
  );
}

export const ClientNode = memo(ClientNodeView);
