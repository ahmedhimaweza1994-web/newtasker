import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskDetailsDialog } from "@/components/task-details-dialog";
import {
  MoreHorizontal,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  Trophy,
  Star,
  Trash2,
  ArrowRight,
  Eye,
  Building2,
  Archive
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Task, User as UserType, SelectCompany } from "@shared/schema";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatArabicDate } from "@/lib/arabic-date";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

interface TaskKanbanProps {
  pendingTasks: Task[];
  inProgressTasks: Task[];
  underReviewTasks: Task[];
  completedTasks: Task[];
}

export default function TaskKanban({ pendingTasks, inProgressTasks, underReviewTasks, completedTasks }: TaskKanbanProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [assignPointsDialog, setAssignPointsDialog] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [taskDetailsDialog, setTaskDetailsDialog] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [editMode, setEditMode] = useState(false);
  const [rewardPoints, setRewardPoints] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: companies = [] } = useQuery<SelectCompany[]>({
    queryKey: ["/api/companies"],
  });

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return null;
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : null;
  };

  const updateTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/tasks/${data.taskId}`, { status: data.status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "تم تحديث المهمة",
        description: "تم تغيير حالة المهمة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث المهمة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const archiveCompletedTasksMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tasks/archive-completed", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "تم أرشفة المهام",
        description: "تم نقل جميع المهام المكتملة إلى الأرشيف",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الأرشفة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const approveTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest("PUT", `/api/tasks/${taskId}/approve-review`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "تمت الموافقة على المهمة",
        description: "تم إكمال المهمة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الموافقة على المهمة",
        description: error.message || "حدث خطأ غير متوقع",
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
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setTaskDetailsDialog({ open: false, taskId: null });
      toast({
        title: "تم حذف المهمة",
        description: "تم حذف المهمة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف المهمة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const assignPointsMutation = useMutation({
    mutationFn: async (data: { taskId: string; rewardPoints: number }) => {
      const res = await apiRequest("PUT", `/api/tasks/${data.taskId}/assign-points`, { rewardPoints: data.rewardPoints });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setAssignPointsDialog({ open: false, taskId: null });
      setRewardPoints("");
      toast({
        title: "تم تعيين النقاط بنجاح",
        description: "تمت إضافة نقاط المكافأة للمهمة والموظف",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تعيين النقاط",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const handleMoveTask = (taskId: string, newStatus: string) => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لتحديث المهمة",
        variant: "destructive",
      });
      return;
    }
    updateTaskMutation.mutate({ taskId, status: newStatus });
  };

  const handleApproveTask = (taskId: string) => {
    if (!user || user.role !== 'admin') {
      toast({
        title: "غير مصرح",
        description: "فقط المسؤول يمكنه الموافقة على المهام",
        variant: "destructive",
      });
      return;
    }
    approveTaskMutation.mutate(taskId);
  };

  const handleAssignPoints = () => {
    const points = parseInt(rewardPoints);
    if (isNaN(points) || points <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عدد صحيح من النقاط",
        variant: "destructive",
      });
      return;
    }
    if (assignPointsDialog.taskId) {
      assignPointsMutation.mutate({ taskId: assignPointsDialog.taskId, rewardPoints: points });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    const allTasks = [...pendingTasks, ...inProgressTasks, ...underReviewTasks, ...completedTasks];
    const task = allTasks.find(t => t.id === taskId);

    if (task && task.status !== newStatus) {
      handleMoveTask(taskId, newStatus);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "عالي";
      case "medium": return "متوسط";
      case "low": return "منخفض";
      default: return priority;
    }
  };

  const DraggableTaskCard = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
      id: task.id,
    });

    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      opacity: isDragging ? 0.5 : 1,
    } : undefined;

    const truncateText = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group"
        data-testid={`task-card-${task.id}`}
        {...attributes}
      >
        <div {...listeners} className="cursor-grab active:cursor-grabbing">
          <div className="glass-panel p-3 hover:neon-edge-green hover-lift transition-all duration-200">
            <div className="space-y-2">
              {/* Title with Menu */}
              <div className="flex items-start gap-2">
                <h4 
                  className="font-medium text-sm leading-snug flex-1 cursor-pointer group-hover:text-primary transition-colors"
                  title={task.title}
                  onClick={() => setTaskDetailsDialog({ open: true, taskId: task.id })}
                  data-testid={`task-title-${task.id}`}
                >
                  {truncateText(task.title, 60)}
                </h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" 
                      data-testid={`button-task-menu-${task.id}`}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {/* View Group */}
                    <DropdownMenuLabel>العرض</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setTaskDetailsDialog({ open: true, taskId: task.id })} data-testid={`menu-view-task-${task.id}`}>
                      <Eye className="w-4 h-4 ml-2" />
                      عرض التفاصيل
                    </DropdownMenuItem>

                    {/* Move Actions Group */}
                    {(task.status === 'pending' || task.status === 'in_progress' || task.status === 'under_review') && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>نقل المهمة</DropdownMenuLabel>
                        {task.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleMoveTask(task.id, 'in_progress')} data-testid={`menu-move-to-progress-${task.id}`}>
                            <ArrowRight className="w-4 h-4 ml-2" />
                            نقل إلى قيد التنفيذ
                          </DropdownMenuItem>
                        )}
                        {task.status === 'in_progress' && (
                          <>
                            <DropdownMenuItem onClick={() => handleMoveTask(task.id, 'under_review')} data-testid={`menu-move-to-review-${task.id}`}>
                              <ArrowRight className="w-4 h-4 ml-2" />
                              نقل للمراجعة
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMoveTask(task.id, 'pending')} data-testid={`menu-move-to-pending-${task.id}`}>
                              <ArrowRight className="w-4 h-4 ml-2" />
                              إرجاع للانتظار
                            </DropdownMenuItem>
                          </>
                        )}
                        {task.status === 'under_review' && (
                          <DropdownMenuItem onClick={() => handleMoveTask(task.id, 'in_progress')} data-testid={`menu-move-back-to-progress-${task.id}`}>
                            <ArrowRight className="w-4 h-4 ml-2" />
                            إرجاع لقيد التنفيذ
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {/* Admin Actions Group */}
                    {((task.status === 'under_review' && user?.role === 'admin') || (task.status === 'completed' && user?.role === 'admin' && !task.rewardPoints)) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>إجراءات الإدارة</DropdownMenuLabel>
                        {task.status === 'under_review' && user?.role === 'admin' && (
                          <DropdownMenuItem onClick={() => handleApproveTask(task.id)} data-testid={`menu-approve-task-${task.id}`}>
                            <CheckCircle className="w-4 h-4 ml-2" />
                            الموافقة والإكمال
                          </DropdownMenuItem>
                        )}
                        {task.status === 'completed' && user?.role === 'admin' && !task.rewardPoints && (
                          <DropdownMenuItem onClick={() => setAssignPointsDialog({ open: true, taskId: task.id })} data-testid={`menu-assign-points-${task.id}`}>
                            <Star className="w-4 h-4 ml-2" />
                            تعيين نقاط
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {/* Delete Group */}
                    {(task.createdBy === user?.id || user?.role === 'admin' || user?.role === 'sub-admin') && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteTaskMutation.mutate(task.id)} data-testid={`menu-delete-task-${task.id}`}>
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف المهمة
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Description */}
              {task.description && (
                <p 
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                  title={task.description}
                  onClick={() => setTaskDetailsDialog({ open: true, taskId: task.id })}
                  data-testid={`task-description-${task.id}`}
                >
                  {truncateText(task.description, 80)}
                </p>
              )}

              {/* Labels Row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className={cn("text-xs border px-1.5 py-0", getPriorityColor(task.priority))} data-testid={`task-priority-${task.id}`}>
                  {getPriorityLabel(task.priority)}
                </Badge>
                {task.rewardPoints && (
                  <Badge variant="secondary" className="text-xs gap-0.5 px-1.5 py-0" data-testid={`task-points-${task.id}`}>
                    <Trophy className="w-3 h-3" />
                    {task.rewardPoints}
                  </Badge>
                )}
                {task.companyId && getCompanyName(task.companyId) && (
                  <Badge variant="outline" className="text-xs gap-0.5 px-1.5 py-0" title={getCompanyName(task.companyId) || ''} data-testid={`task-company-${task.id}`}>
                    <Building2 className="w-3 h-3" />
                    {truncateText(getCompanyName(task.companyId) || '', 12)}
                  </Badge>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {task.dueDate ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`task-due-date-${task.id}`}>
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{formatArabicDate(task.dueDate)}</span>
                  </div>
                ) : (
                  <div className="flex-1"></div>
                )}

                {/* Avatar */}
                {((task as any).createdForUser || task.assignedToUser) && (
                  <div className="flex items-center gap-1">
                    {(task as any).createdForUser && (
                      <Avatar className="h-6 w-6" title={(task as any).createdForUser.fullName} data-testid={`task-created-for-${task.id}`}>
                        <AvatarImage 
                          src={(task as any).createdForUser.profilePicture || undefined} 
                          alt={(task as any).createdForUser.fullName}
                        />
                        <AvatarFallback className="text-xs">{(task as any).createdForUser.fullName?.[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    {task.assignedToUser && (
                      <Avatar className="h-6 w-6 -ml-2" title={task.assignedToUser.fullName} data-testid={`task-assignee-${task.id}`}>
                        <AvatarImage 
                          src={task.assignedToUser.profilePicture || undefined} 
                          alt={task.assignedToUser.fullName}
                        />
                        <AvatarFallback className="text-xs">{task.assignedToUser.fullName?.[0]}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DroppableColumn = ({ 
    id,
    title, 
    tasks, 
    icon, 
    color,
    testId,
    actions 
  }: { 
    id: string;
    title: string; 
    tasks: Task[]; 
    icon: React.ReactNode; 
    color: string;
    testId: string;
    actions?: React.ReactNode;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id,
    });

    return (
      <div className="w-full xl:flex-shrink-0 xl:w-[280px] 2xl:w-[300px]" ref={setNodeRef}>
        <div className={cn(
          "rounded-xl bg-muted/30 p-2.5 h-full flex flex-col",
          isOver && "ring-2 ring-primary bg-primary/5"
        )} data-testid={testId}>
          <div className="flex items-center gap-2 mb-2.5 px-1.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {icon}
              <h3 className="font-semibold text-sm truncate">{title}</h3>
            </div>
            <Badge variant="secondary" className="text-xs h-5 px-2 flex-shrink-0" data-testid={`${testId}-count`}>
              {tasks.length}
            </Badge>
            {actions}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1" style={{ maxHeight: 'calc(80vh - 120px)' }} data-max-height="responsive-column">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <DraggableTaskCard key={task.id} task={task} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground" data-testid={`${testId}-empty`}>
                <div className="flex flex-col items-center gap-2 opacity-40">
                  {icon}
                  <p className="text-sm">لا توجد مهام</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const allTasks = [...pendingTasks, ...inProgressTasks, ...underReviewTasks, ...completedTasks];
  const activeTask = activeTaskId ? allTasks.find(t => t.id === activeTaskId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Responsive Kanban View - 2x2 grid on small/medium/large, horizontal on xl */}
        <div className="w-full pb-4" data-testid="kanban-board-trello-style">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-row gap-3 px-1">
            <DroppableColumn
              id="pending"
              title="قيد الانتظار"
              tasks={pendingTasks}
              icon={<Clock className="w-4 h-4 text-yellow-600" />}
              color="border-t-yellow-500"
              testId="column-pending"
            />
            <DroppableColumn
              id="in_progress"
              title="قيد التنفيذ"
              tasks={inProgressTasks}
              icon={<AlertCircle className="w-4 h-4 text-blue-600" />}
              color="border-t-blue-500"
              testId="column-in-progress"
            />
            <DroppableColumn
              id="under_review"
              title="تحت المراجعة"
              tasks={underReviewTasks}
              icon={<Eye className="w-4 h-4 text-purple-600" />}
              color="border-t-purple-500"
              testId="column-under-review"
            />
            <DroppableColumn
              id="completed"
              title="مكتمل"
              tasks={completedTasks}
              icon={<CheckCircle className="w-4 h-4 text-green-600" />}
              color="border-t-green-500"
              testId="column-completed"
              actions={
                completedTasks.length > 0 && (user?.role === 'admin' || user?.role === 'sub-admin') ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => archiveCompletedTasksMutation.mutate()}
                    disabled={archiveCompletedTasksMutation.isPending}
                    data-testid="button-archive-completed"
                    title="أرشفة جميع المهام المكتملة"
                  >
                    <Archive className="h-3 w-3" />
                  </Button>
                ) : null
              }
            />
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <Card className="p-3 shadow-2xl opacity-90 w-64">
              <div className="font-medium text-sm line-clamp-1 truncate">{activeTask.title}</div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailsDialog
        taskId={taskDetailsDialog.taskId}
        open={taskDetailsDialog.open}
        onOpenChange={(open) => {
          setTaskDetailsDialog({ open, taskId: open ? taskDetailsDialog.taskId : null });
          if (!open) {
            setEditMode(false);
          }
        }}
        editMode={editMode}
        setEditMode={setEditMode}
        users={users}
        companies={companies}
        getCompanyName={getCompanyName}
        onDelete={() => {
          if (taskDetailsDialog.taskId) {
            deleteTaskMutation.mutate(taskDetailsDialog.taskId);
          }
        }}
      />

      <Dialog open={assignPointsDialog.open} onOpenChange={(open) => setAssignPointsDialog({ open, taskId: null })} data-testid="dialog-assign-points">
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              تعيين نقاط المكافأة
            </DialogTitle>
            <DialogDescription>
              أدخل عدد النقاط التي تريد منحها للموظف عند إكمال هذه المهمة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reward-points" className="text-sm sm:text-base font-medium">
                عدد النقاط
              </Label>
              <Input
                id="reward-points"
                type="number"
                min="1"
                placeholder="مثال: 10"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(e.target.value)}
                className="text-base h-11 sm:h-10"
                data-testid="input-reward-points"
              />
              <p className="text-xs text-muted-foreground">
                سيتم إضافة هذه النقاط إلى رصيد الموظف المكلف بالمهمة
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleAssignPoints} 
              disabled={!rewardPoints || assignPointsMutation.isPending} 
              className="flex-1 h-11 sm:h-10"
              data-testid="button-confirm-points"
            >
              {assignPointsMutation.isPending ? "جاري التعيين..." : "تعيين النقاط"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setAssignPointsDialog({ open, taskId: null })}
              className="h-11 sm:h-10"
              data-testid="button-cancel-points"
            >
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

