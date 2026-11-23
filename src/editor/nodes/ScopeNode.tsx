import { memo, type CSSProperties, type KeyboardEvent } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { KIND_ORDER, KINDS } from '@/lib/kinds';
import type { ScopeKind, ScopeNode as ScopeNodeType } from '@/lib/types';
import { useEditor } from '../store';
import { ItemList } from './ItemList';
import { useFocusTitle } from './useFocusTitle';

function ScopeNodeView({ id, data, selected }: NodeProps<ScopeNodeType>) {
  const { updateScope, addItem, addChild, duplicateNode, deleteNode } = useEditor.getState();
  const titleRef = useFocusTitle<HTMLInputElement>(id);
  const meta = KINDS[data.kind];
  const Icon = meta.icon;

  const onTitleKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      useEditor.setState({ focus: { nodeId: id, target: data.items[0]?.id ?? '' } });
    }
  };

  const onDelete = () => {
    const hasContent = data.title.trim() || data.items.some((i) => i.text.trim());
    if (hasContent && !window.confirm(`Excluir o bloco “${data.title || 'sem título'}”?`)) return;
    deleteNode(id);
  };

  return (
    <div className={`block${selected ? ' is-selected' : ''}`} style={{ '--c': meta.color } as CSSProperties}>
      <Handle type="target" position={Position.Left} className="port" />
      <div className="block-head">
        <label className="block-kind kind-select nodrag" title="Tipo do bloco">
          <Icon size={14} />
          <select value={data.kind} onChange={(e) => updateScope(id, { kind: e.target.value as ScopeKind })}>
            {KIND_ORDER.map((k) => (
              <option key={k} value={k}>
                {KINDS[k].label}
              </option>
            ))}
          </select>
        </label>
        <span className="grow" />
        <button type="button" className="icon-btn nodrag" title="Duplicar bloco" onClick={() => duplicateNode(id)}>
          <Copy size={14} />
        </button>
        <button type="button" className="icon-btn danger nodrag" title="Excluir bloco" onClick={onDelete}>
          <Trash2 size={14} />
        </button>
      </div>
      <input
        ref={titleRef}
        className="block-title nodrag"
        value={data.title}
        placeholder={meta.titlePlaceholder}
        onChange={(e) => updateScope(id, { title: e.target.value })}
        onKeyDown={onTitleKey}
      />
      <ItemList nodeId={id} items={data.items} placeholder={meta.itemPlaceholder} />
      <div className="block-foot">
        <button type="button" className="nodrag" onClick={() => addItem(id)}>
          <Plus size={14} /> item
        </button>
        <button type="button" className="nodrag" onClick={() => addChild(id)}>
          <Plus size={14} /> bloco ligado
        </button>
      </div>
      <Handle type="source" position={Position.Right} className="port" title="Arraste para ligar a outro bloco" />
    </div>
  );
}

export const ScopeNode = memo(ScopeNodeView);
