import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMediaUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, Search, Moon, Sun, LogOut, User, Settings, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/lib/websocket";
import type { Notification } from "@shared/schema";

interface NavHeaderProps {
  onMenuToggle?: () => void;
  showMenuToggle?: boolean;
}

export default function NavHeader({ onMenuToggle, showMenuToggle = false }: NavHeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const { lastMessage } = useWebSocket({ userId: user?.id });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 5000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PUT", `/api/notifications/${id}/read`, {});
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

  useEffect(() => {
    if (lastMessage?.type === 'new_notification') {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  }, [lastMessage]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleProfileClick = () => {
    setLocation(`/profile/${user?.id}`);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsReadMutation.mutate(notification.id);
    
    if (notification.category === 'message' && notification.metadata?.roomId) {
      const metadata = notification.metadata as any;
      const messageId = metadata?.messageId || '';
      setLocation(`/chat?roomId=${metadata.roomId}${messageId ? `&messageId=${messageId}` : ''}`);
    } else if (notification.category === 'task' && notification.metadata?.taskId) {
      const metadata = notification.metadata as any;
      setLocation(`/tasks?taskId=${metadata.taskId}`);
    } else if (notification.category === 'call') {
      setLocation(`/call-history`);
    } else if (notification.category === 'leave_request') {
      setLocation(`/hr`);
    } else {
      setLocation('/dashboard');
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white dark:bg-gray-900">

      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left side - Menu toggle and Logo */}
        <div className="flex items-center gap-4">
          {showMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="md:hidden"
              data-testid="nav-menu-toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-foreground hidden sm:block">GWT إدارة المهام</h1>
          </div>
        </div>

        {/* Center - Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-sm mx-8">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="البحث..."
              className="w-full pr-10 bg-muted/50 border-0"
              data-testid="nav-header-search"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Search button for mobile */}
          <Button variant="ghost" size="sm" className="md:hidden" data-testid="nav-search-mobile">
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative" data-testid="nav-notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    لا توجد إشعارات
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex-col items-start gap-1 p-3 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                      data-testid={`notification-item-${notification.id}`}
                    >
                      <div className="flex w-full items-start justify-between">
                        <span className="font-medium text-sm">{notification.title}</span>
                        {!notification.isRead && (
                          <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark mode toggle */}
          <Button variant="ghost" size="sm" onClick={toggleDarkMode} data-testid="nav-dark-toggle">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="nav-user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getMediaUrl(user?.profilePicture)} alt={user?.fullName} />
                  <AvatarFallback className="text-xs">
                    {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ND'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick} data-testid="nav-profile-item">
                <User className="mr-2 h-4 w-4" />
                الملف الشخصي
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="nav-settings-item">
                <Settings className="mr-2 h-4 w-4" />
                الإعدادات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="nav-logout-item">
                <LogOut className="mr-2 h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
