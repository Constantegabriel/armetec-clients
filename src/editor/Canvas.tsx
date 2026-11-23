import { useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type EdgeTypes,
  type FinalConnectionState,
  type NodeTypes,
} from '@xyflow/react';
import { childKindOf } from '@/lib/kinds';
import type { AppEdge, AppNode } from '@/lib/types';
import { DeletableEdge } from './DeletableEdge';
import { ClientNode } from './nodes/ClientNode';
import { ScopeNode } from './nodes/ScopeNode';
import { useEditor } from './store';

const nodeTypes: NodeTypes = { client: ClientNode, scope: ScopeNode };
const edgeTypes: EdgeTypes = { default: DeletableEdge };

const BLOCK_WIDTH = 290;
const PORT_OFFSET_Y = 28;

function clientPoint(e: MouseEvent | TouchEvent) {
  return 'changedTouches' in e ? e.changedTouches[0] : e;
}

export function Canvas() {
  const nodes = useEditor((s) => s.nodes);
  const edges = useEditor((s) => s.edges);
  const viewport = useEditor((s) => s.viewport);
  const { onNodesChange, onEdgesChange, onConnect, addNode, setViewport } = useEditor.getState();
  const { screenToFlowPosition } = useReactFlow();

  /** Soltar uma ligação no vazio cria um bloco já ligado; soltar em cima de um bloco liga a ele. */
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      if (state.isValid || !state.fromNode) return;
      const from = useEditor.getState().nodes.find((n) => n.id === state.fromNode?.id);
      if (!from) return;
      const { clientX, clientY } = clientPoint(event);
      const target = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('.react-flow__node');
      const targetId = target?.dataset.id;

      if (targetId) {
        if (targetId !== from.id && targetId !== 'client') onConnect({ source: from.id, target: targetId, sourceHandle: null, targetHandle: null });
        return;
      }
      const pos = screenToFlowPosition({ x: clientX, y: clientY });
      const kind = childKindOf(from.type === 'client' ? 'client' : from.data.kind);
      addNode({ x: pos.x, y: pos.y - PORT_OFFSET_Y }, kind, from.id);
    },
    [screenToFlowPosition, onConnect, addNode],
  );

  const onDoubleClick = useCallback(
    (e: ReactMouseEvent) => {
      if (!(e.target as HTMLElement).classList.contains('react-flow__pane')) return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode({ x: pos.x - BLOCK_WIDTH / 2, y: pos.y - 30 });
    },
    [screenToFlowPosition, addNode],
  );

  return (
    <div className="canvas" onDoubleClick={onDoubleClick}>
      <ReactFlow<AppNode, AppEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onMoveEnd={(_, vp) => setViewport(vp)}
        defaultViewport={viewport}
        fitView={!viewport}
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        zoomOnDoubleClick={false}
        deleteKeyCode={['Delete']}
        selectionOnDrag={false}
        panOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="var(--grid)" />
        <Controls showInteractive={false} position="bottom-right" />
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          nodeColor={(n) => (n.type === 'client' ? 'var(--kind-client)' : 'var(--minimap-node)')}
          maskColor="var(--minimap-mask)"
        />
      </ReactFlow>
    </div>
  );
}
