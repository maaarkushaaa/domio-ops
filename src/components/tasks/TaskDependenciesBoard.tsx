import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  NodeProps,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Task } from '@/contexts/AppContext';
import { useTasks } from '@/hooks/use-tasks';
import { useToast } from '@/components/ui/use-toast';

type TaskNodeData = {
  task: Task;
  statusLabel: string;
  statusBadgeBg: string;
  statusBadgeColor: string;
};

interface TaskDependenciesBoardProps {
  tasks: Task[];
}

const TaskNode: React.FC<NodeProps<TaskNodeData>> = ({ data }) => {
  const assignee = data.task.assignee?.full_name || data.task.assignee?.email;

  return (
    <div className="flex min-w-[200px] max-w-[240px] flex-col gap-2 text-left">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium leading-snug text-foreground">{data.task.title}</span>
        <span
          className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: data.statusBadgeBg, color: data.statusBadgeColor }}
        >
          {data.statusLabel}
        </span>
      </div>
      {assignee ? (
        <span className="truncate text-xs font-medium text-muted-foreground">{assignee}</span>
      ) : null}
      <Handle type="target" position={Position.Top} className="bg-primary" />
      <Handle type="source" position={Position.Bottom} className="bg-primary" />
    </div>
  );
};

const nodeTypes = {
  task: TaskNode,
};

