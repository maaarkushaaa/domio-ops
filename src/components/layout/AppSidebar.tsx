import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Factory,
  DollarSign,
  ShoppingCart,
  Users,
  FileText,
  BookOpen,
  Calendar,
  BarChart,
  FileBarChart,
  Shield,
  Settings,
  Mail,
  Sparkles,
  Video,
} from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
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
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Дашборд", url: "/", icon: LayoutDashboard },
  { title: "Задачи", url: "/tasks", icon: CheckSquare },
  { title: "Проекты", url: "/projects", icon: FolderKanban },
  { title: "Календарь", url: "/calendar", icon: Calendar },
  { title: "Производство", url: "/production", icon: Factory },
  { title: "Финансы", url: "/finance", icon: DollarSign },
  { title: "Закупки", url: "/procurement", icon: ShoppingCart },
  { title: "Клиенты", url: "/clients", icon: Users },
  { title: "Аналитика", url: "/analytics", icon: BarChart },
  { title: "Отчеты", url: "/reports", icon: FileBarChart },
  { title: "Документы", url: "/documents", icon: FileText },
  { title: "Почта", url: "/email", icon: Mail },
  { title: "Видеозвонки", url: "/video-calls", icon: Video },
  { title: "Автоматизация", url: "/automation", icon: Sparkles },
  { title: "База знаний", url: "/knowledge", icon: BookOpen },
  { title: "Функции", url: "/features", icon: Sparkles },
];

export function AppSidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar data-tour="sidebar">
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
                      onClick={handleNavClick}
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

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Администрирование</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin"
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                      }
                    >
                      <Shield className="h-4 w-4" />
                      <span>Админ панель</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Система</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                    }
                  >
                    <Settings className="h-4 w-4" />
                    <span>Настройки</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
