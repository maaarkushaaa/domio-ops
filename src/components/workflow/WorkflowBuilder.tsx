import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Plus, Trash2, GitBranch, CheckCircle2, Clock, Mail, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  label: string;
  config: Record<string, string>;
  position: { x: number; y: number };
}

interface WorkflowConnection {
  from: string;
  to: string;
  condition?: string;
}

export function WorkflowBuilder() {
  const { toast } = useToast();
  const [workflowName, setWorkflowName] = useState('Новый workflow');
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: '1',
      type: 'trigger',
      label: 'Новая задача создана',
      config: { entity: 'task', event: 'created' },
      position: { x: 50, y: 50 },
    },
  ]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const nodeTypes = [
    { type: 'trigger', label: 'Триггер', icon: Zap, color: 'text-primary' },
    { type: 'condition', label: 'Условие', icon: GitBranch, color: 'text-warning' },
    { type: 'action', label: 'Действие', icon: CheckCircle2, color: 'text-success' },
    { type: 'delay', label: 'Задержка', icon: Clock, color: 'text-secondary' },
  ];

  const addNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type,
      label: `Новый ${type}`,
      config: {},
      position: { x: 50 + nodes.length * 150, y: 50 + Math.floor(nodes.length / 3) * 150 },
    };
    setNodes([...nodes, newNode]);
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setConnections(connections.filter(c => c.from !== id && c.to !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  const connectNodes = (from: string, to: string) => {
    if (!connections.find(c => c.from === from && c.to === to)) {
      setConnections([...connections, { from, to }]);
    }
  };

  const runWorkflow = () => {
    toast({
      title: 'Workflow запущен',
      description: `"${workflowName}" выполняется`,
    });
  };

  const saveWorkflow = () => {
    toast({
      title: 'Workflow сохранен',
      description: `"${workflowName}" успешно сохранен`,
    });
  };

  const getNodeIcon = (type: string) => {
    const nodeType = nodeTypes.find(t => t.type === type);
    if (!nodeType) return Zap;
    return nodeType.icon;
  };

  const getNodeColor = (type: string) => {
    const nodeType = nodeTypes.find(t => t.type === type);
    return nodeType?.color || 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Визуальный редактор Workflow</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={saveWorkflow}>
              Сохранить
            </Button>
            <Button size="sm" onClick={runWorkflow}>
              <Play className="h-4 w-4 mr-1" />
              Запустить
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Название workflow</Label>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Palette */}
          <div className="space-y-2">
            <Label>Компоненты</Label>
            <div className="space-y-2">
              {nodeTypes.map((nodeType) => {
                const Icon = nodeType.icon;
                return (
                  <Button
                    key={nodeType.type}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => addNode(nodeType.type as WorkflowNode['type'])}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${nodeType.color}`} />
                    {nodeType.label}
                  </Button>
                );
              })}
            </div>

            <div className="pt-4 space-y-2">
              <Label>Примеры workflow</Label>
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  Автоматическое назначение
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  Уведомления по email
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                  Эскалация задач
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="col-span-2 border rounded-lg p-4 bg-muted/30 min-h-[500px] relative">
            <div className="text-xs text-muted-foreground mb-4">Canvas</div>
            
            {/* Connections */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
              {connections.map((conn, index) => {
                const fromNode = nodes.find(n => n.id === conn.from);
                const toNode = nodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return null;

                const x1 = fromNode.position.x + 75;
                const y1 = fromNode.position.y + 40;
                const x2 = toNode.position.x + 75;
                const y2 = toNode.position.y + 40;

                return (
                  <line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--border))" />
                </marker>
              </defs>
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
              const Icon = getNodeIcon(node.type);
              return (
                <div
                  key={node.id}
                  className={`absolute p-3 border rounded-lg bg-background cursor-move transition-all ${
                    selectedNode === node.id ? 'ring-2 ring-primary' : ''
                  }`}
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                    width: '150px',
                    zIndex: 1,
                  }}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Icon className={`h-4 w-4 ${getNodeColor(node.type)}`} />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs font-medium mb-1">{node.label}</div>
                  <Badge variant="outline" className="text-xs">
                    {node.type}
                  </Badge>
                </div>
              );
            })}

            {nodes.length === 1 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Добавьте компоненты из палитры слева</p>
                </div>
              </div>
            )}
          </div>

          {/* Properties */}
          <div className="space-y-3">
            <Label>Свойства узла</Label>
            {selectedNode ? (
              <div className="space-y-3">
                {(() => {
                  const node = nodes.find(n => n.id === selectedNode);
                  if (!node) return null;

                  return (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Тип</Label>
                        <Badge>{node.type}</Badge>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Название</Label>
                        <Input
                          value={node.label}
                          onChange={(e) => {
                            setNodes(nodes.map(n =>
                              n.id === selectedNode ? { ...n, label: e.target.value } : n
                            ));
                          }}
                        />
                      </div>

                      {node.type === 'trigger' && (
                        <div className="space-y-2">
                          <Label className="text-xs">Событие</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите событие" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="task_created">Задача создана</SelectItem>
                              <SelectItem value="task_completed">Задача завершена</SelectItem>
                              <SelectItem value="project_started">Проект начат</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {node.type === 'action' && (
                        <div className="space-y-2">
                          <Label className="text-xs">Действие</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите действие" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="send_email">Отправить email</SelectItem>
                              <SelectItem value="create_task">Создать задачу</SelectItem>
                              <SelectItem value="update_status">Обновить статус</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {node.type === 'condition' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs">Поле</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите поле" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="priority">Приоритет</SelectItem>
                                <SelectItem value="status">Статус</SelectItem>
                                <SelectItem value="assignee">Исполнитель</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Оператор</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="=" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Равно</SelectItem>
                                <SelectItem value="not_equals">Не равно</SelectItem>
                                <SelectItem value="contains">Содержит</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Значение</Label>
                            <Input placeholder="Значение" />
                          </div>
                        </>
                      )}

                      {node.type === 'delay' && (
                        <div className="space-y-2">
                          <Label className="text-xs">Задержка</Label>
                          <div className="flex gap-2">
                            <Input type="number" placeholder="1" />
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="часов" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minutes">минут</SelectItem>
                                <SelectItem value="hours">часов</SelectItem>
                                <SelectItem value="days">дней</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Выберите узел для настройки
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
