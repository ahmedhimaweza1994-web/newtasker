import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/contexts/sidebar-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  CheckSquare, 
  Users, 
  BarChart3, 
  Briefcase, 
  Settings,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Building,
  UserCog,
  MessageSquare,
  DollarSign,
  Phone,
  Lightbulb,
  TrendingDown,
  Brain,
  Sparkles,
  Image,
  Video,
  TrendingUp,
  MessageCircle,
  Code,
  Layers,
  UserCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Task, LeaveRequest, Notification } from "@shared/schema";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MenuGroup {
  title: string;
  items: MenuItem[];
  icon?: any;
  defaultOpen?: boolean;
  roles?: string[];
}

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | null;
  roles?: string[];
}

export default function Sidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const isMobile = useIsMobile();
  const [openGroups, setOpenGroups] = useState<string[]>(["overview", "work", "ai"]);

  const { data: userTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/my"],
    enabled: !!user,
  });

  const { data: assignedTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/assigned"],
    enabled: !!user,
  });

  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests/pending"],
    enabled: !!user && (user.role === 'admin' || user.role === 'sub-admin'),
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const totalTasks = [...userTasks, ...assignedTasks].filter(t => t.status !== 'completed').length;
  const pendingLeaves = leaveRequests.length;
  const unreadMessages = notifications.filter(n => !n.isRead && n.category === 'message').length;

  const menuGroups: MenuGroup[] = [
    {
      title: "نظرة عامة",
      icon: Layers,
      defaultOpen: true,
      items: [
        {
          name: "لوحة التحكم",
          href: "/",
          icon: Home,
        },
        {
          name: "التقارير",
          href: "/reports",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "العمل والتواصل",
      icon: MessageSquare,
      defaultOpen: true,
      items: [
        {
          name: "المهام",
          href: "/tasks",
          icon: CheckSquare,
          badge: totalTasks > 0 ? totalTasks.toString() : null,
        },
        {
          name: "الدردشة",
          href: "/chat",
          icon: MessageSquare,
          badge: unreadMessages > 0 ? unreadMessages.toString() : null,
        },
        {
          name: "سجل المكالمات",
          href: "/call-history",
          icon: Phone,
        },
      ],
    },
    {
      title: "الموارد البشرية",
      icon: Briefcase,
      items: [
        {
          name: "طلباتي",
          href: "/my-requests",
          icon: DollarSign,
        },
        {
          name: "خصومات الراتب",
          href: "/my-deductions",
          icon: TrendingDown,
        },
      ],
    },
    {
      title: "الإدارة",
      icon: UserCog,
      roles: ["admin", "sub-admin"],
      items: [
        {
          name: "لوحة المدير",
          href: "/admin",
          icon: Building,
          roles: ["admin", "sub-admin"],
        },
        {
          name: "إدارة المستخدمين",
          href: "/user-management",
          icon: UserCog,
          roles: ["admin", "sub-admin"],
        },
        {
          name: "إدارة الموارد البشرية",
          href: "/hr",
          icon: Briefcase,
          badge: pendingLeaves > 0 ? pendingLeaves.toString() : null,
          roles: ["admin", "sub-admin"],
        },
        {
          name: "إدارة الخصومات",
          href: "/admin-deductions",
          icon: TrendingDown,
          roles: ["admin", "sub-admin"],
        },
      ],
    },
    {
      title: "الشركات",
      icon: Building,
      items: [
        {
          name: "قائمة الشركات",
          href: "/companies",
          icon: Building,
        },
      ],
    },
    {
      title: "الذكاء الاصطناعي",
      icon: Brain,
      defaultOpen: true,
      items: [
        {
          name: "مركز الذكاء الاصطناعي",
          href: "/ai-center",
          icon: Sparkles,
        },
        {
          name: "مولد الصور",
          href: "/ai/image-generator",
          icon: Image,
        },
        {
          name: "مولد الفيديو",
          href: "/ai/video-generator",
          icon: Video,
        },
        {
          name: "التسويق والSEO",
          href: "/ai/marketing-seo",
          icon: TrendingUp,
        },
        {
          name: "محادثة نصية",
          href: "/ai/text-chat",
          icon: MessageCircle,
        },
        {
          name: "مساعد البرمجة",
          href: "/ai/code-assistant",
          icon: Code,
        },
      ],
    },
    {
      title: "الحساب والإعدادات",
      icon: Settings,
      items: [
        {
          name: "الملف الشخصي",
          href: `/profile/${user?.id}`,
          icon: UserCircle,
        },
        {
          name: "المقترحات",
          href: "/suggestions",
          icon: Lightbulb,
        },
        {
          name: "الإعدادات",
          href: "/ai/settings",
          icon: Settings,
        },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  const filteredMenuGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => 
        !item.roles || item.roles.includes(user?.role || '')
      )
    }))
    .filter(group => 
      (!group.roles || group.roles.includes(user?.role || '')) && 
      group.items.length > 0
    );

  const sidebarContent = (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground leading-none">GWT</h2>
              <p className="text-xs text-muted-foreground">إدارة المهام</p>
            </div>
          </motion.div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 hover-elevate"
            data-testid="sidebar-toggle"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredMenuGroups.map((group) => (
            <Collapsible
              key={group.title}
              open={!isCollapsed && openGroups.includes(group.title)}
              onOpenChange={() => !isCollapsed && toggleGroup(group.title)}
            >
              {!isCollapsed && (
                <CollapsibleTrigger asChild>
                  <motion.button
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/50 group"
                    data-testid={`group-${group.title}`}
                  >
                    <div className="flex items-center gap-2">
                      {group.icon && <group.icon className="w-4 h-4" />}
                      <span>{group.title}</span>
                    </div>
                    <motion.div
                      animate={{ 
                        rotate: openGroups.includes(group.title) ? 180 : 0 
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </motion.div>
                  </motion.button>
                </CollapsibleTrigger>
              )}

              <CollapsibleContent className="space-y-0.5 mt-0.5">
                <AnimatePresence>
                  {group.items.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Button
                        variant={isActive(item.href) ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 text-right h-10 transition-all duration-200 relative overflow-hidden",
                          isCollapsed && "justify-center px-2",
                          isActive(item.href) && "shadow-sm"
                        )}
                        onClick={() => {
                          setLocation(item.href);
                          if (isMobile) setIsMobileOpen(false);
                        }}
                        data-testid={`sidebar-link-${item.href.replace(/\//g, '-')}`}
                      >
                        {isActive(item.href) && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute right-0 top-0 bottom-0 w-1 bg-primary"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <div className="flex flex-1 items-center justify-between overflow-hidden">
                            <span className="flex-1 text-sm truncate">{item.name}</span>
                            {item.badge && (
                              <Badge 
                                variant={isActive(item.href) ? "secondary" : "outline"} 
                                className="mr-auto text-xs h-5 px-2"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        )}
                        {isCollapsed && item.badge && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] text-white flex items-center justify-center">
                            {item.badge}
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border/50 p-4 bg-background/80 backdrop-blur-sm">
        <motion.div 
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10",
            isCollapsed && "justify-center p-2"
          )}
          whileHover={{ scale: 1.02 }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
              {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">متصل الآن</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.department}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetContent side="right" className="w-72 p-0 border-l-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      ) : (
        <motion.div 
          className={cn(
            "hidden md:block fixed right-0 top-16 z-40 h-[calc(100vh-4rem)] bg-card/95 backdrop-blur-sm border-l border-border/50 transition-all duration-300 shadow-lg"
          )}
          animate={{ 
            width: isCollapsed ? "4rem" : "18rem" 
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {sidebarContent}
        </motion.div>
      )}
    </>
  );
}
