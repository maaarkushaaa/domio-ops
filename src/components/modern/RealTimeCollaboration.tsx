import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, Circle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useRealtimeCollaboration } from "@/hooks/use-realtime-collaboration";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function RealTimeCollaboration() {
  const { activeUsers, isConnected, refresh } = useRealtimeCollaboration();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'away': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'В сети';
      case 'away': return 'Отошёл';
      default: return 'Не в сети';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Real-Time Collaboration</CardTitle>
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Совместная работа в реальном времени
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeUsers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Нет активных пользователей</p>
          </div>
        ) : (
          <>
            {activeUsers.map((user) => (
              <div key={user.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {user.user_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {user.user_name}
                    </span>
                    <Circle 
                      className={`h-2 w-2 fill-current flex-shrink-0 ${getStatusColor(user.status)}`} 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.activity}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {formatDistanceToNow(new Date(user.last_activity), { 
                      addSuffix: true, 
                      locale: ru 
                    })}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(user.status)}`}
                >
                  {getStatusText(user.status)}
                </Badge>
              </div>
            ))}
            <div className="pt-2 border-t">
              <Badge variant="outline" className="text-xs">
                <Circle className="h-2 w-2 mr-1 fill-green-500 text-green-500" />
                {activeUsers.filter(u => u.status === 'online').length} пользователей онлайн
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
