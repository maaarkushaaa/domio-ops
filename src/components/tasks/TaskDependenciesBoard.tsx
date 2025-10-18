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
  const { tasks: allTasks, createDependency, deleteDependency } = useTasks();
  const { toast } = useToast();
  const positionsRef = useRef(new Map<string, { x: number; y: number }>());

  const nodesSource = useMemo(() => {
    if (!allTasks.length) return [] as Task[];
    if (!tasks.length) return allTasks;
    const map = new Map<string, Task>();
    tasks.forEach((task) => map.set(task.id, task));
    allTasks.forEach((task) => {
      if (!map.has(task.id)) {
        map.set(task.id, task);
      }
    });
    return Array.from(map.values());
  }, [allTasks, tasks]);

  const buildNodes = useCallback((source: Task[]): Node[] => {
    const nextNodes: Node[] = [];
    source.forEach((task, index) => {
      const fallback = {
        x: (index % 5) * 240,
        y: Math.floor(index / 5) * 180,
      };
      const stored = positionsRef.current.get(task.id) || (task as any).position || fallback;
      positionsRef.current.set(task.id, stored);
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

  const initialNodes = useMemo(() => buildNodes(nodesSource), [nodesSource, buildNodes]);
  const initialEdges = useMemo(() => buildEdges(nodesSource), [nodesSource]);

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
      setEdges((eds) => addEdge({
        id: created.id,
        source,
        target,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' },
        style: { stroke: 'var(--primary)', strokeWidth: 2 },
        type: 'smoothstep',
      }, eds));
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
    if (!nodesSource.length) {
      return;
    }
    const nextNodes = buildNodes(nodesSource);
    const nextEdges = buildEdges(nodesSource);

    setNodes((prev) => {
      if (
        prev.length === nextNodes.length &&
        prev.every((node, index) => {
          const candidate = nextNodes[index];
          return (
            candidate &&
            node.id === candidate.id &&
            node.data?.label === candidate.data?.label &&
            node.position.x === candidate.position.x &&
            node.position.y === candidate.position.y
          );
        })
      ) {
        return prev;
      }
      return nextNodes;
    });

    setEdges((prev) => {
      if (
        prev.length === nextEdges.length &&
        prev.every((edge, index) => {
          const candidate = nextEdges[index];
          return candidate && edge.id === candidate.id && edge.source === candidate.source && edge.target === candidate.target;
        })
      ) {
        return prev;
      }
      return nextEdges;
    });
  }, [nodesSource, buildNodes, buildEdges, setNodes, setEdges]);

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