export function TaskDependenciesBoard({ tasks }: TaskDependenciesBoardProps) {
  const { tasks: allTasks, createDependency, deleteDependency } = useTasks();
  const { toast } = useToast();
  const positionsRef = useRef(new Map<string, { x: number; y: number }>());
  const positionsLoadedRef = useRef(false);
  const storageKey = 'task-dependency-positions';
  const [showOnlyLinked, setShowOnlyLinked] = useState(false);

  const loadStoredPositions = useCallback(() => {
    if (positionsLoadedRef.current) return false;
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        positionsLoadedRef.current = true;
        return false;
      }
      const parsed = JSON.parse(raw) as Record<string, { x: number; y: number }>;
      Object.entries(parsed).forEach(([taskId, position]) => {
        if (typeof position?.x === 'number' && typeof position?.y === 'number') {
          positionsRef.current.set(taskId, position);
        }
      });
      positionsLoadedRef.current = true;
      return positionsRef.current.size > 0;
    } catch (error) {
      positionsLoadedRef.current = true;
      console.warn('[TaskDependenciesBoard] Failed to load stored positions', error);
      return false;
    }
  }, [storageKey]);

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

  const statusStyles: Record<string, { label: string; badgeBg: string; badgeColor: string; border: string }> = {
    backlog: {
      label: 'Backlog',
      badgeBg: 'rgba(79, 70, 229, 0.12)',
      badgeColor: '#4f46e5',
      border: 'rgba(79, 70, 229, 0.35)',
    },
    todo: {
      label: 'Todo',
      badgeBg: 'rgba(14, 116, 144, 0.12)',
      badgeColor: '#0e7490',
      border: 'rgba(14, 116, 144, 0.35)',
    },
    in_progress: {
      label: 'In Progress',
      badgeBg: 'rgba(234, 179, 8, 0.16)',
      badgeColor: '#b45309',
      border: 'rgba(234, 179, 8, 0.35)',
    },
    review: {
      label: 'Review',
      badgeBg: 'rgba(219, 39, 119, 0.12)',
      badgeColor: '#be123c',
      border: 'rgba(219, 39, 119, 0.35)',
    },
    done: {
      label: 'Done',
      badgeBg: 'rgba(34, 197, 94, 0.12)',
      badgeColor: '#15803d',
      border: 'rgba(34, 197, 94, 0.35)',
    },
  };

  const buildNodes = useCallback((source: Task[]): Node<TaskNodeData>[] => {
    const nextNodes: Node[] = [];
    const seen = new Set<string>();
    source.forEach((task, index) => {
      const fallback = {
        x: (index % 5) * 240,
        y: Math.floor(index / 5) * 180,
      };
      const stored = positionsRef.current.get(task.id) || (task as any).position || fallback;
      positionsRef.current.set(task.id, stored);
      seen.add(task.id);
      const status = statusStyles[task.status] ?? statusStyles.backlog;
      nextNodes.push({
        id: task.id,
        type: 'task',
        data: {
          task,
          statusLabel: status.label,
          statusBadgeBg: status.badgeBg,
          statusBadgeColor: status.badgeColor,
        },
        position: stored,
        draggable: true,
        style: {
          padding: 16,
          borderRadius: 16,
          border: `1px solid ${status.border}`,
          background: 'var(--card)',
          boxShadow: '0 18px 45px -20px rgba(15, 23, 42, 0.45)',
          color: 'var(--foreground)',
          fontSize: 12,
          lineHeight: 1.4,
          width: 240,
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

  const buildEdges = useCallback((source: Task[]): Edge[] => {
    const edges: Edge[] = [];
    source.forEach((task) => {
      (task.dependencies_out || []).forEach((dep) => {
        edges.push({
          id: dep.id,
          source: task.id,
          target: dep.to_id,
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
          style: { stroke: '#6366f1', strokeWidth: 2 },
          type: 'smoothstep',
        } as Edge);
      });
    });
    return edges;
  }, []);

  const visibleTasks = useMemo(() => {
    if (!showOnlyLinked) return nodesSource;
    return nodesSource.filter((task) => (task.dependencies_in?.length ?? 0) > 0 || (task.dependencies_out?.length ?? 0) > 0);
  }, [nodesSource, showOnlyLinked]);

  const initialNodes = useMemo(() => buildNodes(visibleTasks), [visibleTasks, buildNodes]);
  const initialEdges = useMemo(() => buildEdges(visibleTasks), [visibleTasks, buildEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const persistPositions = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const entries = Array.from(positionsRef.current.entries()).reduce<Record<string, { x: number; y: number }>>(
        (acc, [taskId, position]) => {
          acc[taskId] = position;
          return acc;
        },
        {},
      );
      window.localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch (error) {
      console.warn('[TaskDependenciesBoard] Failed to persist positions', error);
    }
  }, [storageKey]);

  useEffect(() => {
    const hasLoaded = loadStoredPositions();
    if (hasLoaded && nodesSource.length) {
      setNodes(buildNodes(nodesSource));
    }
  }, [loadStoredPositions, nodesSource, buildNodes, setNodes]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === 'position' && change.position) {
        positionsRef.current.set(change.id, change.position);
      }
    });
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleNodeDragStop = useCallback((_: any, node: Node) => {
    if (!node?.id) return;
    positionsRef.current.set(node.id, node.position);
    persistPositions();
    setNodes((prev) =>
      prev.map((item) =>
        item.id === node.id
          ? {
              ...item,
              position: node.position,
            }
          : item,
      ),
    );
  }, [persistPositions, setNodes]);

  const handleConnect = useCallback(async (connection: Connection) => {
    const { source, target } = connection;
    if (!source || !target) return;

    const alreadyExists = nodesSource.some(
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
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        style: { stroke: '#6366f1', strokeWidth: 2 },
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
  }, [createDependency, setEdges, nodesSource, toast]);

  const handleEdgesDelete = useCallback(async (deleted: Edge[]) => {
    if (!deleted.length) return;
    const deletedIds = new Set<string>();
    for (const edge of deleted) {
      if (!edge?.id) continue;
      try {
        await deleteDependency(edge.id, {
          predecessorId: edge.source,
          successorId: edge.target,
        });
        toast({ title: 'Связь удалена', description: 'Зависимость удалена из задачи.' });
        deletedIds.add(edge.id);
      } catch (error: any) {
        toast({
          title: 'Ошибка при удалении зависимости',
          description: error?.message ?? 'Не удалось удалить зависимость.',
          variant: 'destructive',
        });
      }
    }
    if (deletedIds.size) {
      setEdges((eds) => eds.filter((edge) => !deletedIds.has(edge.id)));
    }
  }, [deleteDependency, setEdges, toast]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  useEffect(() => {
    if (!visibleTasks.length) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const nextNodes = buildNodes(visibleTasks);
    const nextEdges = buildEdges(visibleTasks);

    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [visibleTasks, buildNodes, buildEdges, setNodes, setEdges]);

  return (
    <div className="flex h-[70vh] flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {showOnlyLinked ? 'Показаны только связанные задачи' : 'Показаны все задачи'}
        </span>
        <button
          type="button"
          onClick={() => setShowOnlyLinked((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-medium transition hover:bg-accent"
        >
          {showOnlyLinked ? 'Показать все задачи' : 'Скрыть задачи без зависимостей'}
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onEdgesDelete={handleEdgesDelete}
        onConnect={handleConnect}
        onNodeDragStop={handleNodeDragStop}
        onEdgeDoubleClick={(_, edge) => {
          if (!edge) return;
          void handleEdgesDelete([{ id: edge.id, source: edge.source, target: edge.target } as Edge]);
        }}
        fitView
        panOnScroll={false}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
      >
        <MiniMap pannable zoomable />
        <Controls showInteractive={false} position="bottom-left" />
        <Background gap={24} color="var(--muted-foreground)" />
      </ReactFlow>
    </div>
  );
}
