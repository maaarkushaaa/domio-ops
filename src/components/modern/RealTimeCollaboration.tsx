import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Circle } from "lucide-react";

export function RealTimeCollaboration() {
  const activeUsers = [
    { name: "Анна С.", status: "online", activity: "Редактирует задачу #234" },
    { name: "Иван П.", status: "online", activity: "Просматривает проект Шкаф" },
    { name: "Мария К.", status: "away", activity: "Отошла (5 мин назад)" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Real-Time Collaboration
        </CardTitle>
        <CardDescription>
          Совместная работа в реальном времени
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeUsers.map((user, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{user.name}</span>
                <Circle 
                  className={`h-2 w-2 fill-current ${
                    user.status === 'online' ? 'text-green-500' : 'text-yellow-500'
                  }`} 
                />
              </div>
              <p className="text-xs text-muted-foreground">{user.activity}</p>
            </div>
          </div>
        ))}
        <div className="pt-2 border-t">
          <Badge variant="outline" className="text-xs">
            <Circle className="h-2 w-2 mr-1 fill-green-500 text-green-500" />
            3 пользователей онлайн
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
