import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  MessageSquare,
  Edit,
  User,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Task, User as UserType } from "@shared/schema";
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

  const updateTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/tasks/${data.taskId}`, { status: data.status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
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

  const approveTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest("PUT", `/api/tasks/${taskId}/approve-review`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
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
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: task.id,
    });

    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      opacity: isDragging ? 0.5 : 1,
    } : undefined;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group transition-transform hover:-translate-y-1 duration-200"
        data-testid={`task-card-${task.id}`}
        {...attributes}
      >
        <div {...listeners} className="cursor-grab active:cursor-grabbing">
          <Card className="p-4 sm:p-3 hover:shadow-lg transition-all border-border/50 hover:border-primary/30 min-h-[140px] touch-manipulation">
        <div className="space-y-3 sm:space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base sm:text-sm truncate" data-testid={`task-title-${task.id}`}>
                {task.title}
              </h4>
              {task.companyName && (
                <p className="text-sm sm:text-xs text-muted-foreground mt-1 flex items-center gap-1" data-testid={`task-company-${task.id}`}>
                  <Building2 className="w-4 h-4 sm:w-3 sm:h-3" />
                  {task.companyName}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 sm:h-7 sm:w-7 p-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setTaskDetailsDialog({ open: true, taskId: task.id })}
                data-testid={`button-view-task-${task.id}`}
              >
                <Eye className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 sm:h-7 sm:w-7 p-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity" 
                    data-testid={`button-task-menu-${task.id}`}
                  >
                    <MoreHorizontal className="w-5 h-5 sm:w-4 sm:h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
                    <>
                      {user?.role === 'admin' && (
                        <DropdownMenuItem onClick={() => handleApproveTask(task.id)} data-testid={`menu-approve-task-${task.id}`}>
                          <CheckCircle className="w-4 h-4 ml-2" />
                          الموافقة والإكمال
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleMoveTask(task.id, 'in_progress')} data-testid={`menu-move-back-to-progress-${task.id}`}>
                        <ArrowRight className="w-4 h-4 ml-2" />
                        إرجاع لقيد التنفيذ
                      </DropdownMenuItem>
                    </>
                  )}
                  {task.status === 'completed' && user?.role === 'admin' && !task.rewardPoints && (
                    <DropdownMenuItem onClick={() => setAssignPointsDialog({ open: true, taskId: task.id })} data-testid={`menu-assign-points-${task.id}`}>
                      <Star className="w-4 h-4 ml-2" />
                      تعيين نقاط
                    </DropdownMenuItem>
                  )}
                  {(task.createdBy === user?.id || user?.role === 'admin' || user?.role === 'sub-admin') && (
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteTaskMutation.mutate(task.id)} data-testid={`menu-delete-task-${task.id}`}>
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف المهمة
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {task.description && (
            <p className="text-sm sm:text-xs text-muted-foreground line-clamp-2" data-testid={`task-description-${task.id}`}>
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-xs border", getPriorityColor(task.priority))} data-testid={`task-priority-${task.id}`}>
              {getPriorityLabel(task.priority)}
            </Badge>
            {task.rewardPoints && (
              <Badge variant="secondary" className="text-xs gap-1" data-testid={`task-points-${task.id}`}>
                <Trophy className="w-3 h-3" />
                {task.rewardPoints} نقطة
              </Badge>
            )}
          </div>

          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm sm:text-xs text-muted-foreground" data-testid={`task-due-date-${task.id}`}>
              <Calendar className="w-4 h-4 sm:w-3 sm:h-3" />
              {formatArabicDate(task.dueDate)}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            {task.createdByUser && (
              <div className="flex items-center gap-1" data-testid={`task-creator-${task.id}`}>
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {task.createdByUser.fullName}
                </span>
              </div>
            )}
            {task.assignedToUser && (
              <div className="flex items-center gap-1" data-testid={`task-assignee-${task.id}`}>
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {task.assignedToUser.fullName}
                </span>
              </div>
            )}
          </div>
          </div>
        </Card>
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
    testId 
  }: { 
    id: string;
    title: string; 
    tasks: Task[]; 
    icon: React.ReactNode; 
    color: string;
    testId: string;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id,
    });

    return (
      <div className="flex-1 min-w-[280px]" ref={setNodeRef}>
        <Card className={cn(
          "h-full border-t-4 transition-all", 
          color,
          isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
        )} data-testid={testId}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                {icon}
                <span>{title}</span>
              </div>
              <Badge variant="secondary" className="text-sm" data-testid={`${testId}-count`}>
                {tasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto px-3 pb-4">
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <DraggableTaskCard key={task.id} task={task} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid={`${testId}-empty`}>
                  <div className="flex flex-col items-center gap-2">
                    {icon}
                    <p className="text-sm">لا توجد مهام</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
        <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4" data-testid="kanban-board-trello-style">
          <DroppableColumn
            id="pending"
            title="قيد الانتظار"
            tasks={pendingTasks}
            icon={<Clock className="w-5 h-5 text-yellow-600" />}
            color="border-t-yellow-500"
            testId="column-pending"
          />
          <DroppableColumn
            id="in_progress"
            title="قيد التنفيذ"
            tasks={inProgressTasks}
            icon={<AlertCircle className="w-5 h-5 text-blue-600" />}
            color="border-t-blue-500"
            testId="column-in-progress"
          />
          <DroppableColumn
            id="under_review"
            title="تحت المراجعة"
            tasks={underReviewTasks}
            icon={<Eye className="w-5 h-5 text-purple-600" />}
            color="border-t-purple-500"
            testId="column-under-review"
          />
          <DroppableColumn
            id="completed"
            title="مكتمل"
            tasks={completedTasks}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            color="border-t-green-500"
            testId="column-completed"
          />
        </div>

        <DragOverlay>
          {activeTask ? (
            <Card className="p-4 sm:p-3 shadow-2xl opacity-90">
              <div className="font-semibold">{activeTask.title}</div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {taskDetailsDialog.taskId && (
        <TaskDetailsDialog
          taskId={taskDetailsDialog.taskId}
          open={taskDetailsDialog.open}
          onOpenChange={(open) => {
            setTaskDetailsDialog({ open, taskId: null });
            setEditMode(false);
          }}
          editMode={editMode}
          setEditMode={setEditMode}
          users={users}
          onDelete={() => deleteTaskMutation.mutate(taskDetailsDialog.taskId!)}
        />
      )}

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

function TaskDetailsDialog({ 
  taskId, 
  open, 
  onOpenChange, 
  editMode, 
  setEditMode, 
  users,
  onDelete 
}: {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  users: UserType[];
  onDelete: () => void;
}) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ["/api/tasks", taskId],
    enabled: !!taskId,
  });

  const { data: comments = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks", taskId, "comments"],
    enabled: !!taskId,
  });

  const [editedTask, setEditedTask] = useState<any>({});
  const [commentText, setCommentText] = useState("");

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiRequest("PUT", `/api/tasks/${taskId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      setEditMode(false);
      toast({
        title: "تم تحديث المهمة",
        description: "تم حفظ التغييرات بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (text: string) =>
      apiRequest("POST", `/api/tasks/${taskId}/comments`, { content: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "comments"] });
      setCommentText("");
      toast({
        title: "تم إضافة التعليق",
        description: "تمت إضافة التعليق بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إضافة التعليق",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جاري التحميل...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSaveEdit = () => {
    const updates: any = {
      ...editedTask,
    };
    
    if (editedTask.dueDate) {
      updates.dueDate = new Date(editedTask.dueDate).toISOString();
    }
    
    updateTaskMutation.mutate(updates);
  };

  const handleStartEdit = () => {
    setEditedTask({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      assignedTo: task.assignedTo || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      companyName: task.companyName || "",
    });
    setEditMode(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "medium": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "low": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      default: return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "قيد الانتظار";
      case "in_progress": return "قيد التنفيذ";
      case "under_review": return "تحت المراجعة";
      case "completed": return "مكتمل";
      default: return status;
    }
  };

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'sub-admin' || task.createdBy === currentUser?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" data-testid="dialog-task-details">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <span>{editMode ? "تعديل المهمة" : "تفاصيل المهمة"}</span>
            </div>
            {!editMode && canEdit && (
              <Button variant="outline" size="sm" onClick={handleStartEdit} data-testid="button-edit-task">
                <Edit className="w-4 h-4 ml-2" />
                تعديل
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {editMode ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-title">عنوان المهمة *</Label>
                <Input
                  id="edit-title"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  data-testid="input-edit-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">الوصف</Label>
                <Textarea
                  id="edit-description"
                  value={editedTask.description}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  rows={4}
                  data-testid="textarea-edit-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">الأولوية</Label>
                  <Select value={editedTask.priority} onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}>
                    <SelectTrigger id="edit-priority" data-testid="select-edit-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-assignee">المعين إليه</Label>
                  <Select value={editedTask.assignedTo} onValueChange={(value) => setEditedTask({ ...editedTask, assignedTo: value })}>
                    <SelectTrigger id="edit-assignee" data-testid="select-edit-assignee">
                      <SelectValue placeholder="اختر موظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-due-date">تاريخ الاستحقاق</Label>
                  <Input
                    id="edit-due-date"
                    type="date"
                    value={editedTask.dueDate}
                    onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                    data-testid="input-edit-due-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-company">اسم الشركة</Label>
                  <Input
                    id="edit-company"
                    value={editedTask.companyName}
                    onChange={(e) => setEditedTask({ ...editedTask, companyName: e.target.value })}
                    data-testid="input-edit-company"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveEdit} disabled={updateTaskMutation.isPending} className="flex-1" data-testid="button-save-edit">
                  {updateTaskMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)} data-testid="button-cancel-edit">
                  إلغاء
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-2xl font-bold mb-2" data-testid="text-task-title">{task.title}</h3>
                {task.description && (
                  <p className="text-muted-foreground" data-testid="text-task-description">{task.description}</p>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <p className="font-medium mt-1" data-testid="text-task-status">{getStatusLabel(task.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الأولوية</Label>
                  <Badge className={cn("mt-1", getPriorityColor(task.priority))} data-testid="badge-task-priority">
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <User className="w-4 h-4" />
                    منشئ المهمة
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{task.createdByUser?.fullName[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium" data-testid="text-task-creator">{task.createdByUser?.fullName}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    المعين إليه
                  </Label>
                  {task.assignedToUser ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{task.assignedToUser.fullName[0]}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium" data-testid="text-task-assignee">{task.assignedToUser.fullName}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground mt-2" data-testid="text-no-assignee">غير معين</p>
                  )}
                </div>
              </div>

              {(task.dueDate || task.companyName) && (
                <div className="grid grid-cols-2 gap-4">
                  {task.dueDate && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        تاريخ الاستحقاق
                      </Label>
                      <p className="font-medium mt-1" data-testid="text-task-due-date">{formatArabicDate(task.dueDate)}</p>
                    </div>
                  )}
                  {task.companyName && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        اسم الشركة
                      </Label>
                      <p className="font-medium mt-1" data-testid="text-task-company">{task.companyName}</p>
                    </div>
                  )}
                </div>
              )}

              {task.rewardPoints && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    نقاط المكافأة
                  </Label>
                  <p className="font-medium mt-1 flex items-center gap-2" data-testid="text-task-reward">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    {task.rewardPoints} نقطة
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    التعليقات ({comments.length})
                  </Label>
                </div>

                <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4">
                  {comments.length > 0 ? (
                    comments.map((comment: any, index: number) => (
                      <div key={comment.id} className="p-3 bg-muted/50 rounded-lg" data-testid={`comment-${comment.id || index}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{comment.user?.fullName[0]}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">{comment.user?.fullName || "مستخدم"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatArabicDate(comment.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4" data-testid="no-comments">لا توجد تعليقات بعد</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder="اكتب تعليقك هنا..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    className="resize-none"
                    data-testid="textarea-task-comment"
                  />
                  <Button
                    onClick={() => commentText.trim() && addCommentMutation.mutate(commentText.trim())}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    className="w-full"
                    data-testid="button-add-comment"
                  >
                    {addCommentMutation.isPending ? "جاري الإضافة..." : "إضافة تعليق"}
                  </Button>
                </div>
              </div>

              {canEdit && (
                <>
                  <Separator />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={onDelete}
                    data-testid="button-delete-task-details"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف المهمة
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
