import { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  MarkerType,
  Edge,
  Node,
  Connection,
  addEdge,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Task } from '@/contexts/AppContext';
import { useTasks } from '@/hooks/use-tasks';
import { useToast } from '@/components/ui/use-toast';

interface TaskDependenciesBoardProps {
  tasks: Task[];
}

export function TaskDependenciesBoard({ tasks }: TaskDependenciesBoardProps) {
  const { createDependency, deleteDependency } = useTasks();
  const { toast } = useToast();
  const positionsRef = useRef(new Map<string, { x: number; y: number }>());

  const buildNodes = useCallback((source: Task[]): Node[] => {
    const nextNodes: Node[] = [];
    const seen = new Set<string>();

    source.forEach((task, index) => {
      const fallbackPosition = {
        x: (index % 5) * 240,
        y: Math.floor(index / 5) * 180,
      };
      const stored = positionsRef.current.get(task.id) ?? fallbackPosition;
      positionsRef.current.set(task.id, stored);
      seen.add(task.id);

      nextNodes.push({
        id: task.id,
        data: {
          label: `${task.title}${task.status ? `\n(${task.status})` : ''}`,
        },
        position: stored,
        draggable: true,
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
      });
    });

    positionsRef.current.forEach((_, key) => {
      if (!seen.has(key)) {
        positionsRef.current.delete(key);
      }
    });

    return nextNodes;
  }, []);

  const buildEdges = (source: Task[]): Edge[] => {
    const edges: Edge[] = [];
    source.forEach((task) => {
      (task.dependencies_out || []).forEach((dep) => {
        edges.push({
          id: dep.id,
          source: task.id,
          target: dep.to_id,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' },
          style: { stroke: 'var(--primary)', strokeWidth: 2 },
          type: 'smoothstep',
        } as Edge);
      });
    });
    return edges;
  };

  const initialNodes = useMemo(() => buildNodes(tasks), [tasks, buildNodes]);
  const initialEdges = useMemo(() => buildEdges(tasks), [tasks]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === 'position' && change.position) {
        positionsRef.current.set(change.id, change.position);
      }
    });
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleConnect = useCallback(async (connection: Connection) => {
    const { source, target } = connection;
    if (!source || !target) return;

    const alreadyExists = tasks.some(
      (task) =>
        task.id === source &&
        (task.dependencies_out || []).some((dep) => dep.to_id === target),
    );

    if (alreadyExists) {
      toast({
        title: 'Связь уже существует',
        description: 'Эти задачи уже связаны зависимостью.',
      });
      return;
    }

    try {
      const created = await createDependency(source, target);
      setEdges((eds) => [...eds, {
        id: created.id,
        source,
        target,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' },
        style: { stroke: 'var(--primary)', strokeWidth: 2 },
        type: 'smoothstep',
      }]);
      toast({ title: 'Связь создана', description: 'Новая зависимость сохранена.' });
    } catch (error: any) {
      toast({
        title: 'Ошибка при создании зависимости',
        description: error?.message ?? 'Не удалось создать зависимость.',
        variant: 'destructive',
      });
    }
  }, [createDependency, setEdges, tasks, toast]);

  const handleEdgesDelete = useCallback(async (deleted: Edge[]) => {
    if (!deleted.length) return;
    setEdges((eds) => eds.filter((edge) => !deleted.some((item) => item.id === edge.id)));

    for (const edge of deleted) {
      if (!edge?.id) continue;
      try {
        await deleteDependency(edge.id, {
          predecessorId: edge.source,
          successorId: edge.target,
        });
        toast({ title: 'Связь удалена', description: 'Зависимость удалена из задачи.' });
      } catch (error: any) {
        toast({
          title: 'Ошибка при удалении зависимости',
          description: error?.message ?? 'Не удалось удалить зависимость.',
          variant: 'destructive',
        });
      }
    }
  }, [deleteDependency, setEdges, toast]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  useEffect(() => {
    setNodes(buildNodes(tasks));
    setEdges((current) => {
      const incoming = buildEdges(tasks);
      if (current.length === incoming.length && current.every((edge, idx) => edge.id === incoming[idx].id)) {
        return current;
      }
      return incoming;
    });
  }, [tasks, buildNodes, setNodes, buildEdges]);

  return (
    <div className="h-[70vh] rounded-lg border bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onEdgesDelete={handleEdgesDelete}
        onConnect={handleConnect}
        onEdgeDoubleClick={(_, edge) => {
          void handleEdgesDelete([edge]);
        }}
        fitView
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        panOnScroll
        zoomOnScroll
      >
        <MiniMap pannable zoomable />
        <Controls showInteractive={false} />
        <Background gap={24} color="var(--muted-foreground)" />
      </ReactFlow>
    </div>
  );
}
