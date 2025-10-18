import { useState } from "react";
import { Search, User, LogOut, Command, Video } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationPopover } from "@/components/notifications/NotificationPopover";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { SmartSearch } from "@/components/modern/SmartSearch";
import { useVideoCallRealtime } from "@/providers/VideoCallRealtimeProvider";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const { user, signOut } = useApp();
  const userInitials = user?.name?.charAt(0).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "U";
  const [searchOpen, setSearchOpen] = useState(false);
  const { session } = useVideoCallRealtime();
  const navigate = useNavigate();

  const handleOpenVideoCall = () => {
    if (!session) return;
    const url = new URL(window.location.origin + "/video-calls");
    url.searchParams.set("session", session.id);
    navigate({ pathname: "/video-calls", search: url.search });
  };

  return (
    <>
    <header className="h-16 border-b glass-card px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <SidebarTrigger className="interactive" />
        <div className="relative flex-1 cursor-pointer" onClick={() => setSearchOpen(true)}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Умный поиск... (Ctrl+K)"
            className="pl-9 focus-elegant cursor-pointer"
            data-tour="search"
            readOnly
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {session && (
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={handleOpenVideoCall}
          >
            <Video className="h-4 w-4" />
            {session.title}
          </Button>
        )}
        <ThemeToggle />
        <div data-tour="notifications">
          <NotificationDropdown />
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

    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Умный поиск</DialogTitle>
        </DialogHeader>
        <SmartSearch />
      </DialogContent>
    </Dialog>
    </>
  );
}
