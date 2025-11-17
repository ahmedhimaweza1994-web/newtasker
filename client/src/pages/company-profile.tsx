import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MotionPageShell, MotionSection } from "@/components/ui/motion-wrappers";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Building2, ArrowRight, Users, FileText, Target, MessageSquare, 
  Upload, Calendar, Plus, Pencil, Trash2, CheckCircle2, Clock,
  AlertCircle, BarChart3
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { SelectCompany, SelectTask, SelectUser, SelectCompanyMilestone, 
  SelectCompanyFile, SelectCompanyReport, SelectCompanyComment } from "@shared/schema";

export default function CompanyProfile() {
  const params = useParams<{ id: string }>();
  const companyId = params.id!;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: company, isLoading: companyLoading } = useQuery<SelectCompany>({
    queryKey: ["/api/companies", companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error("فشل في تحميل بيانات الشركة");
      return res.json();
    },
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<SelectTask[]>({
    queryKey: ["/api/companies", companyId, "tasks"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/tasks`);
      if (!res.ok) throw new Error("فشل في تحميل المهام");
      return res.json();
    },
  });

  const { data: milestones = [], isLoading: milestonesLoading } = useQuery<SelectCompanyMilestone[]>({
    queryKey: ["/api/companies", companyId, "milestones"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/milestones`);
      if (!res.ok) throw new Error("فشل في تحميل المعالم");
      return res.json();
    },
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<SelectCompanyFile[]>({
    queryKey: ["/api/companies", companyId, "files"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/files`);
      if (!res.ok) throw new Error("فشل في تحميل الملفات");
      return res.json();
    },
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<SelectCompanyReport[]>({
    queryKey: ["/api/companies", companyId, "reports"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/reports`);
      if (!res.ok) throw new Error("فشل في تحميل التقارير");
      return res.json();
    },
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<SelectCompanyComment[]>({
    queryKey: ["/api/companies", companyId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/comments`);
      if (!res.ok) throw new Error("فشل في تحميل التعليقات");
      return res.json();
    },
  });

  const { data: users = [] } = useQuery<SelectUser[]>({
    queryKey: ["/api/users"],
  });

  const isLoading = companyLoading;
  const isAdmin = user?.role === 'admin' || user?.role === 'sub-admin';

  if (isLoading) {
    return (
      <MotionPageShell>
        <Navigation />
        <div className="flex">
          <Sidebar />
          <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300", "md:mr-16", !isCollapsed && "md:mr-64")}>
            <Skeleton className="h-32 w-full mb-6" />
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </MotionPageShell>
    );
  }

  if (!company) {
    return (
      <MotionPageShell>
        <Navigation />
        <div className="flex">
          <Sidebar />
          <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300", "md:mr-16", !isCollapsed && "md:mr-64")}>
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">الشركة غير موجودة</p>
                <Button onClick={() => setLocation("/companies")} className="mt-4" data-testid="button-back-to-companies">
                  <ArrowRight className="w-4 h-4 ml-2" />
                  العودة إلى الشركات
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </MotionPageShell>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "نشطة", variant: "default" as const },
      inactive: { label: "غير نشطة", variant: "secondary" as const },
      pending: { label: "قيد الانتظار", variant: "outline" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return "غير محدد";
    const manager = users.find(u => u.id === managerId);
    return manager ? manager.fullName : "غير محدد";
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
  };

  const milestoneStats = {
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'completed').length,
    inProgress: milestones.filter(m => m.status === 'in_progress').length,
  };

  return (
    <MotionPageShell>
      <Navigation />

      <div className="flex">
        <Sidebar />

        <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300", "md:mr-16", !isCollapsed && "md:mr-64")}>
          <MotionSection delay={0.1}>
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/companies")}
              className="mb-4"
              data-testid="button-back-to-companies"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة إلى الشركات
            </Button>

            <Card className="mb-6" data-testid="card-company-header">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-8 h-8 text-primary" />
                      <CardTitle className="text-2xl sm:text-3xl">{company.name}</CardTitle>
                    </div>
                    {getStatusBadge(company.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">المجال</p>
                    <p className="font-medium">{company.industry}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">مدير الحساب</p>
                    <p className="font-medium">{getManagerName(company.managerId)}</p>
                  </div>
                  {company.startDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">تاريخ البدء</p>
                      <p className="font-medium">
                        {format(new Date(company.startDate), "d MMMM yyyy", { locale: ar })}
                      </p>
                    </div>
                  )}
                </div>
                {company.description && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">الوصف</p>
                    <p>{company.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </MotionSection>

          <MotionSection delay={0.2}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-6">
                <TabsTrigger value="overview" data-testid="tab-overview">
                  <BarChart3 className="w-4 h-4 ml-2" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="tasks" data-testid="tab-tasks">
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  المهام ({taskStats.total})
                </TabsTrigger>
                <TabsTrigger value="milestones" data-testid="tab-milestones">
                  <Target className="w-4 h-4 ml-2" />
                  المعالم ({milestoneStats.total})
                </TabsTrigger>
                <TabsTrigger value="files" data-testid="tab-files">
                  <FileText className="w-4 h-4 ml-2" />
                  الملفات ({files.length})
                </TabsTrigger>
                <TabsTrigger value="reports" data-testid="tab-reports">
                  <FileText className="w-4 h-4 ml-2" />
                  التقارير ({reports.length})
                </TabsTrigger>
                <TabsTrigger value="comments" data-testid="tab-comments">
                  <MessageSquare className="w-4 h-4 ml-2" />
                  التعليقات ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="team" data-testid="tab-team">
                  <Users className="w-4 h-4 ml-2" />
                  الفريق
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab 
                  taskStats={taskStats} 
                  milestoneStats={milestoneStats}
                  filesCount={files.length}
                  reportsCount={reports.length}
                  commentsCount={comments.length}
                />
              </TabsContent>

              <TabsContent value="tasks">
                <TasksTab tasks={tasks} isLoading={tasksLoading} users={users} />
              </TabsContent>

              <TabsContent value="milestones">
                <MilestonesTab 
                  milestones={milestones} 
                  isLoading={milestonesLoading}
                  companyId={companyId}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="files">
                <FilesTab 
                  files={files} 
                  isLoading={filesLoading}
                  companyId={companyId}
                  users={users}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="reports">
                <ReportsTab 
                  reports={reports} 
                  isLoading={reportsLoading}
                  companyId={companyId}
                  users={users}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="comments">
                <CommentsTab 
                  comments={comments} 
                  isLoading={commentsLoading}
                  companyId={companyId}
                  users={users}
                />
              </TabsContent>

              <TabsContent value="team">
                <TeamTab companyId={companyId} users={users} isAdmin={isAdmin} />
              </TabsContent>
            </Tabs>
          </MotionSection>
        </main>
      </div>
    </MotionPageShell>
  );
}

function OverviewTab({ taskStats, milestoneStats, filesCount, reportsCount, commentsCount }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card data-testid="card-overview-tasks">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            المهام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">الإجمالي</span>
              <span className="font-bold">{taskStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">مكتملة</span>
              <span className="font-medium text-green-600">{taskStats.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">قيد التنفيذ</span>
              <span className="font-medium text-blue-600">{taskStats.inProgress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">معلقة</span>
              <span className="font-medium text-orange-600">{taskStats.pending}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-overview-milestones">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            المعالم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">الإجمالي</span>
              <span className="font-bold">{milestoneStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">مكتملة</span>
              <span className="font-medium text-green-600">{milestoneStats.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">قيد التنفيذ</span>
              <span className="font-medium text-blue-600">{milestoneStats.inProgress}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-overview-resources">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            الموارد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">الملفات</span>
              <span className="font-medium">{filesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">التقارير</span>
              <span className="font-medium">{reportsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">التعليقات</span>
              <span className="font-medium">{commentsCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TasksTab({ tasks, isLoading, users }: any) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const getUserName = (userId: string | null) => {
    if (!userId) return "غير محدد";
    const foundUser = users.find((u: SelectUser) => u.id === userId);
    return foundUser ? foundUser.fullName : "غير محدد";
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { label: "عالية", variant: "destructive" as const },
      medium: { label: "متوسطة", variant: "default" as const },
      low: { label: "منخفضة", variant: "secondary" as const },
    };
    const priorityConfig = config[priority as keyof typeof config] || config.medium;
    return <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: "معلقة", variant: "outline" as const },
      in_progress: { label: "قيد التنفيذ", variant: "default" as const },
      under_review: { label: "قيد المراجعة", variant: "secondary" as const },
      completed: { label: "مكتملة", variant: "default" as const },
    };
    const statusConfig = config[status as keyof typeof config] || config.pending;
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">لا توجد مهام</p>
          <p className="text-sm text-muted-foreground">لم يتم إنشاء أي مهام لهذه الشركة بعد</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task: SelectTask) => (
        <Card key={task.id} data-testid={`card-task-${task.id}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{task.title}</CardTitle>
                <div className="flex gap-2">
                  {getPriorityBadge(task.priority)}
                  {getStatusBadge(task.status)}
                </div>
              </div>
            </div>
          </CardHeader>
          {task.description && (
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">أنشئ بواسطة: </span>
                  <span className="font-medium">{getUserName(task.createdBy)}</span>
                </div>
                {task.assignedTo && (
                  <div>
                    <span className="text-muted-foreground">مُسند إلى: </span>
                    <span className="font-medium">{getUserName(task.assignedTo)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

function MilestonesTab({ milestones, isLoading, companyId, isAdmin }: any) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    dueDate: "",
    status: "pending" as "pending" | "in_progress" | "completed",
  });

  const createMilestoneMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/companies/${companyId}/milestones`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "milestones"] });
      setIsCreateDialogOpen(false);
      setNewMilestone({ title: "", description: "", dueDate: "", status: "pending" });
      toast({ title: "تم إضافة المعلم بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      const res = await apiRequest("DELETE", `/api/companies/${companyId}/milestones/${milestoneId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "milestones"] });
      toast({ title: "تم حذف المعلم بنجاح" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { ...newMilestone };
    if (newMilestone.dueDate) {
      data.dueDate = new Date(newMilestone.dueDate).toISOString();
    }
    createMilestoneMutation.mutate(data);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" data-testid="button-add-milestone">
              <Plus className="w-4 h-4 ml-2" />
              إضافة معلم جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة معلم جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="milestone-title">العنوان *</Label>
                <Input
                  id="milestone-title"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  required
                  data-testid="input-milestone-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-description">الوصف</Label>
                <Textarea
                  id="milestone-description"
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  data-testid="input-milestone-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-due-date">تاريخ الاستحقاق</Label>
                <Input
                  id="milestone-due-date"
                  type="date"
                  value={newMilestone.dueDate}
                  onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                  data-testid="input-milestone-due-date"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-milestone">
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMilestoneMutation.isPending} data-testid="button-save-milestone">
                  حفظ
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {milestones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">لا توجد معالم</p>
            <p className="text-sm text-muted-foreground">لم يتم إضافة أي معالم لهذه الشركة بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone: SelectCompanyMilestone) => (
            <Card key={milestone.id} data-testid={`card-milestone-${milestone.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{milestone.title}</CardTitle>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMilestoneMutation.mutate(milestone.id)}
                      data-testid={`button-delete-milestone-${milestone.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {milestone.description && <p className="text-sm mb-4">{milestone.description}</p>}
                {milestone.dueDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(milestone.dueDate), "d MMMM yyyy", { locale: ar })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilesTab({ files, isLoading, companyId, users, isAdmin }: any) {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newFile, setNewFile] = useState({
    name: "",
    url: "",
    type: "",
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/companies/${companyId}/files`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "files"] });
      setIsUploadDialogOpen(false);
      setNewFile({ name: "", url: "", type: "" });
      toast({ title: "تم رفع الملف بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await apiRequest("DELETE", `/api/companies/${companyId}/files/${fileId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "files"] });
      toast({ title: "تم حذف الملف بنجاح" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadFileMutation.mutate(newFile);
  };

  const getUserName = (userId: string) => {
    const foundUser = users.find((u: SelectUser) => u.id === userId);
    return foundUser ? foundUser.fullName : "غير معروف";
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" data-testid="button-upload-file">
              <Upload className="w-4 h-4 ml-2" />
              رفع ملف جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>رفع ملف جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-name">اسم الملف *</Label>
                <Input
                  id="file-name"
                  value={newFile.name}
                  onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                  required
                  data-testid="input-file-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-url">رابط الملف *</Label>
                <Input
                  id="file-url"
                  value={newFile.url}
                  onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                  required
                  data-testid="input-file-url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-type">نوع الملف</Label>
                <Input
                  id="file-type"
                  value={newFile.type}
                  onChange={(e) => setNewFile({ ...newFile, type: e.target.value })}
                  placeholder="مثال: PDF, DOCX, XLSX"
                  data-testid="input-file-type"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)} data-testid="button-cancel-file">
                  إلغاء
                </Button>
                <Button type="submit" disabled={uploadFileMutation.isPending} data-testid="button-upload-file-submit">
                  رفع
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">لا توجد ملفات</p>
            <p className="text-sm text-muted-foreground">لم يتم رفع أي ملفات لهذه الشركة بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {files.map((file: SelectCompanyFile) => (
            <Card key={file.id} data-testid={`card-file-${file.id}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        رفع بواسطة {getUserName(file.uploadedBy)} • {file.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, "_blank")}
                      data-testid={`button-open-file-${file.id}`}
                    >
                      فتح
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFileMutation.mutate(file.id)}
                        data-testid={`button-delete-file-${file.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsTab({ reports, isLoading, companyId, users, isAdmin }: any) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    title: "",
    description: "",
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/companies/${companyId}/reports`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "reports"] });
      setIsCreateDialogOpen(false);
      setNewReport({ title: "", description: "" });
      toast({ title: "تم إنشاء التقرير بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await apiRequest("DELETE", `/api/companies/${companyId}/reports/${reportId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "reports"] });
      toast({ title: "تم حذف التقرير بنجاح" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReportMutation.mutate(newReport);
  };

  const getUserName = (userId: string) => {
    const foundUser = users.find((u: SelectUser) => u.id === userId);
    return foundUser ? foundUser.fullName : "غير معروف";
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" data-testid="button-create-report">
              <Plus className="w-4 h-4 ml-2" />
              إنشاء تقرير جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء تقرير جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-title">عنوان التقرير *</Label>
                <Input
                  id="report-title"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  required
                  data-testid="input-report-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-description">الوصف *</Label>
                <Textarea
                  id="report-description"
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  rows={5}
                  required
                  data-testid="input-report-description"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-report">
                  إلغاء
                </Button>
                <Button type="submit" disabled={createReportMutation.isPending} data-testid="button-create-report-submit">
                  إنشاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">لا توجد تقارير</p>
            <p className="text-sm text-muted-foreground">لم يتم إنشاء أي تقارير لهذه الشركة بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report: SelectCompanyReport) => (
            <Card key={report.id} data-testid={`card-report-${report.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{report.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      بواسطة {getUserName(report.uploadedBy)} • {" "}
                      {report.reportDate && format(new Date(report.reportDate), "d MMMM yyyy", { locale: ar })}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReportMutation.mutate(report.id)}
                      data-testid={`button-delete-report-${report.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{report.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsTab({ comments, isLoading, companyId, users }: any) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/companies/${companyId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "comments"] });
      setNewComment("");
      toast({ title: "تم إضافة التعليق بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await apiRequest("DELETE", `/api/companies/${companyId}/comments/${commentId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "comments"] });
      toast({ title: "تم حذف التعليق بنجاح" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment);
    }
  };

  const getUserName = (userId: string) => {
    const foundUser = users.find((u: SelectUser) => u.id === userId);
    return foundUser ? foundUser.fullName : "غير معروف";
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="اكتب تعليقاً..."
              rows={3}
              data-testid="input-new-comment"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={createCommentMutation.isPending || !newComment.trim()} data-testid="button-submit-comment">
                <MessageSquare className="w-4 h-4 ml-2" />
                إضافة تعليق
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {comments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">لا توجد تعليقات</p>
            <p className="text-sm text-muted-foreground">كن أول من يضيف تعليقاً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment: SelectCompanyComment) => (
            <Card key={comment.id} data-testid={`card-comment-${comment.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium">{getUserName(comment.userId)}</p>
                    <p className="text-sm text-muted-foreground">
                      {comment.createdAt && format(new Date(comment.createdAt), "d MMMM yyyy، h:mm a", { locale: ar })}
                    </p>
                  </div>
                  {comment.userId === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      data-testid={`button-delete-comment-${comment.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamTab({ companyId, users, isAdmin }: any) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["/api/companies", companyId, "team"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/team`);
      if (!res.ok) throw new Error("فشل في تحميل الفريق");
      return res.json();
    },
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/companies/${companyId}/team`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "team"] });
      setIsAddDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("member");
      toast({ title: "تم إضافة العضو بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/companies/${companyId}/team/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "team"] });
      toast({ title: "تم إزالة العضو بنجاح" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      addTeamMemberMutation.mutate({ userId: selectedUserId, role: selectedRole });
    }
  };

  const getUserName = (userId: string) => {
    const foundUser = users.find((u: SelectUser) => u.id === userId);
    return foundUser ? foundUser.fullName : "غير معروف";
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" data-testid="button-add-team-member">
              <Plus className="w-4 h-4 ml-2" />
              إضافة عضو للفريق
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة عضو للفريق</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-user">الموظف *</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="team-user" data-testid="select-team-user">
                    <SelectValue placeholder="اختر موظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u: SelectUser) => (
                      <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-role">الدور</Label>
                <Input
                  id="team-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  placeholder="مثال: مدير، مطور، مصمم"
                  data-testid="input-team-role"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel-team-member">
                  إلغاء
                </Button>
                <Button type="submit" disabled={addTeamMemberMutation.isPending || !selectedUserId} data-testid="button-add-team-member-submit">
                  إضافة
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">لا يوجد أعضاء في الفريق</p>
            <p className="text-sm text-muted-foreground">ابدأ بإضافة أعضاء الفريق</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembers.map((member: any) => (
            <Card key={member.userId} data-testid={`card-team-member-${member.userId}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{getUserName(member.userId)}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeamMemberMutation.mutate(member.userId)}
                      data-testid={`button-remove-team-member-${member.userId}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
