import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import type { ScopeItem } from '@/lib/types';
import { useEditor } from '../store';
import { focusWhenReady } from './focusWhenReady';

interface Props {
  nodeId: string;
  items: ScopeItem[];
  placeholder: string;
}

export function ItemList({ nodeId, items, placeholder }: Props) {
  return (
    <ul className="item-list">
      {items.map((item) => (
        <ItemRow key={item.id} nodeId={nodeId} item={item} placeholder={placeholder} canRemove={items.length > 1} />
      ))}
    </ul>
  );
}

function ItemRow({
  nodeId,
  item,
  placeholder,
  canRemove,
}: {
  nodeId: string;
  item: ScopeItem;
  placeholder: string;
  canRemove: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { addItem, updateItem, removeItem } = useEditor.getState();
  const shouldFocus = useEditor((s) => s.focus?.nodeId === nodeId && s.focus.target === item.id);

  // Altura automática conforme o texto.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [item.text]);

  useEffect(() => {
    if (!shouldFocus || !ref.current) return;
    focusWhenReady(ref.current, () => useEditor.getState().clearFocus());
  }, [shouldFocus]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      addItem(nodeId, item.id);
    } else if (e.key === 'Backspace' && item.text === '' && canRemove) {
      e.preventDefault();
      removeItem(nodeId, item.id, { focusPrevious: true });
    }
  }

  return (
    <li className={item.done ? 'done' : undefined}>
      <button
        type="button"
        className="bullet nodrag"
        title={item.done ? 'Desmarcar' : 'Marcar como combinado'}
        onClick={() => updateItem(nodeId, item.id, { done: !item.done })}
      />
      <textarea
        ref={ref}
        rows={1}
        className="nodrag"
        value={item.text}
        placeholder={placeholder}
        onChange={(e) => updateItem(nodeId, item.id, { text: e.target.value })}
        onKeyDown={onKeyDown}
      />
      {canRemove && (
        <button type="button" className="icon-btn item-remove nodrag" title="Remover item" onClick={() => removeItem(nodeId, item.id)}>
          <X size={14} />
        </button>
      )}
    </li>
  );
}
