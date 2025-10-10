import { Search, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/contexts/AppContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationPopover } from "@/components/notifications/NotificationPopover";

export function AppHeader() {
  const { user, signOut } = useApp();
  const userInitials = user?.name?.charAt(0).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <header className="h-16 border-b glass-card px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <SidebarTrigger className="interactive" />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Быстрый поиск..."
            className="pl-9 focus-elegant"
            data-tour="search"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div data-tour="notifications">
          <NotificationPopover />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full interactive hover-glow">
              <div data-tour="ai-assistant">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card animate-scale-in w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="interactive">
              <User className="mr-2 h-4 w-4" />
              Профиль
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="interactive text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
