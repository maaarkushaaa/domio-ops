import { useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  MarkerType,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Task } from '@/contexts/AppContext';

interface TaskDependenciesBoardProps {
  tasks: Task[];
}

export function TaskDependenciesBoard({ tasks }: TaskDependenciesBoardProps) {
  const buildNodes = (source: Task[]): Node[] => {
    return source.map((task, index) => ({
      id: task.id,
      data: {
        label: `${task.title}${task.status ? `\n(${task.status})` : ''}`,
      },
      position: {
        x: (index % 5) * 220,
        y: Math.floor(index / 5) * 160,
      },
      style: {
        padding: 12,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        color: 'var(--foreground)',
        fontSize: 12,
        lineHeight: 1.25,
        whiteSpace: 'pre-line',
      },
    }));
  };

  const buildEdges = (source: Task[]): Edge[] => {
    const edges: Edge[] = [];
    source.forEach((task) => {
      (task.dependencies_out || []).forEach((dep) => {
        edges.push({
          id: dep.id,
          source: task.id,
          target: dep.to_id,
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'var(--primary)',
          },
          style: {
            stroke: 'var(--primary)',
            strokeWidth: 2,
          },
        } as Edge);
      });
    });
    return edges;
  };

  const initialNodes = useMemo(() => buildNodes(tasks), [tasks]);
  const initialEdges = useMemo(() => buildEdges(tasks), [tasks]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(buildNodes(tasks));
    setEdges(buildEdges(tasks));
  }, [tasks, setNodes, setEdges]);

  return (
    <div className="h-[70vh] rounded-lg border bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap pannable zoomable />
        <Controls showInteractive={false} />
        <Background gap={24} color="var(--muted-foreground)" />
      </ReactFlow>
    </div>
  );
}
