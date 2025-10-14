import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Building2,
  MessageSquare
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Task } from "@shared/schema";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatArabicDate } from "@/lib/arabic-date";

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
  const [commentsDialog, setCommentsDialog] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [rewardPoints, setRewardPoints] = useState("");
  const [commentText, setCommentText] = useState("");
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
    <div
      className="group transition-transform hover:-translate-y-1 duration-200"
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

          <div className="flex items-center justify-between mt-2">
            {task.assignedToUser && (
              <div className="flex items-center gap-2" data-testid={`task-assignee-${task.id}`}>
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
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1"
              onClick={() => setCommentsDialog({ open: true, taskId: task.id })}
              data-testid={`button-task-comments-${task.id}`}
            >
              <MessageSquare className="w-3 h-3" />
              <span className="text-xs">تعليقات</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
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
      {/* Unified Tabs View for All Devices */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-testid="kanban-tabs-view">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Clock className="w-12 h-12 text-yellow-600 dark:text-yellow-500" />
                  <p className="text-sm">لا توجد مهام في الانتظار</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="progress" className="mt-4" data-testid="tab-content-progress">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inProgressTasks.length > 0 ? (
              inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="w-12 h-12 text-blue-600 dark:text-blue-500" />
                  <p className="text-sm">لا توجد مهام قيد التنفيذ</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="review" className="mt-4" data-testid="tab-content-review">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {underReviewTasks.length > 0 ? (
              underReviewTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Eye className="w-12 h-12 text-purple-600 dark:text-purple-500" />
                  <p className="text-sm">لا توجد مهام تحت المراجعة</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4" data-testid="tab-content-completed">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-500" />
                  <p className="text-sm">لا توجد مهام مكتملة</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
      
      {/* Task Comments Dialog */}
      <Dialog open={commentsDialog.open} onOpenChange={(open) => setCommentsDialog({ open, taskId: null })} data-testid="dialog-task-comments">
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              تعليقات المهمة
            </DialogTitle>
            <DialogDescription>
              أضف تعليقات وملاحظات حول هذه المهمة
            </DialogDescription>
          </DialogHeader>
          {commentsDialog.taskId && (
            <TaskCommentsContent
              taskId={commentsDialog.taskId}
              commentText={commentText}
              setCommentText={setCommentText}
              onClose={() => {
                setCommentsDialog({ open: false, taskId: null });
                setCommentText("");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function TaskCommentsContent({ taskId, commentText, setCommentText, onClose }: {
  taskId: string;
  commentText: string;
  setCommentText: (text: string) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks", taskId, "comments"],
    enabled: !!taskId,
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

  const handleSubmit = () => {
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText.trim());
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-3 py-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center" data-testid="loading-comments">جاري التحميل...</p>
        ) : comments && comments.length > 0 ? (
          comments.map((comment: any, index: number) => (
            <div key={comment.id} className="p-3 bg-muted/50 rounded-lg" data-testid={`comment-${comment.id || index}`}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium" data-testid={`comment-author-${comment.id || index}`}>{comment.user?.fullName || "مستخدم"}</p>
                <p className="text-xs text-muted-foreground" data-testid={`comment-time-${comment.id || index}`}>
                  {formatArabicDate(comment.createdAt)}
                </p>
              </div>
              <p className="text-sm" data-testid={`comment-content-${comment.id || index}`}>{comment.content}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center" data-testid="no-comments">لا توجد تعليقات بعد</p>
        )}
      </div>
      <div className="space-y-3 pt-4 border-t">
        <Textarea
          placeholder="اكتب تعليقك هنا..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={3}
          className="resize-none"
          data-testid="textarea-task-comment"
        />
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!commentText.trim() || addCommentMutation.isPending}
            className="flex-1"
            data-testid="button-submit-comment"
          >
            {addCommentMutation.isPending ? "جاري الإضافة..." : "إضافة تعليق"}
          </Button>
          <Button variant="outline" onClick={onClose} data-testid="button-close-comments">
            إغلاق
          </Button>
        </div>
      </div>
    </>
  );
}
