import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MoreVertical, User, Calendar, MessageCircle, AlertTriangle, GripVertical } from 'lucide-react';
import { useTasks, TaskStatus } from '@/hooks/use-tasks';
import { Task } from '@/contexts/AppContext';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { TaskActionsMenu } from '@/components/tasks/TaskActionsMenu';
import { TaskDetailsDialog } from '@/components/tasks/TaskDetailsDialog';
import { supabase } from '@/integrations/supabase/client';

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'backlog', title: 'Бэклог', color: 'bg-muted' },
  { id: 'todo', title: 'К выполнению', color: 'bg-primary/10' },
  { id: 'in_progress', title: 'В работе', color: 'bg-warning/10' },
  { id: 'review', title: 'На ревью', color: 'bg-accent/10' },
  { id: 'done', title: 'Готово', color: 'bg-success/10' },
];

export function KanbanBoard({ filteredTasks }: { filteredTasks?: Task[] }) {
  const { tasks, updateTask } = useTasks();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [openFor, setOpenFor] = useState<TaskStatus | null>(null);
  const [wipLimits, setWipLimits] = useState<Record<TaskStatus, number>>({} as any);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentTouchPos, setCurrentTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const draggedElementRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollIntervalRef = useRef<number | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const touchPosRef = useRef<{ x: number; y: number } | null>(null); // Синхронный доступ к позиции
  const scrollElRef = useRef<HTMLElement | null>(null);

  // Находим горизонтально скроллируемый контейнер под текущей точкой касания
  const findScrollableAtPoint = (x: number, y: number): HTMLElement | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    return findHorizontalScrollable(el);
  };

  const findHorizontalScrollable = (start: HTMLElement | null): HTMLElement | null => {
    let el: HTMLElement | null = start;
    while (el) {
      const style = window.getComputedStyle(el);
      const overflowX = style.overflowX;
      const canScroll = (overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth;
      if (canScroll) return el;
      el = el.parentElement as HTMLElement | null;
    }
    return null;
  };
  
  const displayTasks = filteredTasks || tasks;

  useEffect(() => {
    const loadWip = async () => {
      const { data } = await (supabase as any)
        .from('kanban_wip_limits')
        .select('status, limit_value');
      if (data) {
        const map: any = {};
        data.forEach((row: any) => (map[row.status] = row.limit_value));
        setWipLimits(map);
      }
    };
    loadWip();
  }, []);

  const tasksByColumn = displayTasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Автопрокрутка при приближении к краю (версия на requestAnimationFrame)
  const startAutoScroll = () => {
    // Запускаем только если ещё не запущен
    if (autoScrollRafRef.current !== null) return;
    if (!containerRef.current) return;
    if (!scrollElRef.current && touchPosRef.current) {
      // Сначала пробуем точечный поиск по координатам пальца
      scrollElRef.current = findScrollableAtPoint(touchPosRef.current.x, touchPosRef.current.y) ||
        findHorizontalScrollable(containerRef.current);
    }
    const target = scrollElRef.current || containerRef.current;

    const scrollThreshold = 140; // Чуть шире зона у края
    const maxSpeed = 28; // Быстрее для больших досок
    const minSpeed = 6;  // Минимальная скорость px/frame

    const loop = () => {
      if (!target || !touchPosRef.current) {
        stopAutoScroll();
        return;
      }

      const container = target;
      const pos = touchPosRef.current;
      // Каждый кадр проверяем актуальный контейнер под пальцем (если поменялся слой)
      const dynamicTarget = findScrollableAtPoint(pos.x, pos.y) || container;
      if (dynamicTarget !== container) {
        scrollElRef.current = dynamicTarget;
      }
      const rect = (scrollElRef.current || container).getBoundingClientRect();

      // Параметры плавающей карточки (должны соответствовать preview)
      const cardWidth = 300;
      const cardLeft = pos.x - 150;
      const cardRight = pos.x - 150 + cardWidth;

      // Дистанция от краёв карточки до видимой области контейнера
      const distLeft = cardLeft - rect.left;
      const distRight = rect.right - cardRight;

      const scroller = scrollElRef.current || container;
      const canLeft = scroller.scrollLeft > 0;
      const canRight = scroller.scrollLeft < (scroller.scrollWidth - scroller.clientWidth);

      // Функция перевода дистанции в скорость (чем ближе к краю, тем быстрее)
      const speedFromDistance = (d: number) => {
        const clamped = Math.max(0, Math.min(scrollThreshold, scrollThreshold - d));
        const ratio = clamped / scrollThreshold; // 0..1
        return minSpeed + (maxSpeed - minSpeed) * ratio;
      };

      if (distLeft < scrollThreshold && canLeft) {
        const v = speedFromDistance(distLeft);
        scroller.scrollLeft -= v;
      } else if (distRight < scrollThreshold && canRight) {
        const v = speedFromDistance(distRight);
        scroller.scrollLeft += v;
      }

      autoScrollRafRef.current = window.requestAnimationFrame(loop);
    };

    autoScrollRafRef.current = window.requestAnimationFrame(loop);
  };

  const stopAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    if (autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  };

  const handleDrop = async (columnId: TaskStatus) => {
    if (draggedTask && draggedTask.status !== columnId) {
      try {
        const colTasks = tasksByColumn[columnId] || [];
        const newOrder = colTasks.length > 0 ? Math.max(...colTasks.map((t: any) => t.order || 0)) + 1 : 0;
        console.log('[KANBAN-DROP] Dropping task', draggedTask.id, 'from', draggedTask.status, 'to', columnId, 'order', newOrder);
        console.log('[KANBAN-DROP] Current task data:', draggedTask);
        await updateTask({
          id: draggedTask.id,
          status: columnId,
          order: newOrder,
        });
        console.log('[KANBAN-DROP] Drop completed successfully');
      } catch (e) {
        console.error('[KANBAN-DROP] Drop task error', e);
        alert('Ошибка при перемещении задачи: ' + (e as any)?.message);
      }
    } else if (draggedTask) {
      console.log('[KANBAN-DROP] Task already in column', columnId, 'skipping');
    } else {
      console.log('[KANBAN-DROP] No dragged task');
    }
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return priority;
    }
  };

  return (
    <>
      {/* Floating drag preview */}
      {isDragging && draggedTask && currentTouchPos && (
        <div
          className="fixed pointer-events-none z-50 opacity-80"
          style={{
            left: currentTouchPos.x - 150,
            top: currentTouchPos.y - 40,
            width: '300px',
            transform: 'scale(1.05)',
          }}
        >
          <Card className="bg-card shadow-2xl border-primary">
            <CardContent className="p-3">
              <h4 className="text-sm font-medium">{draggedTask.title}</h4>
              <Badge variant="outline" className="text-xs mt-2">
                {draggedTask.project?.name || 'Без проекта'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div ref={containerRef} className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'auto' }}>
        {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80"
          data-column-id={column.id}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.id)}
        >
          <Card className={`${column.color} h-full`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {column.title}
                  <Badge variant="secondary" className="text-xs">
                    {tasksByColumn[column.id]?.length || 0}
                  </Badge>
                  {wipLimits[column.id] && (tasksByColumn[column.id]?.length || 0) > wipLimits[column.id] && (
                    <AlertTriangle className="h-4 w-4 text-destructive" title={`WIP лимит превышен (${wipLimits[column.id]})`} />
                  )}
                </CardTitle>
                <TaskDialog
                  defaultStatus={column.id}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setOpenFor(column.id); }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                  openExternal={openFor === column.id}
                  onOpenChangeExternal={(v) => setOpenFor(v ? column.id : null)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar">
              {(tasksByColumn[column.id] || []).map((task) => (
                <Card
                  key={task.id}
                  className={`bg-card hover:shadow-lg transition-all animate-fade-in hover-lift select-none ${isDragging && draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                >
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      {/* Drag handle для мобильных */}
                      <button
                        type="button"
                        className="touch-none cursor-grab active:cursor-grabbing pt-1 md:hidden flex-shrink-0 p-1 -ml-1"
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const touch = e.touches[0];
                          const pos = { x: touch.clientX, y: touch.clientY };
                          setTouchStartPos(pos);
                          setCurrentTouchPos(pos);
                          touchPosRef.current = pos; // Синхронное обновление
                          setDraggedTask(task);
                          setIsDragging(true);
                          // Отключаем выделение текста и прокрутку страницы
                          document.body.style.userSelect = 'none';
                          document.body.style.webkitUserSelect = 'none';
                          document.body.style.overflow = 'hidden';
                        }}
                        onTouchMove={(e) => {
                          if (!draggedTask) return;
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const touch = e.touches[0];
                          const pos = { x: touch.clientX, y: touch.clientY };
                          setCurrentTouchPos(pos);
                          touchPosRef.current = pos; // Синхронное обновление для автопрокрутки
                          
                          // Логируем позицию для отладки
                          if (Math.random() < 0.1) { // Логируем каждое 10-е событие
                            console.log('[TOUCH] Position:', pos.x, pos.y, 'AutoScroll active:', autoScrollIntervalRef.current !== null);
                          }
                          
                          // Запускаем автопрокрутку (запустится только один раз)
                          // Подталкиваем container при импульсах, если rAF ещё не догнал
                          const el = scrollElRef.current || containerRef.current;
                          if (el && pos && touchPosRef.current) {
                            const rect = el.getBoundingClientRect();
                            const cardLeft = pos.x - 150;
                            const cardRight = pos.x + 150;
                            if (cardRight > rect.right - 4 && el.scrollLeft < (el.scrollWidth - el.clientWidth)) {
                              el.scrollLeft += 2; // микродвижение, чтобы активировать rAF
                            } else if (cardLeft < rect.left + 4 && el.scrollLeft > 0) {
                              el.scrollLeft -= 2;
                            }
                          }
                          startAutoScroll();
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Останавливаем автопрокрутку
                          stopAutoScroll();
                          
                          if (!draggedTask) {
                            document.body.style.userSelect = '';
                            document.body.style.webkitUserSelect = '';
                            document.body.style.overflow = '';
                            setTouchStartPos(null);
                            setCurrentTouchPos(null);
                            touchPosRef.current = null;
                            setIsDragging(false);
                            return;
                          }
                          
                          // Определяем, над какой колонкой палец
                          const touch = e.changedTouches[0];
                          const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
                          const columnElement = elements.find(el => el.hasAttribute('data-column-id'));
                          const columnId = columnElement?.getAttribute('data-column-id') as TaskStatus;
                          
                          if (columnId && columnId !== draggedTask.status) {
                            handleDrop(columnId);
                          }
                          
                          // Сбрасываем состояние
                          setDraggedTask(null);
                          setTouchStartPos(null);
                          setCurrentTouchPos(null);
                          touchPosRef.current = null;
                          setIsDragging(false);
                          document.body.style.userSelect = '';
                          document.body.style.webkitUserSelect = '';
                          document.body.style.overflow = '';
                        }}
                        onTouchCancel={() => {
                          // На случай если touch прервался
                          stopAutoScroll();
                          setDraggedTask(null);
                          setTouchStartPos(null);
                          setCurrentTouchPos(null);
                          touchPosRef.current = null;
                          setIsDragging(false);
                          document.body.style.userSelect = '';
                          document.body.style.webkitUserSelect = '';
                          document.body.style.overflow = '';
                        }}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <TaskDetailsDialog task={task} trigger={
                            <h4 className="text-sm font-medium leading-tight flex-1 hover:underline cursor-pointer">
                              {task.title}
                            </h4>
                          } />
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              <span>{(task as any)._comment_count || 0}</span>
                            </div>
                            <TaskActionsMenu taskId={task.id} taskTitle={task.title} initialTask={task} />
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {task.project?.name || 'Без проекта'}
                          </Badge>
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                            {getPriorityLabel(task.priority)}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                          {task.assignee && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{task.assignee.full_name}</span>
                            </div>
                          )}
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(task.due_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                {(task as any).due_end && (task as any).due_end !== task.due_date ? (
                                  <> — {new Date((task as any).due_end).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</>
                                ) : null}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!tasksByColumn[column.id] || tasksByColumn[column.id].length === 0) && (
                <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed rounded-lg">
                  Перетащите задачу сюда
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
      </div>
    </>
  );
}
