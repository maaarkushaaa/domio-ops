import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedWorkflows } from "@/components/modern/AdvancedWorkflows";
import { DataVisualization } from "@/components/modern/DataVisualization";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { Zap, BarChart3, GitBranch } from "lucide-react";

export default function Automation() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-xl">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          Автоматизация и Аналитика
        </h1>
        <p className="text-muted-foreground mt-2">
          Умные инструменты для оптимизации бизнес-процессов
        </p>
      </div>

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="builder" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Конструктор
          </TabsTrigger>
          <TabsTrigger value="workflows" className="gap-2">
            <Zap className="h-4 w-4" />
            Готовые Workflows
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Аналитика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <WorkflowBuilder />
        </TabsContent>

        <TabsContent value="workflows">
          <AdvancedWorkflows />
        </TabsContent>

        <TabsContent value="analytics">
          <DataVisualization />
        </TabsContent>
      </Tabs>
    </div>
  );
}
