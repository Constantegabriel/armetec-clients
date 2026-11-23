import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { X } from 'lucide-react';
import { useEditor } from './store';

/** Ligação com um botão de remover que aparece quando ela está selecionada. */
export function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected }: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });

  return (
    <>
      <BaseEdge id={id} path={path} className={selected ? 'edge-selected' : undefined} interactionWidth={24} />
      {selected && (
        <EdgeLabelRenderer>
          <button
            className="edge-remove nodrag nopan"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            title="Remover ligação"
            onClick={() => useEditor.getState().onEdgesChange([{ type: 'remove', id }])}
          >
            <X size={14} />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
