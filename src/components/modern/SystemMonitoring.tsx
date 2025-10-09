import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Server, Database, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: number;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

export function SystemMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      id: '1',
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      status: 'healthy',
      threshold: 80,
    },
    {
      id: '2',
      name: 'Memory',
      value: 62,
      unit: '%',
      status: 'healthy',
      threshold: 85,
    },
    {
      id: '3',
      name: 'Database',
      value: 78,
      unit: '%',
      status: 'warning',
      threshold: 75,
    },
    {
      id: '4',
      name: 'API Response',
      value: 145,
      unit: 'ms',
      status: 'healthy',
      threshold: 500,
    },
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'warning',
      message: 'База данных использует более 75% доступного пространства',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'info',
      message: 'Система обновлена до последней версии',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric) => ({
          ...metric,
          value: Math.max(
            0,
            metric.value + (Math.random() - 0.5) * 10
          ),
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: SystemMetric['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Мониторинг системы
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{metric.name}</span>
                {getStatusIcon(metric.status)}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">
                  {Math.round(metric.value)}
                </span>
                <span className="text-sm text-muted-foreground">{metric.unit}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    metric.status === 'healthy'
                      ? 'bg-success'
                      : metric.status === 'warning'
                      ? 'bg-warning'
                      : 'bg-destructive'
                  }`}
                  style={{ width: `${(metric.value / metric.threshold) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Системные алерты</p>
            <Badge variant="outline" className="text-xs">
              {alerts.filter((a) => a.type !== 'info').length} активных
            </Badge>
          </div>

          <ScrollArea className="h-48">
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border animate-fade-in ${
                    alert.type === 'error'
                      ? 'bg-destructive/10 border-destructive/20'
                      : alert.type === 'warning'
                      ? 'bg-warning/10 border-warning/20'
                      : 'bg-primary/10 border-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" size="sm">
            <Server className="h-3 w-3 mr-2" />
            Logs
          </Button>
          <Button variant="outline" className="flex-1" size="sm">
            <Database className="h-3 w-3 mr-2" />
            Database
          </Button>
          <Button variant="outline" className="flex-1" size="sm">
            <Zap className="h-3 w-3 mr-2" />
            Perfomance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
