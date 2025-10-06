import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Factory,
  DollarSign,
  ShoppingCart,
  Users,
  FileText,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Дашборд", url: "/", icon: LayoutDashboard },
  { title: "Задачи", url: "/tasks", icon: CheckSquare },
  { title: "Производство", url: "/production", icon: Factory },
  { title: "Финансы", url: "/finance", icon: DollarSign },
  { title: "Закупки", url: "/procurement", icon: ShoppingCart },
  { title: "Клиенты", url: "/clients", icon: Users },
  { title: "Документы", url: "/documents", icon: FileText },
  { title: "База знаний", url: "/knowledge", icon: BookOpen },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DO</span>
          </div>
          <span className="font-bold text-lg">DOMIO Ops</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
