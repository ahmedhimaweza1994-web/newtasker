import { useState } from "react";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import TaskKanban from "@/components/task-kanban";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionPageShell, MotionSection } from "@/components/ui/motion-wrappers";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, ListTodo, Zap, CheckCircle2, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Task, User } from "@shared/schema";
import { motion } from "framer-motion";

export default function TaskManagement() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
 
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: "",
    dueDate: "",
    companyName: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: user?.role === 'admin' || user?.role === 'sub-admin',
  });
  const { data: myTasks = [], isLoading: myTasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/my"],
    enabled: user?.role !== 'admin' && user?.role !== 'sub-admin',
  });
  const { data: assignedTasks = [], isLoading: assignedTasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/assigned"],
    enabled: user?.role !== 'admin' && user?.role !== 'sub-admin',
  });
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const isLoading = tasksLoading || myTasksLoading || assignedTasksLoading || usersLoading;

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const res = await apiRequest("POST", "/api/tasks", taskData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      setIsCreateDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        assignedTo: "",
        dueDate: "",
        companyName: "",
      });
      toast({
        title: "تم إنشاء المهمة بنجاح",
        description: "تمت إضافة المهمة الجديدة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إنشاء المهمة",
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
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
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

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData: any = {
      ...newTask,
      assignedTo: newTask.assignedTo || undefined,
      companyName: newTask.companyName || undefined,
    };
    
    if (newTask.dueDate) {
      taskData.dueDate = new Date(newTask.dueDate).toISOString();
    }
    
    createTaskMutation.mutate(taskData);
  };

  // Deduplicate tasks by ID (prevents duplicate display when user both creates and is assigned to same task)
  const allUserTasks = user?.role === 'admin' || user?.role === 'sub-admin' 
    ? tasks 
    : Array.from(new Map([...myTasks, ...assignedTasks].map(task => [task.id, task])).values());
  
  const filteredTasks = allUserTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesUser = userFilter === "all" ||
                        (userFilter === "my" && (task.createdBy === user?.id || task.assignedTo === user?.id)) ||
                        task.createdBy === userFilter ||
                        task.assignedTo === userFilter;
    const matchesDepartment = departmentFilter === "all" ||
                              (users.find(u => u.id === task.createdBy || u.id === task.assignedTo)?.department === departmentFilter);
    return matchesSearch && matchesStatus && matchesPriority && matchesUser && matchesDepartment;
  });

  const pendingTasks = filteredTasks.filter(task => task.status === 'pending');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'in_progress');
  const underReviewTasks = filteredTasks.filter(task => task.status === 'under_review');
  const completedTasks = filteredTasks.filter(task => task.status === 'completed');

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setUserFilter("all");
    setDepartmentFilter("all");
    toast({
      title: "تم إعادة تعيين الفلاتر",
      description: "تم مسح جميع الفلاتر",
    });
  };

  const departments = Array.from(new Set(users.map(user => user.department))).filter(dep => dep);

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
                  إدارة المهام
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  {user?.role === 'admin' || user?.role === 'sub-admin'
                    ? "تنظيم وتتبع جميع المهام لكل الموظفين"
                    : "تنظيم وتتبع جميع المهام الشخصية والجماعية"}
                </p>
              </div>
          
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="flex items-center gap-2 h-11 sm:h-10 w-full sm:w-auto" data-testid="button-create-task">
                      <Plus className="w-5 h-5" />
                      <span className="hidden sm:inline">إنشاء مهمة جديدة</span>
                      <span className="sm:hidden">إنشاء مهمة</span>
                    </Button>
                  </motion.div>
                </DialogTrigger>
            
                <DialogContent className="sm:max-w-[550px]" data-testid="dialog-create-task">
                  <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl">إنشاء مهمة جديدة</DialogTitle>
                  </DialogHeader>
              
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-title" className="text-sm sm:text-base font-medium">عنوان المهمة *</Label>
                      <Input
                        id="task-title"
                        placeholder="أدخل عنوان المهمة"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        required
                        data-testid="input-task-title"
                        className="text-base h-11 sm:h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-description" className="text-sm sm:text-base font-medium">الوصف</Label>
                      <Textarea
                        id="task-description"
                        placeholder="وصف تفصيلي للمهمة..."
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        rows={4}
                        data-testid="input-task-description"
                        className="text-base resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-company" className="text-sm sm:text-base font-medium">اسم الشركة</Label>
                      <Input
                        id="task-company"
                        placeholder="أدخل اسم الشركة (اختياري)"
                        value={newTask.companyName}
                        onChange={(e) => setNewTask({ ...newTask, companyName: e.target.value })}
                        data-testid="input-task-company"
                        className="text-base h-11 sm:h-10"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="task-priority" className="text-sm sm:text-base font-medium">الأولوية</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                        >
                          <SelectTrigger data-testid="select-task-priority" className="h-11 sm:h-10">
                            <SelectValue placeholder="اختر الأولوية" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">منخفض</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="high">عالي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="task-due-date" className="text-sm sm:text-base font-medium">موعد الاستحقاق</Label>
                        <Input
                          id="task-due-date"
                          type="datetime-local"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                          data-testid="input-task-due-date"
                          className="h-11 sm:h-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-assignee" className="text-sm sm:text-base font-medium">تعيين لـ</Label>
                      <Select
                        value={newTask.assignedTo}
                        onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}
                      >
                        <SelectTrigger data-testid="select-task-assignee" className="h-11 sm:h-10">
                          <SelectValue placeholder="اختر موظف (اختياري)" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.fullName} - {user.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={createTaskMutation.isPending}
                        data-testid="button-submit-task"
                        className="flex-1 h-11 sm:h-10"
                      >
                        {createTaskMutation.isPending ? "جاري الإنشاء..." : "إنشاء المهمة"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-task"
                        className="h-11 sm:h-10"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </MotionSection>

          <MotionSection delay={0.2}>
            <Card className="mb-6" data-testid="card-task-filters">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث في المهام..."
                        className="pr-10 h-11 sm:h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        data-testid="input-search-tasks"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] h-11 sm:h-10" data-testid="select-filter-status">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                      <SelectItem value="under_review">تحت المراجعة</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[140px] h-11 sm:h-10" data-testid="select-filter-priority">
                      <SelectValue placeholder="الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأولويات</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="low">منخفض</SelectItem>
                    </SelectContent>
                  </Select>
                  {(user?.role === 'admin' || user?.role === 'sub-admin') && (
                    <>
                      <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger className="w-[180px] h-11 sm:h-10" data-testid="select-filter-user">
                          <SelectValue placeholder="الموظف" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل الموظفين</SelectItem>
                          <SelectItem value="my">مهامي</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.fullName} - {user.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-[140px] h-11 sm:h-10" data-testid="select-filter-department">
                          <SelectValue placeholder="القسم" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل الأقسام</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={handleResetFilters} data-testid="button-reset-filters" className="h-11 sm:h-10">
                    <Filter className="w-4 h-4 ml-2" />
                    إعادة تعيين
                  </Button>
                </div>
              </CardContent>
            </Card>
          </MotionSection>

          <MotionSection delay={0.3}>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-5 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <Card className="hover:shadow-lg transition-shadow" data-testid="card-pending-tasks-count">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        قيد الانتظار
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <motion.div 
                        className="text-2xl font-bold text-yellow-600 dark:text-yellow-500"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                      >
                        {pendingTasks.length}
                      </motion.div>
                      <p className="text-xs text-muted-foreground mt-1">مهمة في الانتظار</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <Card className="hover:shadow-lg transition-shadow" data-testid="card-progress-tasks-count">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        قيد التنفيذ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <motion.div 
                        className="text-2xl font-bold text-blue-600 dark:text-blue-500"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                      >
                        {inProgressTasks.length}
                      </motion.div>
                      <p className="text-xs text-muted-foreground mt-1">مهمة قيد التنفيذ</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <Card className="hover:shadow-lg transition-shadow" data-testid="card-review-tasks-count">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        تحت المراجعة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <motion.div 
                        className="text-2xl font-bold text-purple-600 dark:text-purple-500"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
                      >
                        {underReviewTasks.length}
                      </motion.div>
                      <p className="text-xs text-muted-foreground mt-1">مهمة تحت المراجعة</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <Card className="hover:shadow-lg transition-shadow" data-testid="card-completed-tasks-count">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        مكتمل
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <motion.div 
                        className="text-2xl font-bold text-green-600 dark:text-green-500"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.7 }}
                      >
                        {completedTasks.length}
                      </motion.div>
                      <p className="text-xs text-muted-foreground mt-1">مهمة مكتملة</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </MotionSection>

          <MotionSection delay={0.4}>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <TaskKanban
                pendingTasks={pendingTasks}
                inProgressTasks={inProgressTasks}
                underReviewTasks={underReviewTasks}
                completedTasks={completedTasks}
              />
            )}
          </MotionSection>
        </main>
      </div>
    </MotionPageShell>
  );
}
