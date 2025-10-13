import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Building2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { Task } from "@shared/schema";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const [rewardPoints, setRewardPoints] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const updateTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; status: string }) => {
      console.log(`Attempting to update task ${data.taskId} to status ${data.status}`);
      const res = await apiRequest("PUT", `/api/tasks/${data.taskId}`, { status: data.status });
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Task updated successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      toast({
        title: "تم تحديث المهمة",
        description: "تم تغيير حالة المهمة بنجاح",
      });
    },
    onError: (error: any) => {
      console.error("Error updating task:", error);
      toast({
        title: "خطأ في تحديث المهمة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const approveTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      console.log(`Attempting to approve task ${taskId}`);
      const res = await apiRequest("PUT", `/api/tasks/${taskId}/approve-review`, {});
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Task approved successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      toast({
        title: "تمت الموافقة على المهمة",
        description: "تم إكمال المهمة بنجاح",
      });
    },
    onError: (error: any) => {
      console.error("Error approving task:", error);
      toast({
        title: "خطأ في الموافقة على المهمة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      console.log(`Attempting to delete task ${taskId}`);
      const res = await apiRequest("DELETE", `/api/tasks/${taskId}`);
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Task deleted successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      toast({
        title: "تم حذف المهمة",
        description: "تم حذف المهمة بنجاح",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting task:", error);
      toast({
        title: "خطأ في حذف المهمة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const assignPointsMutation = useMutation({
    mutationFn: async (data: { taskId: string; rewardPoints: number }) => {
      console.log(`Attempting to assign ${data.rewardPoints} points to task ${data.taskId}`);
      const res = await apiRequest("PUT", `/api/tasks/${data.taskId}/assign-points`, { rewardPoints: data.rewardPoints });
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Points assigned successfully:", data);
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
      console.error("Error assigning points:", error);
      toast({
        title: "خطأ في تعيين النقاط",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const handleMoveTask = (taskId: string, newStatus: string) => {
    if (!user) {
      console.error("No user authenticated");
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لتحديث المهمة",
        variant: "destructive",
      });
      return;
    }
    console.log(`User ${user.id} (role: ${user.role}) attempting to move task ${taskId} to ${newStatus}`);
    updateTaskMutation.mutate({ taskId, status: newStatus });
  };

  const handleApproveTask = (taskId: string) => {
    if (!user || user.role !== 'admin') {
      console.error("User is not authorized to approve tasks");
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
      console.error("Invalid points value:", rewardPoints);
      toast({
        title: "خطأ",
        description: "يرجى إدخال عدد صحيح من النقاط",
        variant: "destructive",
      });
      return;
    }
    if (assignPointsDialog.taskId) {
      assignPointsMutation.mutate({ taskId: assignPointsDialog.taskId, rewardPoints: points });
    } else {
      console.error("No task ID provided for assigning points");
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

  const TaskCard = ({ task }: { task: Task }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        layout: { duration: 0.3, type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group"
      data-testid={`task-card-${task.id}`}
    >
      <Card className="p-4 sm:p-3 cursor-pointer hover:shadow-lg transition-all border-border/50 hover:border-primary/30 min-h-[120px] touch-manipulation">
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
                {(task.createdBy === user?.id || user?.role === 'admin' || user?.role === 'sub-admin') && (
                  <DropdownMenuItem className="text-destructive" onClick={() => deleteTaskMutation.mutate(task.id)} data-testid={`menu-delete-task-${task.id}`}>
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف المهمة
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
              {new Date(task.dueDate).toLocaleDateString('ar')}
            </div>
          )}

          {task.assignedToUser && (
            <div className="flex items-center gap-2 mt-2" data-testid={`task-assignee-${task.id}`}>
              <Avatar className="h-7 w-7 sm:h-6 sm:w-6">
                <AvatarFallback className="text-xs">
                  {task.assignedToUser.fullName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm sm:text-xs text-muted-foreground truncate">
                {task.assignedToUser.fullName}
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );

  const KanbanColumn = ({ 
    title, 
    tasks, 
    icon, 
    color,
    testId 
  }: { 
    title: string; 
    tasks: Task[]; 
    icon: React.ReactNode; 
    color: string;
    testId: string;
  }) => (
    <motion.div 
      className="flex-1 min-w-[280px]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("h-full border-t-4", color)} data-testid={testId}>
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
        <CardContent className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto px-3 pb-4">
          <AnimatePresence mode="popLayout">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
                data-testid={`${testId}-empty`}
              >
                <div className="flex flex-col items-center gap-2">
                  {icon}
                  <p className="text-sm">لا توجد مهام</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );

  const MobileKanbanColumn = ({ 
    title, 
    tasks, 
    icon, 
    color,
    testId 
  }: { 
    title: string; 
    tasks: Task[]; 
    icon: React.ReactNode; 
    color: string;
    testId: string;
  }) => (
    <div className="w-full" data-testid={testId}>
      <Card className={cn("border-t-4", color)}>
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
        <CardContent className="space-y-3 px-3 pb-4">
          <AnimatePresence mode="popLayout">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
                data-testid={`${testId}-empty`}
              >
                <div className="flex flex-col items-center gap-2">
                  {icon}
                  <p className="text-sm">لا توجد مهام</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kanban-desktop-view">
        <KanbanColumn
          title="قيد الانتظار"
          tasks={pendingTasks}
          icon={<Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />}
          color="border-t-yellow-500"
          testId="kanban-column-pending"
        />
        <KanbanColumn
          title="قيد التنفيذ"
          tasks={inProgressTasks}
          icon={<AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-500" />}
          color="border-t-blue-500"
          testId="kanban-column-progress"
        />
        <KanbanColumn
          title="تحت المراجعة"
          tasks={underReviewTasks}
          icon={<Eye className="w-5 h-5 text-purple-600 dark:text-purple-500" />}
          color="border-t-purple-500"
          testId="kanban-column-review"
        />
        <KanbanColumn
          title="مكتمل"
          tasks={completedTasks}
          icon={<CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />}
          color="border-t-green-500"
          testId="kanban-column-completed"
        />
      </div>

      {/* Mobile View with Tabs */}
      <div className="md:hidden" data-testid="kanban-mobile-view">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1" data-testid="kanban-tabs-list">
            <TabsTrigger value="pending" className="text-xs sm:text-sm py-2" data-testid="tab-pending">
              <div className="flex flex-col items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">قيد الانتظار</span>
                <span className="sm:hidden">انتظار</span>
                <Badge variant="secondary" className="text-xs mt-1">{pendingTasks.length}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs sm:text-sm py-2" data-testid="tab-progress">
              <div className="flex flex-col items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">قيد التنفيذ</span>
                <span className="sm:hidden">تنفيذ</span>
                <Badge variant="secondary" className="text-xs mt-1">{inProgressTasks.length}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger value="review" className="text-xs sm:text-sm py-2" data-testid="tab-review">
              <div className="flex flex-col items-center gap-1">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">تحت المراجعة</span>
                <span className="sm:hidden">مراجعة</span>
                <Badge variant="secondary" className="text-xs mt-1">{underReviewTasks.length}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm py-2" data-testid="tab-completed">
              <div className="flex flex-col items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">مكتمل</span>
                <span className="sm:hidden">مكتمل</span>
                <Badge variant="secondary" className="text-xs mt-1">{completedTasks.length}</Badge>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-4" data-testid="tab-content-pending">
            <MobileKanbanColumn
              title="قيد الانتظار"
              tasks={pendingTasks}
              icon={<Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />}
              color="border-t-yellow-500"
              testId="kanban-mobile-pending"
            />
          </TabsContent>
          
          <TabsContent value="progress" className="mt-4" data-testid="tab-content-progress">
            <MobileKanbanColumn
              title="قيد التنفيذ"
              tasks={inProgressTasks}
              icon={<AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-500" />}
              color="border-t-blue-500"
              testId="kanban-mobile-progress"
            />
          </TabsContent>
          
          <TabsContent value="review" className="mt-4" data-testid="tab-content-review">
            <MobileKanbanColumn
              title="تحت المراجعة"
              tasks={underReviewTasks}
              icon={<Eye className="w-5 h-5 text-purple-600 dark:text-purple-500" />}
              color="border-t-purple-500"
              testId="kanban-mobile-review"
            />
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4" data-testid="tab-content-completed">
            <MobileKanbanColumn
              title="مكتمل"
              tasks={completedTasks}
              icon={<CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />}
              color="border-t-green-500"
              testId="kanban-mobile-completed"
            />
          </TabsContent>
        </Tabs>
      </div>

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
              onClick={() => setAssignPointsDialog({ open: false, taskId: null })}
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
