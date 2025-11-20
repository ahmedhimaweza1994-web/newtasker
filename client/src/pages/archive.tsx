import { useState, useEffect } from "react";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MotionPageShell, MotionSection } from "@/components/ui/motion-wrappers";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Archive,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Eye
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, User, SelectCompany } from "@shared/schema";
import { formatArabicDate } from "@/lib/arabic-date";

export default function ArchivePage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'sub-admin') {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية للوصول إلى الأرشيف",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, setLocation, toast]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/archived"],
    enabled: user?.role === 'admin' || user?.role === 'sub-admin',
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: companies = [] } = useQuery<SelectCompany[]>({
    queryKey: ["/api/companies"],
  });

  const unarchiveTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/unarchive`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "تم استرجاع المهمة",
        description: "تمت إعادة المهمة إلى قائمة المهام المكتملة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest("DELETE", `/api/tasks/${taskId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/archived"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المهمة بشكل نهائي",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAllArchivedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/tasks/archived/all", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/archived"] });
      setSelectedTasks(new Set());
      toast({
        title: "تم الحذف",
        description: "تم حذف جميع المهام المؤرشفة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const res = await apiRequest("POST", "/api/tasks/delete-multiple", { taskIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/archived"] });
      setSelectedTasks(new Set());
      toast({
        title: "تم الحذف",
        description: "تم حذف المهام المحددة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(t => t.id)));
    }
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedTasks.size === 0) return;
    deleteSelectedMutation.mutate(Array.from(selectedTasks));
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "غير محدد";
    const user = users.find(u => u.id === userId);
    return user ? user.fullName : "غير معروف";
  };

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return null;
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : null;
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "عالية";
      case "medium": return "متوسطة";
      case "low": return "منخفضة";
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  return (
    <MotionPageShell>
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300", "md:mr-16", !isCollapsed && "md:mr-64")}>
          <MotionSection delay={0.1}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  الأرشيف
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  <span data-testid="text-archived-count">المهام المؤرشفة ({tasks.length})</span>
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {selectedTasks.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={deleteSelectedMutation.isPending}
                    data-testid="button-delete-selected"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف المحدد ({selectedTasks.size})
                  </Button>
                )}
                {tasks.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAllArchivedMutation.mutate()}
                    disabled={deleteAllArchivedMutation.isPending}
                    data-testid="button-delete-all"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف الكل
                  </Button>
                )}
              </div>
            </div>
          </MotionSection>

          <MotionSection delay={0.2}>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
              </div>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Archive className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد مهام مؤرشفة</h3>
                  <p className="text-muted-foreground text-center">
                    لم يتم أرشفة أي مهام بعد
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTasks.size === tasks.length && tasks.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                    <CardTitle className="text-base">تحديد الكل</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasks.map((task) => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedTasks.has(task.id)}
                            onCheckedChange={() => handleSelectTask(task.id)}
                            data-testid={`checkbox-task-${task.id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base mb-1" data-testid={`text-task-title-${task.id}`}>
                                  {task.title}
                                </h3>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-task-description-${task.id}`}>
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <Badge variant={getPriorityColor(task.priority) as any} data-testid={`badge-priority-${task.id}`}>
                                {getPriorityLabel(task.priority)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                              <span data-testid={`text-created-for-${task.id}`}>أنشئت لـ: {getUserName(task.createdFor)}</span>
                              {task.assignedTo && <span data-testid={`text-assigned-to-${task.id}`}>• مسندة لـ: {getUserName(task.assignedTo)}</span>}
                              {getCompanyName(task.companyId) && (
                                <span data-testid={`text-company-${task.id}`}>• الشركة: {getCompanyName(task.companyId)}</span>
                              )}
                              {task.archivedAt && (
                                <span data-testid={`text-archived-at-${task.id}`}>• تم الأرشفة: {formatArabicDate(new Date(task.archivedAt))}</span>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => unarchiveTaskMutation.mutate(task.id)}
                                disabled={unarchiveTaskMutation.isPending}
                                data-testid={`button-unarchive-${task.id}`}
                              >
                                <RotateCcw className="w-4 h-4 ml-2" />
                                استرجاع
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                                disabled={deleteTaskMutation.isPending}
                                data-testid={`button-delete-${task.id}`}
                              >
                                <Trash2 className="w-4 h-4 ml-2" />
                                حذف
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
          </MotionSection>
        </main>
      </div>
    </MotionPageShell>
  );
}
