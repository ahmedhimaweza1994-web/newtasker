import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Building2,
  Brain,
  MessageSquare,
  BarChart3,
  UserCog,
  FileText,
  Phone,
  ClipboardList,
  DollarSign,
  Lightbulb,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Task, LeaveRequest, Notification } from "@shared/schema";

interface TrelloSidebarProps {
  isCollapsed: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: number | null;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function TrelloSidebar({ isCollapsed }: TrelloSidebarProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'إدارة العمل': true,
    'إدارة الموظفين': true,
    'الذكاء الاصطناعي': true,
    'التواصل': true,
  });

  const { data: myTasks = [] } = useQuery<Task[]>({
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

  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const pendingTasksCount = [...myTasks, ...assignedTasks].filter(t => t.status === 'pending').length;

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const navGroups: NavGroup[] = [
    {
      title: "إدارة العمل",
      items: [
        {
          name: user?.role === 'admin' || user?.role === 'sub-admin' ? "لوحة الإدارة" : "لوحة التحكم",
          href: user?.role === 'admin' || user?.role === 'sub-admin' ? "/admin-dashboard" : "/dashboard",
          icon: LayoutDashboard,
          badge: null,
        },
        {
          name: "المهام",
          href: "/tasks",
          icon: CheckSquare,
          badge: pendingTasksCount > 0 ? pendingTasksCount : null,
        },
        {
          name: "الشركات",
          href: "/companies",
          icon: Building2,
          badge: null,
        },
        {
          name: "التقارير",
          href: "/reports",
          icon: BarChart3,
          badge: null,
        },
      ],
    },
    {
      title: "إدارة الموظفين",
      items: [
        {
          name: "الموارد البشرية",
          href: "/hr",
          icon: UserCog,
          badge: leaveRequests.length > 0 ? leaveRequests.length : null,
        },
        ...(user?.role === 'admin' || user?.role === 'sub-admin' ? [{
          name: "إدارة المستخدمين",
          href: "/user-management",
          icon: Users,
          badge: null,
        }] : []),
        {
          name: "طلباتي",
          href: "/my-requests",
          icon: FileText,
          badge: null,
        },
        {
          name: "خصوماتي",
          href: "/my-deductions",
          icon: DollarSign,
          badge: null,
        },
        ...(user?.role === 'admin' || user?.role === 'sub-admin' ? [{
          name: "إدارة الخصومات",
          href: "/admin-deductions",
          icon: ClipboardList,
          badge: null,
        }] : []),
      ],
    },
    {
      title: "الذكاء الاصطناعي",
      items: [
        {
          name: "مركز الذكاء الاصطناعي",
          href: "/ai-center",
          icon: Brain,
          badge: null,
        },
      ],
    },
    {
      title: "التواصل",
      items: [
        {
          name: "المحادثات",
          href: "/chat",
          icon: MessageSquare,
          badge: unreadNotifications > 0 ? unreadNotifications : null,
        },
        {
          name: "سجل المكالمات",
          href: "/call-history",
          icon: Phone,
          badge: null,
        },
        {
          name: "الاقتراحات",
          href: "/suggestions",
          icon: Lightbulb,
          badge: null,
        },
      ],
    },
  ];

  if (isCollapsed) {
    return (
      <div className="w-16 bg-card border-l border-border flex flex-col items-center py-4 gap-2">
        {navGroups.flatMap(group => group.items).map((item) => (
          <Button
            key={item.href}
            size="icon"
            variant={location === item.href ? "default" : "ghost"}
            onClick={() => setLocation(item.href)}
            className={cn(
              "relative w-12 h-12",
              location === item.href && "bg-gradient-to-br from-primary to-accent text-white"
            )}
            data-testid={`nav-${item.href.replace('/', '')}`}
          >
            <item.icon className="w-5 h-5" />
            {item.badge && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-64 bg-card border-l border-border flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {navGroups.map((group, idx) => (
            <div key={group.title} className="space-y-1">
              {idx > 0 && <Separator className="my-2" />}
              <button
                className="w-full flex items-center justify-between p-2 text-xs font-semibold text-muted-foreground hover-elevate rounded-md"
                onClick={() => toggleGroup(group.title)}
                data-testid={`group-${group.title}`}
              >
                <span>{group.title}</span>
                {expandedGroups[group.title] ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>

              {expandedGroups[group.title] && (
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Button
                      key={item.href}
                      variant={location === item.href ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-10",
                        location === item.href && "bg-gradient-to-r from-primary to-accent text-white"
                      )}
                      onClick={() => setLocation(item.href)}
                      data-testid={`nav-${item.href.replace('/', '')}`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-right truncate">{item.name}</span>
                      {item.badge !== null && item.badge > 0 && (
                        <Badge
                          variant={location === item.href ? "secondary" : "default"}
                          className="shrink-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />
      
      <div className="p-3">
        <div className="text-xs text-muted-foreground text-center">
          GWT Task Management
        </div>
        <div className="text-xs text-muted-foreground text-center">
          v2.0 - Trello Style
        </div>
      </div>
    </div>
  );
}
