import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Key, Eye } from "lucide-react";

export function AdvancedSecurity() {
  const securityFeatures = [
    { icon: Lock, title: "End-to-End шифрование", status: "active" },
    { icon: Key, title: "2FA аутентификация", status: "active" },
    { icon: Shield, title: "Защита от DDoS", status: "active" },
    { icon: Eye, title: "Аудит доступа", status: "monitoring" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Корпоративная безопасность
        </CardTitle>
        <CardDescription>
          Многоуровневая защита данных и систем
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {securityFeatures.map((feature, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <feature.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{feature.title}</span>
            </div>
            <Badge 
              variant={feature.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {feature.status === 'active' ? 'Активно' : 'Мониторинг'}
            </Badge>
          </div>
        ))}
        <div className="pt-2 mt-2 border-t">
          <p className="text-xs text-muted-foreground">
            ✓ ISO 27001 сертифицирован<br/>
            ✓ GDPR совместимо<br/>
            ✓ SOC 2 Type II аудит
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
