import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Search, Moon, Sun, LogOut, User, Settings, FileText, Users as UsersIcon, CheckSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import type { Notification, Task, User as UserType } from "@shared/schema";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { lastMessage } = useWebSocket();
  const { toast } = useToast();

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadNotifications = notifications.filter(n => !n.isRead);

  // Fetch tasks for search
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/all"],
    enabled: !!user && !!searchTerm,
  });

  // Fetch users for search
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: !!user && !!searchTerm,
  });

  // Filter search results
  const searchResults = {
    tasks: tasks.filter(task => 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5),
    users: users.filter(u => 
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5),
  };

  const hasResults = searchResults.tasks.length > 0 || searchResults.users.length > 0;

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
    if (searchTerm) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [searchTerm]);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'new_notification' && lastMessage.data) {
        const notification = lastMessage.data as Notification;
        // Only show toast if it's for the current user
        if (notification.userId === user?.id) {
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default',
          });
          // Refresh notifications list
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        }
      } else if (lastMessage.type === 'new_message' && lastMessage.data) {
        // Refresh notifications when new messages arrive (might trigger message notifications)
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      }
    }
  }, [lastMessage, user, toast]);

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

  const handleSettingsClick = () => {
    setLocation('/settings');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 bg-background dark:bg-background">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-foreground">GWT إدارة المهام</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-sm mx-8">
          <Popover open={showSearchResults} onOpenChange={setShowSearchResults}>
            <PopoverTrigger asChild>
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المهام والمستخدمين..."
                  className="w-full pr-10 bg-muted/50"
                  data-testid="nav-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm && setShowSearchResults(true)}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
              <ScrollArea className="max-h-[400px]">
                {!searchTerm ? (
                  <div className="p-4 text-center text-muted-foreground">
                    ابدأ بالكتابة للبحث...
                  </div>
                ) : !hasResults ? (
                  <div className="p-4 text-center text-muted-foreground">
                    لا توجد نتائج
                  </div>
                ) : (
                  <div className="p-2">
                    {searchResults.tasks.length > 0 && (
                      <div className="mb-2">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">المهام</div>
                        {searchResults.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-2 rounded hover:bg-muted cursor-pointer"
                            onClick={() => {
                              setLocation('/tasks');
                              setSearchTerm("");
                              setShowSearchResults(false);
                            }}
                            data-testid={`search-result-task-${task.id}`}
                          >
                            <div className="flex items-start gap-2">
                              <CheckSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{task.title}</p>
                                {task.companyName && (
                                  <p className="text-xs text-muted-foreground truncate">{task.companyName}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.users.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">المستخدمين</div>
                        {searchResults.users.map((u) => (
                          <div
                            key={u.id}
                            className="p-2 rounded hover:bg-muted cursor-pointer"
                            onClick={() => {
                              setLocation(`/profile/${u.id}`);
                              setSearchTerm("");
                              setShowSearchResults(false);
                            }}
                            data-testid={`search-result-user-${u.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <UsersIcon className="w-4 h-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{u.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">{u.department} - {u.email}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative" data-testid="nav-notifications-button">
                <Bell className="h-5 w-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">الإشعارات</h3>
                <span className="text-xs text-muted-foreground">{unreadNotifications.length} غير مقروء</span>
              </div>
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    لا توجد إشعارات
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 ${!notification.isRead ? 'bg-muted/30' : ''}`}
                        onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.createdAt).toLocaleDateString('ar-EG')}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Dark Mode Toggle */}
          <Button variant="ghost" size="sm" onClick={toggleDarkMode} data-testid="nav-dark-mode-toggle">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="nav-user-menu">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profilePicture || undefined} alt={user?.fullName} />
                  <AvatarFallback>
                    {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ND'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.department}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick} data-testid="nav-profile-link">
                <User className="mr-2 h-4 w-4" />
                الملف الشخصي
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick} data-testid="nav-settings-link">
                <Settings className="mr-2 h-4 w-4" />
                الإعدادات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="nav-logout-button">
                <LogOut className="mr-2 h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
