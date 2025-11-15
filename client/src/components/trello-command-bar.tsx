import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Plus,
  Bell,
  User,
  LogOut,
  Settings,
  CheckCircle2,
  Clock,
  Moon,
  Sun,
} from "lucide-react";
import { useLocation } from "wouter";
import type { Notification, Task, User as UserType } from "@shared/schema";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface TrelloCommandBarProps {
  onSidebarToggle: () => void;
}

export default function TrelloCommandBar({ onSidebarToggle }: TrelloCommandBarProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const { data: myTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/my"],
    enabled: !!user && searchQuery.length > 0,
  });

  const { data: assignedTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/assigned"],
    enabled: !!user && searchQuery.length > 0,
  });

  const tasks = [...myTasks, ...assignedTasks];

  const { data: users = [] } = useQuery<Pick<UserType, 'id' | 'fullName' | 'email' | 'department' | 'profilePicture'>[]>({
    queryKey: ["/api/users"],
    enabled: !!user && searchQuery.length > 0,
  });

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PUT", `/api/notifications/${id}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const handleLogout = async () => {
    const res = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    if (res.ok) {
      logout();
      setLocation('/auth');
    }
  };

  return (
    <div className="h-12 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 dark:from-primary/20 dark:via-accent/10 dark:to-secondary/20 border-b border-border flex items-center px-3 gap-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={onSidebarToggle}
        className="shrink-0"
        data-testid="button-sidebar-toggle"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </Button>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg hidden md:block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">GWT</span>
        </div>
      </div>

      <div className="flex-1 max-w-xl relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث عن المهام والموظفين..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            className="pr-10 bg-background/50"
            data-testid="input-search"
          />
        </div>

        {showSearchResults && searchQuery && (
          <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
            {filteredTasks.length === 0 && filteredUsers.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                لا توجد نتائج
              </div>
            )}

            {filteredTasks.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">المهام</div>
                {filteredTasks.map(task => (
                  <button
                    key={task.id}
                    className="w-full text-right p-2 hover-elevate rounded-md"
                    onClick={() => {
                      setLocation('/tasks');
                      setShowSearchResults(false);
                      setSearchQuery("");
                    }}
                    data-testid={`search-task-${task.id}`}
                  >
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-muted-foreground">{task.status}</div>
                  </button>
                ))}
              </div>
            )}

            {filteredUsers.length > 0 && (
              <div className="p-2 border-t">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">الموظفين</div>
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    className="w-full text-right p-2 hover-elevate rounded-md flex items-center gap-2"
                    onClick={() => {
                      setLocation(`/profile/${u.id}`);
                      setShowSearchResults(false);
                      setSearchQuery("");
                    }}
                    data-testid={`search-user-${u.id}`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={u.profilePicture || ''} />
                      <AvatarFallback>{u.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-right">
                      <div className="font-medium text-sm">{u.fullName}</div>
                      <div className="text-xs text-muted-foreground">{u.department}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="default"
          className="gap-1 bg-gradient-to-r from-primary to-accent"
          onClick={() => setLocation('/tasks')}
          data-testid="button-create-task"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">إنشاء</span>
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={toggleDarkMode}
          data-testid="button-theme-toggle"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="relative" data-testid="button-notifications">
              <Bell className="w-4 h-4" />
              {unreadNotifications.length > 0 && (
                <Badge className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadNotifications.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-2">
              <h3 className="font-semibold">الإشعارات</h3>
              <div className="max-h-96 overflow-y-auto space-y-1">
                {notifications.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لا توجد إشعارات
                  </p>
                )}
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-2 rounded-md text-sm hover-elevate cursor-pointer",
                      !notification.isRead && "bg-accent/10"
                    )}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsReadMutation.mutate(notification.id);
                      }
                    }}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-muted-foreground text-xs">{notification.message}</div>
                    <div className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full"
              data-testid="button-user-menu"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profilePicture || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  {user?.fullName.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2">
              <div className="font-medium">{user?.fullName}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation(`/profile/${user?.id}`)} data-testid="menu-profile">
              <User className="ml-2 h-4 w-4" />
              الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation('/settings')} data-testid="menu-settings">
              <Settings className="ml-2 h-4 w-4" />
              الإعدادات
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
