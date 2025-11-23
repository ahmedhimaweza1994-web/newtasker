import { useState, useMemo } from "react";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { TaskDetailsDialog } from "@/components/task-details-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionPageShell, MotionSection } from "@/components/ui/motion-wrappers";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, ListTodo, Clock, X, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, User, SelectCompany } from "@shared/schema";
import { motion } from "framer-motion";
import { formatArabicDate } from "@/lib/arabic-date";

export default function TaskManagement() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
 
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [taskDetailsDialog, setTaskDetailsDialog] = useState<{ open: boolean; taskId: string | null }>({ open: false, taskId: null });
  const [editMode, setEditMode] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    createdFor: "",
    assignedTo: "",
    dueDate: "",
    companyId: "",
  });
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; type: string }>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

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
  const { data: companies = [], isLoading: companiesLoading } = useQuery<SelectCompany[]>({
    queryKey: ["/api/companies"],
  });

  const isLoading = tasksLoading || myTasksLoading || assignedTasksLoading || usersLoading || companiesLoading;

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const res = await apiRequest("POST", "/api/tasks", taskData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsCreateDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        createdFor: "",
        assignedTo: "",
        dueDate: "",
        companyId: "",
      });
      setAttachments([]);
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

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.createdFor) {
      toast({
        title: "خطأ",
        description: "يجب تحديد الموظف الذي تم إنشاء المهمة له",
        variant: "destructive",
      });
      return;
    }
    
    const taskData: any = {
      ...newTask,
      createdFor: newTask.createdFor,
      assignedTo: newTask.assignedTo || undefined,
      companyId: newTask.companyId || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    
    if (newTask.dueDate) {
      taskData.dueDate = new Date(newTask.dueDate).toISOString();
    }
    
    createTaskMutation.mutate(taskData);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Type-safe helper functions to handle tasks with nested user objects
  // The backend returns tasks with nested user objects instead of just UUIDs
  type TaskUserRef = { id: string; department?: string | null } | string | null | undefined;
  
  const getTaskUserId = (userField: TaskUserRef): string | null => {
    if (!userField) return null;
    // If it's a nested user object with id, return the id
    if (typeof userField === 'object' && 'id' in userField) return userField.id;
    // If it's a legacy string ID, return it directly
    if (typeof userField === 'string') return userField;
    return null;
  };

  const getTaskUserDepartment = (userField: TaskUserRef): string | null => {
    if (!userField) return null;
    // Only objects can have department property
    if (typeof userField === 'object' && 'department' in userField && userField.department) {
      return userField.department;
    }
    return null;
  };
  
  // Deduplicate tasks by ID (prevents duplicate display when user both creates and is assigned to same task)
  const allUserTasks = user?.role === 'admin' || user?.role === 'sub-admin' 
    ? tasks 
    : Array.from(new Map([...myTasks, ...assignedTasks].map(task => [task.id, task])).values());
  
  // Get active (non-archived) tasks for counting
  const activeTasks = allUserTasks.filter(task => task.status !== 'archived');
  
  const filteredTasks = allUserTasks.filter(task => {
    // Exclude archived tasks from main view
    if (task.status === 'archived') return false;
    
    const companyName = task.companyId ? companies.find(c => c.id === task.companyId)?.name || "" : "";
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    // User filter with proper null safety - uses helper to extract user IDs from nested objects
    const createdById = getTaskUserId(task.createdBy);
    const assignedToId = getTaskUserId(task.assignedTo);
    const createdForId = getTaskUserId(task.createdFor);
    
    const matchesUser = userFilter === "all" ||
                        (userFilter === "my" && (
                          createdById === user?.id || 
                          assignedToId === user?.id || 
                          createdForId === user?.id
                        )) ||
                        createdById === userFilter ||
                        assignedToId === userFilter ||
                        createdForId === userFilter;
    
    // Department filter with proper null safety - uses helper to extract departments
    const matchesDepartment = departmentFilter === "all" || (() => {
      const createdByDept = getTaskUserDepartment(task.createdBy);
      const assignedToDept = getTaskUserDepartment(task.assignedTo);
      const createdForDept = getTaskUserDepartment(task.createdFor);
      
      // Check if any of the users involved in the task belong to the selected department
      return createdByDept === departmentFilter ||
             assignedToDept === departmentFilter ||
             createdForDept === departmentFilter;
    })();
    
    const matchesCompany = companyFilter === "all" || task.companyId === companyFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesUser && matchesDepartment && matchesCompany;
  });

  const pendingTasks = filteredTasks.filter(task => task.status === 'pending');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'in_progress');
  const underReviewTasks = filteredTasks.filter(task => task.status === 'under_review');
  const completedTasks = filteredTasks.filter(task => task.status === 'completed');

  // Extract departments for filters
  const departments = Array.from(new Set(users.map(user => user.department))).filter(dep => dep);

  // Calculate task counts for all filter options
  const filterCounts = useMemo(() => {
    const counts = {
      status: {
        pending: activeTasks.filter(t => t.status === 'pending').length,
        in_progress: activeTasks.filter(t => t.status === 'in_progress').length,
        under_review: activeTasks.filter(t => t.status === 'under_review').length,
        completed: activeTasks.filter(t => t.status === 'completed').length,
      },
      priority: {
        high: activeTasks.filter(t => t.priority === 'high').length,
        medium: activeTasks.filter(t => t.priority === 'medium').length,
        low: activeTasks.filter(t => t.priority === 'low').length,
      },
      department: {} as Record<string, number>,
      company: {} as Record<string, number>,
    };

    // Count tasks by department
    departments.forEach((dept) => {
      counts.department[dept] = activeTasks.filter(t => {
        const createdByDept = getTaskUserDepartment(t.createdBy);
        const assignedToDept = getTaskUserDepartment(t.assignedTo);
        const createdForDept = getTaskUserDepartment(t.createdFor);
        return createdByDept === dept || assignedToDept === dept || createdForDept === dept;
      }).length;
    });

    // Count tasks by company
    companies.forEach((company) => {
      counts.company[company.id] = activeTasks.filter(t => t.companyId === company.id).length;
    });

    return counts;
  }, [activeTasks, departments, companies]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setUserFilter("all");
    setDepartmentFilter("all");
    setCompanyFilter("all");
    toast({
      title: "تم إعادة تعيين الفلاتر",
      description: "تم مسح جميع الفلاتر",
    });
  };

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return null;
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : null;
  };

  const handleDeleteTask = () => {
    if (taskDetailsDialog.taskId) {
      deleteTaskMutation.mutate(taskDetailsDialog.taskId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "low": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default: return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
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

  const TaskGridCard = ({ task }: { task: Task }) => {
    return (
      <Card 
        className="hover-elevate transition-all duration-200 cursor-pointer" 
        data-testid={`task-grid-card-${task.id}`}
        onClick={() => setTaskDetailsDialog({ open: true, taskId: task.id })}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base line-clamp-2" data-testid={`task-grid-title-${task.id}`}>
                {task.title}
              </h3>
              <Badge className={cn("text-xs", getPriorityColor(task.priority))} data-testid={`task-grid-priority-${task.id}`}>
                {getPriorityLabel(task.priority)}
              </Badge>
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`task-grid-description-${task.id}`}>
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {task.companyId && getCompanyName(task.companyId) && (
                <Badge variant="outline" className="text-xs" data-testid={`task-grid-company-${task.id}`}>
                  {getCompanyName(task.companyId)}
                </Badge>
              )}
              {task.rewardPoints && (
                <Badge variant="secondary" className="text-xs" data-testid={`task-grid-points-${task.id}`}>
                  {task.rewardPoints} نقطة
                </Badge>
              )}
            </div>

            {task.dueDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`task-grid-due-date-${task.id}`}>
                <Clock className="w-3.5 h-3.5" />
                {formatArabicDate(task.dueDate)}
              </div>
            )}

            {(task as any).createdForUser && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={(task as any).createdForUser.profilePicture || undefined} 
                    alt={(task as any).createdForUser.fullName || "مكلفة لـ"} 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs">
                    {(task as any).createdForUser.fullName?.[0] || "م"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{(task as any).createdForUser.fullName}</p>
                  {(task as any).createdForUser.department && (
                    <p className="text-xs text-muted-foreground truncate">{(task as any).createdForUser.department}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MotionPageShell>
      <Navigation />
    
      <div className="flex">
        <Sidebar />
      
        <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300 max-w-full overflow-x-hidden", "md:mr-16", !isCollapsed && "md:mr-64")}>
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
            
                <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto" data-testid="dialog-create-task">
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
                      <Label htmlFor="task-company" className="text-sm sm:text-base font-medium">الشركة</Label>
                      <Select
                        value={newTask.companyId}
                        onValueChange={(value) => setNewTask({ ...newTask, companyId: value === "none" ? "" : value })}
                      >
                        <SelectTrigger id="task-company" data-testid="select-task-company" className="h-11 sm:h-10">
                          <SelectValue placeholder="اختر الشركة (اختياري)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون شركة</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          min={new Date().toISOString().slice(0, 16)}
                          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                          data-testid="input-task-due-date"
                          className="h-11 sm:h-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-created-for" className="text-sm sm:text-base font-medium">مكلفه لـ <span className="text-destructive">*</span></Label>
                      <Select
                        value={newTask.createdFor}
                        onValueChange={(value) => setNewTask({ ...newTask, createdFor: value })}
                      >
                        <SelectTrigger data-testid="select-task-created-for" className="h-11 sm:h-10">
                          <SelectValue placeholder="اختر الموظف" />
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
                    <div className="space-y-2">
                      <Label htmlFor="task-assignee" className="text-sm sm:text-base font-medium">المراجع</Label>
                      <Select
                        value={newTask.assignedTo}
                        onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}
                      >
                        <SelectTrigger data-testid="select-task-assignee" className="h-11 sm:h-10">
                          <SelectValue placeholder="اختر المراجع (اختياري)" />
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
                    
                    {/* Attachments Section */}
                    <div className="space-y-3 pt-2 border-t">
                      <Label className="text-sm sm:text-base font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        المرفقات (صور/ملفات)
                      </Label>
                      
                      {attachments.length > 0 && (
                        <div className="space-y-2">
                          {attachments.map((att, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Upload className="w-4 h-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{att.name}</p>
                                  {att.url.startsWith('/uploads/') && (
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                      عرض الملف
                                    </a>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAttachment(idx)}
                                data-testid={`button-remove-attachment-${idx}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              try {
                                const formData = new FormData();
                                files.forEach(file => formData.append('files', file));
                                const res = await fetch('/api/upload/multiple', {
                                  method: 'POST',
                                  body: formData,
                                  credentials: 'include',
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  const uploadedFiles = data.files.map((file: any) => ({
                                    name: file.originalName,
                                    url: file.url,
                                    type: 'file'
                                  }));
                                  setAttachments([...attachments, ...uploadedFiles]);
                                  toast({
                                    title: "تم رفع الملفات",
                                    description: `تم رفع ${files.length} ملف بنجاح`,
                                  });
                                  e.target.value = '';
                                } else {
                                  toast({
                                    title: "خطأ في رفع الملفات",
                                    description: data.message || "حدث خطأ",
                                    variant: "destructive",
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: "خطأ في رفع الملفات",
                                  description: "حدث خطأ غير متوقع",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          className="h-10"
                          data-testid="input-task-attachments"
                        />
                        <p className="text-xs text-muted-foreground">
                          يمكنك رفع صور أو ملفات PDF أو مستندات Word/Excel
                        </p>
                      </div>
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

          <MotionSection delay={0.15}>
            <Card className="mb-6" data-testid="card-task-filters">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full h-11 sm:h-10" data-testid="select-filter-status">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      <SelectItem value="pending">قيد الانتظار ({filterCounts.status.pending})</SelectItem>
                      <SelectItem value="in_progress">قيد التنفيذ ({filterCounts.status.in_progress})</SelectItem>
                      <SelectItem value="under_review">تحت المراجعة ({filterCounts.status.under_review})</SelectItem>
                      <SelectItem value="completed">مكتمل ({filterCounts.status.completed})</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full h-11 sm:h-10" data-testid="select-filter-priority">
                      <SelectValue placeholder="الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأولويات</SelectItem>
                      <SelectItem value="high">عالي ({filterCounts.priority.high})</SelectItem>
                      <SelectItem value="medium">متوسط ({filterCounts.priority.medium})</SelectItem>
                      <SelectItem value="low">منخفض ({filterCounts.priority.low})</SelectItem>
                    </SelectContent>
                  </Select>
                  {(user?.role === 'admin' || user?.role === 'sub-admin') && (
                    <>
                      <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger className="w-full h-11 sm:h-10" data-testid="select-filter-user">
                          <SelectValue placeholder="الموظف" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل الموظفين</SelectItem>
                          <SelectItem value="my">مهامي</SelectItem>
                          {users.map((u) => {
                            const userTaskCount = activeTasks.filter(t => {
                              const createdById = getTaskUserId(t.createdBy);
                              const assignedToId = getTaskUserId(t.assignedTo);
                              const createdForId = getTaskUserId(t.createdFor);
                              return createdById === u.id || assignedToId === u.id || createdForId === u.id;
                            }).length;
                            return (
                              <SelectItem key={u.id} value={u.id}>
                                {u.fullName} - {u.department} ({userTaskCount})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-full h-11 sm:h-10" data-testid="select-filter-department">
                          <SelectValue placeholder="القسم" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل الأقسام</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept} ({filterCounts.department[dept] || 0})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={companyFilter} onValueChange={setCompanyFilter}>
                        <SelectTrigger className="w-full h-11 sm:h-10" data-testid="select-filter-company">
                          <SelectValue placeholder="الشركة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">كل الشركات</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>{company.name} ({filterCounts.company[company.id] || 0})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={handleResetFilters} data-testid="button-reset-filters" className="h-11 sm:h-10 w-full">
                    <Filter className="w-4 h-4 ml-2" />
                    <span className="hidden sm:inline">إعادة تعيين</span>
                    <span className="sm:hidden">إعادة</span>
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث في المهام..."
                    className="pr-10 h-11 sm:h-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-tasks"
                  />
                </div>
              </CardContent>
            </Card>
          </MotionSection>

          <MotionSection delay={0.4}>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="space-y-3" data-testid="tasks-list">
                {filteredTasks.map((task) => (
                  <TaskGridCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <Card className="p-8" data-testid="empty-tasks-state">
                <div className="text-center text-muted-foreground">
                  <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">لا توجد مهام</p>
                  <p className="text-sm">لم يتم العثور على أي مهام تطابق الفلاتر المحددة</p>
                </div>
              </Card>
            )}
          </MotionSection>
        </main>
      </div>

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
        onDelete={handleDeleteTask}
      />
    </MotionPageShell>
  );
}
