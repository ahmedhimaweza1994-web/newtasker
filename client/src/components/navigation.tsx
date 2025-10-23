import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/contexts/sidebar-context";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Search, Moon, Sun, LogOut, User, Settings, FileText, Users as UsersIcon, CheckSquare, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedNotifications } from "@/hooks/use-enhanced-notifications";
import { useAutoMarkRead } from "@/hooks/use-auto-mark-read";
import { motion, AnimatePresence } from "framer-motion";
import type { Notification, Task, User as UserType } from "@shared/schema";
import { formatArabicDate } from "@/lib/arabic-date";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const { setIsMobileOpen } = useSidebar();
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { lastMessage } = useWebSocket({ userId: user?.id });
  const { toast } = useToast();
  const { handleNotification, ensureBrowserNotificationPermission, permission } = useEnhancedNotifications();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  useAutoMarkRead(notifications);

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/all"],
    enabled: !!user && !!searchTerm,
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: !!user && !!searchTerm,
  });

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

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'new_notification' && lastMessage.data) {
        const notification = lastMessage.data as Notification;
        if (notification.userId === user?.id) {
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default',
          });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          
          handleNotification(notification);
        }
      } else if (lastMessage.type === 'new_message' && lastMessage.data) {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      }
    }
  }, [lastMessage, user, toast, handleNotification]);

  // Request browser notification permission on first load
  useEffect(() => {
    if (permission === 'default' && user) {
      ensureBrowserNotificationPermission();
    }
  }, [permission, user, ensureBrowserNotificationPermission]);

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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

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

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="sticky top-0 z-50 w-full border-b border-border bg-white dark:bg-gray-900"
    >
      <div className="container flex h-16 items-center justify-between px-4 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden h-11 w-11"
              data-testid="nav-mobile-menu-toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </motion.div>
          <motion.div 
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-foreground">GWT إدارة المهام</h1>
          </div>
        </div>

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
            <AnimatePresence>
              {showSearchResults && (
                <PopoverContent className="w-96 p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()} asChild>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
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
                              {searchResults.tasks.map((task, index) => (
                                <motion.div
                                  key={task.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                                  onClick={() => {
                                    setLocation('/tasks');
                                    setSearchTerm("");
                                    setShowSearchResults(false);
                                  }}
                                  data-testid={`search-result-task-${task.id}`}
                                  whileHover={{ x: 5 }}
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
                                </motion.div>
                              ))}
                            </div>
                          )}
                          {searchResults.users.length > 0 && (
                            <div>
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">المستخدمين</div>
                              {searchResults.users.map((u, index) => (
                                <motion.div
                                  key={u.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: (searchResults.tasks.length + index) * 0.05 }}
                                  className="p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                                  onClick={() => {
                                    setLocation(`/profile/${u.id}`);
                                    setSearchTerm("");
                                    setShowSearchResults(false);
                                  }}
                                  data-testid={`search-result-user-${u.id}`}
                                  whileHover={{ x: 5 }}
                                >
                                  <div className="flex items-center gap-2">
                                    <UsersIcon className="w-4 h-4 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{u.fullName}</p>
                                      <p className="text-xs text-muted-foreground truncate">{u.department} - {u.email}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </motion.div>
                </PopoverContent>
              )}
            </AnimatePresence>
          </Popover>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative h-11 w-11 md:h-10 md:w-10" 
                  data-testid="nav-notifications-button"
                >
                  <Bell className="h-5 w-5" />
                  <AnimatePresence>
                    {unreadNotifications.length > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center"
                      >
                        {unreadNotifications.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
              >
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
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${!notification.isRead ? 'bg-muted/30' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                          data-testid={`notification-${notification.id}`}
                          whileHover={{ x: 5 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatArabicDate(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 rounded-full bg-primary mt-2"
                              />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            </PopoverContent>
          </Popover>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleDarkMode} 
              className="h-11 w-11 md:h-10 md:w-10"
              data-testid="nav-dark-mode-toggle"
            >
              <motion.div
                initial={false}
                animate={{ rotate: isDark ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.div>
            </Button>
          </motion.div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  className="relative h-11 w-11 md:h-10 md:w-10 rounded-full" 
                  data-testid="nav-user-menu"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getMediaUrl(user?.profilePicture)} alt={user?.fullName} />
                    <AvatarFallback>
                      {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ND'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.department}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfileClick} data-testid="nav-profile-link" asChild>
                  <motion.div whileHover={{ x: 5 }} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    الملف الشخصي
                  </motion.div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettingsClick} data-testid="nav-settings-link" asChild>
                  <motion.div whileHover={{ x: 5 }} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    الإعدادات
                  </motion.div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="nav-logout-button" asChild>
                  <motion.div whileHover={{ x: 5 }} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    تسجيل الخروج
                  </motion.div>
                </DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.nav>
  );
}
