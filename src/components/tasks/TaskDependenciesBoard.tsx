import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { TaskChecklists } from '@/components/tasks/TaskChecklists';
import { TaskComments } from '@/components/tasks/TaskComments';
import { TaskDependencyManager } from '@/components/tasks/TaskDependencyManager';

type TaskNodeData = {
  task: Task;
  statusLabel: string;
  statusBadgeBg: string;
  statusBadgeColor: string;
  cardBg: string;
  textColor: string;
  onHide?: (taskId: string) => void;
};

interface TaskDependenciesBoardProps {
  tasks: Task[];
}

const TaskPreview: React.FC<{
  task: Task;
  anchor: DOMRect;
  onClose: () => void;
}> = ({ task, anchor, onClose }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const { innerWidth, innerHeight } = window;
      const width = 420;
      const height = Math.min(innerHeight * 0.8, 640);
      let left = anchor.right + 16;
      let top = anchor.top;

      if (left + width > innerWidth - 16) {
        left = Math.max(16, anchor.left - width - 16);
      }
      if (top + height > innerHeight - 16) {
        top = Math.max(16, innerHeight - height - 16);
      }

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchor]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      <div
        ref={containerRef}
        className="pointer-events-auto w-[90vw] max-w-[420px] max-h-[80vh] overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-2xl"
        style={{ top: position.top, left: position.left, position: 'absolute' }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between bg-popover px-4 pt-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Задача</div>
            <div className="text-base font-semibold leading-tight text-foreground">{task.title}</div>
            <div className="text-xs text-muted-foreground">
              {task.project?.name || 'Без проекта'}
            </div>
          </div>
          <button
            type="button"
            aria-label="Закрыть предпросмотр"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground transition hover:bg-muted/80"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="space-y-6 px-4 pb-6">
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div><span className="font-semibold text-foreground">Статус:</span> <span className="uppercase">{task.status}</span></div>
            <div><span className="font-semibold text-foreground">Приоритет:</span> {task.priority || '—'}</div>
            <div><span className="font-semibold text-foreground">Ответственный:</span> {task.assignee?.full_name || task.assignee?.email || 'Не назначен'}</div>
            <div><span className="font-semibold text-foreground">Период:</span>{' '}
              {task.due_date
                ? `${new Date(task.due_date).toLocaleDateString('ru-RU')}${(task as any).due_end && (task as any).due_end !== task.due_date ? ` — ${new Date((task as any).due_end).toLocaleDateString('ru-RU')}` : ''}`
                : '—'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Описание</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {task.description || 'Описание отсутствует.'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Чек-листы</div>
            <TaskChecklists taskId={task.id} />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Комментарии</div>
            <TaskComments taskId={task.id} />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Зависимости</div>
            <TaskDependencyManager task={task} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const TaskNode: React.FC<NodeProps<TaskNodeData>> = ({ data }) => {
  const [previewAnchor, setPreviewAnchor] = useState<DOMRect | null>(null);
  const assignee = data.task.assignee?.full_name || data.task.assignee?.email;

  return (
    <div className="relative flex min-w-[200px] max-w-[240px] flex-col gap-2 text-left">
      {data.onHide ? (
        <button
          type="button"
          aria-label="Скрыть задачу"
          className="absolute right-0 top-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-[11px] font-semibold text-muted-foreground transition hover:bg-black/10"
          onClick={(event) => {
            event.stopPropagation();
            data.onHide?.(data.task.id);
          }}
        >
          ×
        </button>
      ) : null}
      <div className="flex items-start justify-between gap-3 pr-5">
        <button
          type="button"
          className="flex-1 text-left text-sm font-medium leading-snug text-foreground hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
            setPreviewAnchor(rect);
          }}
        >
          {data.task.title}
        </button>
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
      {previewAnchor ? (
        <TaskPreview
          task={data.task}
          anchor={previewAnchor}
          onClose={() => setPreviewAnchor(null)}
        />
      ) : null}
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
  const hiddenStorageKey = 'task-dependency-hidden';
  const [showOnlyLinked, setShowOnlyLinked] = useState(false);
  const [hiddenTaskIds, setHiddenTaskIds] = useState<string[]>([]);
  const [isHiddenListOpen, setIsHiddenListOpen] = useState(false);

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

  const statusStyles = useMemo(
    () =>
      ({
        backlog: {
          label: 'Бэклог',
          badgeBg: 'rgba(107, 114, 128, 0.18)',
          badgeColor: '#374151',
          border: 'rgba(107, 114, 128, 0.4)',
          cardBg: 'linear-gradient(135deg, rgba(229, 231, 235, 0.95), rgba(209, 213, 219, 0.85))',
          textColor: '#1f2937',
        },
        todo: {
          label: 'К выполнению',
          badgeBg: 'rgba(59, 130, 246, 0.18)',
          badgeColor: '#1d4ed8',
          border: 'rgba(59, 130, 246, 0.45)',
          cardBg: 'linear-gradient(135deg, rgba(191, 219, 254, 0.95), rgba(147, 197, 253, 0.9))',
          textColor: '#1e3a8a',
        },
        in_progress: {
          label: 'В работе',
          badgeBg: 'rgba(234, 179, 8, 0.2)',
          badgeColor: '#b45309',
          border: 'rgba(234, 179, 8, 0.45)',
          cardBg: 'linear-gradient(135deg, rgba(254, 240, 138, 0.95), rgba(253, 224, 71, 0.88))',
          textColor: '#92400e',
        },
        review: {
          label: 'На ревью',
          badgeBg: 'rgba(217, 70, 239, 0.18)',
          badgeColor: '#a21caf',
          border: 'rgba(217, 70, 239, 0.45)',
          cardBg: 'linear-gradient(135deg, rgba(244, 214, 255, 0.95), rgba(232, 121, 249, 0.88))',
          textColor: '#86198f',
        },
        done: {
          label: 'Готово',
          badgeBg: 'rgba(34, 197, 94, 0.2)',
          badgeColor: '#047857',
          border: 'rgba(34, 197, 94, 0.45)',
          cardBg: 'linear-gradient(135deg, rgba(187, 247, 208, 0.95), rgba(134, 239, 172, 0.88))',
          textColor: '#065f46',
        },
      } as Record<string, { label: string; badgeBg: string; badgeColor: string; border: string; cardBg: string; textColor: string }>),
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(hiddenStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setHiddenTaskIds(parsed.filter((item): item is string => typeof item === 'string'));
      }
    } catch (error) {
      console.warn('[TaskDependenciesBoard] Failed to load hidden tasks', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(hiddenStorageKey, JSON.stringify(hiddenTaskIds));
    } catch (error) {
      console.warn('[TaskDependenciesBoard] Failed to persist hidden tasks', error);
    }
  }, [hiddenTaskIds, hiddenStorageKey]);

  const hiddenIdsSet = useMemo(() => new Set(hiddenTaskIds), [hiddenTaskIds]);

  const hideTask = useCallback((taskId: string) => {
    const task = nodesSource.find((item) => item.id === taskId);
    const hasDeps = (task?.dependencies_in?.length ?? 0) > 0 || (task?.dependencies_out?.length ?? 0) > 0;
    if (hasDeps) {
      toast({
        title: 'Нельзя скрыть задачу',
        description: 'Сначала удалите зависимости этой задачи.',
        variant: 'destructive',
      });
      return;
    }
    setHiddenTaskIds((prev) => (prev.includes(taskId) ? prev : [...prev, taskId]));
  }, [nodesSource, toast]);

  const unhideTask = useCallback((taskId: string) => {
    setHiddenTaskIds((prev) => prev.filter((id) => id !== taskId));
  }, []);

  const nodesSourceIds = useMemo(() => new Set(nodesSource.map((task) => task.id)), [nodesSource]);

  const taskById = useMemo(() => {
    const map = new Map<string, Task>();
    nodesSource.forEach((task) => {
      map.set(task.id, task);
    });
    return map;
  }, [nodesSource]);

  const buildNodes = useCallback((source: Task[]): Node<TaskNodeData>[] => {
    const nextNodes: Node<TaskNodeData>[] = [];
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
          cardBg: status.cardBg,
          textColor: status.textColor,
          onHide: hideTask,
        },
        position: stored,
        draggable: true,
        style: {
          padding: 16,
          borderRadius: 16,
          border: `1px solid ${status.border}`,
          background: status.cardBg,
          boxShadow: '0 18px 45px -20px rgba(15, 23, 42, 0.45)',
          color: status.textColor,
          fontSize: 12,
          lineHeight: 1.4,
          width: 240,
        },
      });
    });

    positionsRef.current.forEach((_, key) => {
      if (!nodesSourceIds.has(key)) {
        positionsRef.current.delete(key);
      }
    });

    return nextNodes;
  }, [hideTask, nodesSourceIds, statusStyles]);

  const buildEdges = useCallback((source: Task[]): Edge[] => {
    const edges: Edge[] = [];
    source.forEach((task) => {
      (task.dependencies_out || []).forEach((dep) => {
        const targetTask = taskById.get(dep.to_id);
        const completedChain = task.status === 'done' && targetTask?.status === 'done';
        const strokeColor = completedChain ? '#d4af37' : '#6366f1';
        const strokeWidth = completedChain ? 3.5 : 2;
        edges.push({
          id: dep.id,
          source: task.id,
          target: dep.to_id,
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
          style: { stroke: strokeColor, strokeWidth },
          type: 'smoothstep',
        } as Edge);
      });
    });
    return edges;
  }, [taskById]);

  const visibleTasks = useMemo(() => {
    const base = showOnlyLinked
      ? nodesSource.filter((task) => (task.dependencies_in?.length ?? 0) > 0 || (task.dependencies_out?.length ?? 0) > 0)
      : nodesSource;
    return base.filter((task) => !hiddenIdsSet.has(task.id));
  }, [nodesSource, showOnlyLinked, hiddenIdsSet]);

  const hiddenTasks = useMemo(() => nodesSource.filter((task) => hiddenIdsSet.has(task.id)), [nodesSource, hiddenIdsSet]);

  useEffect(() => {
    positionsRef.current.forEach((position, taskId) => {
      if (!nodesSourceIds.has(taskId)) {
        positionsRef.current.delete(taskId);
      }
    });
  }, [nodesSourceIds]);

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOnlyLinked((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-medium transition hover:bg-accent"
          >
            {showOnlyLinked ? 'Показать все задачи' : 'Скрыть задачи без зависимостей'}
          </button>
          <button
            type="button"
            onClick={() => setIsHiddenListOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-medium transition hover:bg-accent"
          >
            Скрытые задачи ({hiddenTasks.length})
          </button>
        </div>
      </div>
      {isHiddenListOpen ? (
        <div className="z-20 max-h-60 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
            <span>Скрытые задачи</span>
            <button
              type="button"
              className="h-6 w-6 rounded-full bg-black/5 text-[11px] font-semibold text-muted-foreground transition hover:bg-black/10"
              onClick={() => setIsHiddenListOpen(false)}
              aria-label="Закрыть список скрытых задач"
            >
              ×
            </button>
          </div>
          <div className="divide-y text-sm">
            {hiddenTasks.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">Нет скрытых задач</div>
            ) : (
              hiddenTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate text-xs font-medium">{task.title}</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold text-primary transition hover:bg-primary/10"
                    onClick={() => unhideTask(task.id)}
                  >
                    Показать
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
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
        minZoom={0.05}
      >
        <MiniMap pannable zoomable />
        <Controls showInteractive={false} position="bottom-left" />
        <Background gap={24} color="var(--muted-foreground)" />
      </ReactFlow>
    </div>
  );
}
