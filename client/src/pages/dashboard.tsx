import { useState, useEffect } from "react";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn, getMediaUrl } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import Leaderboard from "@/components/leaderboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MotionPageShell, MotionSection, MotionCardWrapper, ResponsiveGrid } from "@/components/ui/motion-wrappers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Play, 
  Pause, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Coffee, 
  User, 
  Calendar,
  TrendingUp,
  Target,
  Zap,
  Award,
  Activity,
  BarChart3,
  CheckSquare,
  ListTodo
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AuxSession, Task } from "@shared/schema";

interface ProductivityStats {
  productivityPercentage: number;
}

interface UserRewards {
  task: Task;
  user: any;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();

  // Sync selectedStatus with currentSession.status
  const { data: currentSession, refetch: refetchCurrentSession } = useQuery<AuxSession | null>({
    queryKey: ["/api/aux/current"],
    refetchInterval: 1000,
    retry: 1,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>(currentSession?.status || "ready");

  useEffect(() => {
    if (currentSession?.status) {
      setSelectedStatus(currentSession.status);
    }
  }, [currentSession]);

  // Fetch productivity stats and tasks
  const { data: productivityStats } = useQuery<ProductivityStats>({
    queryKey: ["/api/analytics/productivity"],
  });
  const { data: userTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/my"],
  });
  const { data: assignedTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/assigned"],
  });
  const { data: userRewards = [] } = useQuery<UserRewards[]>({
    queryKey: ["/api/user/rewards"],
  });

  // AUX session mutations
  const startSessionMutation = useMutation({
    mutationFn: async (data: { status: string; notes?: string; selectedTaskId?: string }) => {
      const res = await apiRequest("POST", "/api/aux/start", data);
      return res.json();
    },
    onSuccess: async (newSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/aux/current"] });
      await refetchCurrentSession();
      toast({
        title: "تم تغيير الحالة بنجاح",
        description: "تم تحديث حالة AUX الخاصة بك",
      });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async (data: { id: string; notes?: string; selectedTaskId?: string }) => {
      const res = await apiRequest("POST", `/api/aux/end/${data.id}`, { 
        notes: data.notes,
        selectedTaskId: data.selectedTaskId
      });
      return res.json();
    },
    onSuccess: async (endedSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/aux/current"] });
      await refetchCurrentSession();
      toast({
        title: "تم إنهاء الشيفت بنجاح",
        description: "تم حفظ الوقت والمهمة المحددة",
      });
    },
  });

  const toggleShiftMutation = useMutation({
    mutationFn: async (notes?: string) => {
      // Refetch current session to ensure we have latest state
      const { data: latestSession } = await refetchCurrentSession();
      const isEndingShift = latestSession && !latestSession.endTime;
      
      if (isEndingShift) {
        const res = await apiRequest("POST", `/api/aux/end/${latestSession.id}`, { notes });
        return { action: "end", data: await res.json() };
      } else {
        const res = await apiRequest("POST", "/api/aux/start", { status: "ready", notes });
        return { action: "start", data: await res.json() };
      }
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/aux/current"] });
      await refetchCurrentSession();
      
      if (result.action === "end") {
        toast({
          title: "تم إنهاء الشيفت",
          description: "الحالة الآن: غير نشط",
        });
      } else {
        toast({
          title: "تم بدء الشيفت",
          description: "الحالة الآن: جاهز",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تبديل الشيفت",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate current session duration with persisted data
  const [currentDuration, setCurrentDuration] = useState<string>("00:00:00");
  useEffect(() => {
    if (currentSession?.startTime && !currentSession.endTime) {
      const interval = setInterval(() => {
        const start = new Date(currentSession.startTime);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCurrentDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    } else if (currentSession?.endTime && currentSession.duration) {
      const durationMs = currentSession.duration * 1000; // Assuming duration is in seconds
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      setCurrentDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    } else {
      setCurrentDuration("00:00:00");
    }
  }, [currentSession]);

  const [currentNotes, setCurrentNotes] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [isWorkingOnProject, setIsWorkingOnProject] = useState(false);
  
  // Sync selectedTaskId with currentSession.selectedTaskId
  useEffect(() => {
    if (currentSession?.selectedTaskId) {
      setSelectedTaskId(currentSession.selectedTaskId);
    } else if (currentSession?.endTime) {
      // Only reset if session has ended
      setSelectedTaskId("");
    }
  }, [currentSession?.selectedTaskId, currentSession?.endTime]);

  // Track if user is currently working on a project
  useEffect(() => {
    if (currentSession?.status === 'working_on_project' && currentSession?.selectedTaskId) {
      setIsWorkingOnProject(true);
    } else {
      setIsWorkingOnProject(false);
    }
  }, [currentSession?.status, currentSession?.selectedTaskId]);
  
  const handleStatusChange = (status: string) => {
    // If clicking working_on_project, just update UI to show it's selected
    // User will then select a task before it's actually submitted
    if (status === "working_on_project") {
      setSelectedStatus(status);
      return;
    }
    
    const taskId = selectedTaskId && selectedTaskId !== 'none' ? selectedTaskId : undefined;
    
    if (currentSession && !currentSession.endTime) {
      endSessionMutation.mutate({
        id: currentSession.id,
        notes: currentNotes,
        selectedTaskId: taskId
      }, {
        onSuccess: () => {
          startSessionMutation.mutate({
            status,
            notes: currentNotes,
            selectedTaskId: taskId
          });
        }
      });
    } else {
      startSessionMutation.mutate({
        status,
        notes: currentNotes,
        selectedTaskId: taskId
      });
    }
    setSelectedStatus(status);
    setCurrentNotes("");
    // Don't reset selectedTaskId - it will be synced from currentSession
  };

  const updateTaskStatusMutation = useMutation({
    mutationFn: async (data: { taskId: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/tasks/${data.taskId}`, { status: data.status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
    },
  });

  const handleConfirmWorkingOnProject = () => {
    const taskId = selectedTaskId && selectedTaskId !== 'none' ? selectedTaskId : undefined;
    
    // Validate: working_on_project requires a task selection
    if (!taskId) {
      toast({
        title: "يجب اختيار مهمة",
        description: "عند العمل على مشروع، يجب اختيار المهمة التي تعمل عليها",
        variant: "destructive",
      });
      return;
    }
    
    if (currentSession && !currentSession.endTime) {
      endSessionMutation.mutate({
        id: currentSession.id,
        notes: currentNotes,
        selectedTaskId: taskId
      }, {
        onSuccess: () => {
          startSessionMutation.mutate({
            status: "working_on_project",
            notes: currentNotes,
            selectedTaskId: taskId
          });
        }
      });
    } else {
      startSessionMutation.mutate({
        status: "working_on_project",
        notes: currentNotes,
        selectedTaskId: taskId
      });
    }
    setSelectedStatus("working_on_project");
    setCurrentNotes("");
    // Don't reset selectedTaskId - it will be synced from currentSession
  };

  const handleSubmitTask = () => {
    const taskId = currentSession?.selectedTaskId;
    
    if (!taskId) {
      toast({
        title: "خطأ",
        description: "لا توجد مهمة محددة للتسليم",
        variant: "destructive",
      });
      return;
    }

    // First update task status to under_review
    updateTaskStatusMutation.mutate(
      { taskId, status: "under_review" },
      {
        onSuccess: () => {
          // Then change AUX status back to ready
          if (currentSession && !currentSession.endTime) {
            endSessionMutation.mutate(
              {
                id: currentSession.id,
                notes: currentNotes,
                selectedTaskId: undefined,
              },
              {
                onSuccess: () => {
                  startSessionMutation.mutate({
                    status: "ready",
                    notes: "",
                    selectedTaskId: undefined,
                  });
                  setSelectedStatus("ready");
                  setSelectedTaskId("");
                  setCurrentNotes("");
                  setIsWorkingOnProject(false);
                  toast({
                    title: "تم تسليم المهمة بنجاح",
                    description: "تم نقل المهمة إلى تحت المراجعة",
                  });
                },
              }
            );
          }
        },
      }
    );
  };

  const handleToggleShift = () => {
    toggleShiftMutation.mutate(currentNotes);
    setCurrentNotes("");
    // Don't reset selectedTaskId - it will be synced from currentSession
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "ready":
        return {
          label: "في انتظار مهمة",
          color: "bg-green-500",
          icon: CheckCircle,
          bgColor: "bg-green-50 dark:bg-green-900/20",
          textColor: "text-green-700 dark:text-green-300"
        };
      case "working_on_project":
        return {
          label: "يعمل على مشروع",
          color: "bg-blue-500",
          icon: Play,
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          textColor: "text-blue-700 dark:text-blue-300"
        };
      case "personal":
        return {
          label: "شخصي",
          color: "bg-yellow-500",
          icon: User,
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          textColor: "text-yellow-700 dark:text-yellow-300"
        };
      case "break":
        return {
          label: "استراحة",
          color: "bg-red-500",
          icon: Coffee,
          bgColor: "bg-red-50 dark:bg-red-900/20",
          textColor: "text-red-700 dark:text-red-300"
        };
      default:
        return {
          label: "غير متصل",
          color: "bg-gray-500",
          icon: AlertCircle,
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          textColor: "text-gray-700 dark:text-gray-300"
        };
    }
  };

  const currentStatusInfo = currentSession ? getStatusInfo(currentSession.status) : {
    label: "لم يتم اختيار حالة",
    color: "bg-gray-400",
    icon: AlertCircle,
    bgColor: "bg-gray-50 dark:bg-gray-900/20",
    textColor: "text-gray-500 dark:text-gray-400"
  };

  const StatusIcon = currentStatusInfo.icon;
  const allTasks = [...userTasks, ...assignedTasks];
  const pendingTasks = allTasks.filter(task => task.status === 'pending');
  const inProgressTasks = allTasks.filter(task => task.status === 'in_progress');
  const completedTasks = allTasks.filter(task => task.status === 'completed');
  const totalPoints = userRewards.reduce((sum, r) => sum + (r?.task?.rewardPoints || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
     
      <div className="flex">
        <Sidebar />
       
        <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300", "md:mr-16" , !isCollapsed && "md:mr-64")}>
          {/* Hero Section with Enhanced Glassmorphism & Gradient */}
          <MotionSection className="relative overflow-hidden rounded-2xl mb-6">
            {/* Animated gradient background with blur */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 blur-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-teal/20 via-transparent to-magenta/20 blur-2xl animate-pulse"></div>
            
            {/* Glass morphism card */}
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-card/40 via-card/60 to-card/40 border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
              
              <div className="relative px-6 sm:px-8 py-8 md:py-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full"></div>
                      <Avatar className="relative w-20 h-20 md:w-24 md:h-24 border-2 border-primary/30 shadow-2xl ring-4 ring-primary/10">
                        <AvatarImage src={getMediaUrl(user?.profilePicture)} alt={user?.fullName} />
                        <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                          {user?.fullName?.split(" ")[0]?.charAt(0) || "م"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent mb-2">
                        مرحباً، {user?.fullName?.split(' ')[0]}! 👋
                      </h1>
                      <p className="text-muted-foreground text-base md:text-lg">
                        إليك نظرة عامة على يومك ونشاطك الحالي
                      </p>
                    </div>
                  </div>

                  {/* Current Status Badge with enhanced glassmorphism */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-xl group-hover:blur-2xl transition-all"></div>
                    <div className="relative flex items-center gap-4 backdrop-blur-2xl bg-white/5 dark:bg-white/10 rounded-2xl px-6 py-4 border border-white/20 shadow-xl">
                      <div className={cn("w-4 h-4 rounded-full", currentStatusInfo.color, "animate-pulse shadow-lg")}></div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">الحالة الحالية</p>
                        <p className="text-lg font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">{currentStatusInfo.label}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MotionSection>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <MotionCardWrapper>
              <Card className="transition-shadow hover:shadow-md" data-testid="card-total-time">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">إجمالي الوقت</p>
                  <p className="text-2xl font-bold text-foreground">{currentSession ? currentDuration : '00:00:00'}</p>
                </CardContent>
              </Card>
              </MotionCardWrapper>

              <MotionCardWrapper>
              <Card className="transition-shadow hover:shadow-md" data-testid="card-completed-tasks">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-success/10 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">مهام مكتملة</p>
                  <p className="text-2xl font-bold text-foreground">{completedTasks.length}</p>
                </CardContent>
              </Card>
              </MotionCardWrapper>

              <MotionCardWrapper>
              <Card className="transition-shadow hover:shadow-md" data-testid="card-pending-tasks">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-warning/10 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-warning" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">مهام معلقة</p>
                  <p className="text-2xl font-bold text-foreground">{pendingTasks.length}</p>
                </CardContent>
              </Card>
              </MotionCardWrapper>

              <MotionCardWrapper>
              <Card className="transition-shadow hover:shadow-md" data-testid="card-productivity">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 bg-secondary/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">الإنتاجية</p>
                  <p className="text-2xl font-bold text-foreground">
                    {productivityStats?.productivityPercentage != null ? `${Math.round(productivityStats.productivityPercentage)}%` : '-'}
                  </p>
                </CardContent>
              </Card>
              </MotionCardWrapper>
            </div>

            {/* Main Content - Tabbed Interface */}
            <Tabs defaultValue="status" className="space-y-6">
              <TabsList className="grid w-full max-w-2xl grid-cols-3">
                <TabsTrigger value="status" className="gap-2">
                  <Activity className="w-4 h-4" />
                  حالة العمل
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-2">
                  <ListTodo className="w-4 h-4" />
                  المهام
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="gap-2">
                  <Award className="w-4 h-4" />
                  لوحة المتصدرين
                </TabsTrigger>
              </TabsList>

              {/* Status Tab */}
              <TabsContent value="status" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Current Status Card */}
                  <Card className="border-2 text-right">
                    <CardHeader className="flex flex-col space-y-1.5 p-6 text-right">
                      <CardTitle className="flex items-center gap-2 text-right">
                        <Zap className="w-5 h-5 text-primary" />
                        الحالة الحالية
                      </CardTitle>
                      <CardDescription>تتبع نشاطك ووقت العمل الفعلي</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className={cn("p-6 rounded-xl", currentStatusInfo.bgColor)}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", currentStatusInfo.color)}>
                            <StatusIcon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">الحالة</p>
                            <p className={cn("text-2xl font-bold", currentStatusInfo.textColor)}>{currentStatusInfo.label}</p>
                          </div>
                        </div>
                        
                        {currentSession && (
                          <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex items-center gap-2">
                              <Clock className="w-5 h-5 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">المدة</span>
                            </div>
                            <span className="text-3xl font-mono font-bold text-foreground">{currentDuration}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleToggleShift}
                        size="lg"
                        className="w-full text-lg shadow-lg"
                        disabled={toggleShiftMutation.isPending}
                        data-testid="button-toggle-shift"
                      >
                        {currentSession && !currentSession.endTime ? (
                          <>
                            <Pause className="ml-2 h-5 w-5" />
                            إنهاء الشيفت
                          </>
                        ) : (
                          <>
                            <Play className="ml-2 h-5 w-5" />
                            بدء الشيفت
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Change Status Card */}
                  <Card className="border-2">
                    <CardHeader className="text-right">
                      <CardTitle className="flex items-center gap-2 text-right">
                        <CheckSquare className="w-5 h-5 text-primary" />
                        تغيير الحالة
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground text-right">اختر الحالة المناسبة لنشاطك الحالي</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-right">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant={selectedStatus === "ready" ? "default" : "outline"}
                          onClick={() => handleStatusChange("ready")}
                          className="h-auto py-4 flex-col gap-2"
                          disabled={startSessionMutation.isPending || endSessionMutation.isPending}
                          data-testid="button-status-ready"
                        >
                          <CheckCircle className="w-6 h-6" />
                          <span className="text-sm">جاهز</span>
                        </Button>

                        <Button
                          variant={selectedStatus === "working_on_project" ? "default" : "outline"}
                          onClick={() => handleStatusChange("working_on_project")}
                          className="h-auto py-4 flex-col gap-2"
                          disabled={startSessionMutation.isPending || endSessionMutation.isPending}
                          data-testid="button-status-working"
                        >
                          <Play className="w-6 h-6" />
                          <span className="text-sm">يعمل على مشروع</span>
                        </Button>

                        <Button
                          variant={selectedStatus === "personal" ? "default" : "outline"}
                          onClick={() => handleStatusChange("personal")}
                          className="h-auto py-4 flex-col gap-2"
                          disabled={startSessionMutation.isPending || endSessionMutation.isPending}
                          data-testid="button-status-personal"
                        >
                          <User className="w-6 h-6" />
                          <span className="text-sm">شخصي</span>
                        </Button>

                        <Button
                          variant={selectedStatus === "break" ? "default" : "outline"}
                          onClick={() => handleStatusChange("break")}
                          className="h-auto py-4 flex-col gap-2"
                          disabled={startSessionMutation.isPending || endSessionMutation.isPending}
                          data-testid="button-status-break"
                        >
                          <Coffee className="w-6 h-6" />
                          <span className="text-sm">استراحة</span>
                        </Button>
                      </div>

                      <div className="space-y-2 text-right">
                        <label className="text-sm font-medium text-right">
                          المهمة الحالية {selectedStatus === 'working_on_project' && <span className="text-destructive">*</span>}
                        </label>
                        {selectedStatus === 'working_on_project' && (
                          <p className="text-xs text-muted-foreground">
                            يجب اختيار مهمة عند العمل على مشروع
                          </p>
                        )}
                        <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                          <SelectTrigger className="w-full" data-testid="select-current-task-dashboard">
                            <SelectValue placeholder="اختر المهمة التي تعمل عليها..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="none">لا أعمل على مهمة محددة</SelectItem>
                            {userTasks
                              .filter((task) => task.status !== 'completed')
                              .map((task) => (
                                <SelectItem key={task.id} value={task.id}>
                                  <div className="flex items-center gap-2 py-1">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{task.title}</p>
                                      {task.description && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          {task.description.substring(0, 50)}...
                                        </p>
                                      )}
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                                        task.status === 'under_review' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' :
                                        'bg-gray-500/10 text-gray-700 dark:text-gray-400'
                                      }
                                    >
                                      {task.status === 'in_progress' ? 'قيد التنفيذ' :
                                       task.status === 'under_review' ? 'قيد المراجعة' :
                                       'قيد الانتظار'}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        {selectedTaskId && selectedTaskId !== 'none' && (
                          <div className="p-3 rounded-lg bg-muted/50 border border-border">
                            {(() => {
                              const selectedTask = userTasks.find(t => t.id === selectedTaskId);
                              if (!selectedTask) return null;
                              return (
                                <>
                                  <p className="text-sm font-medium text-foreground mb-1">
                                    {selectedTask.title}
                                  </p>
                                  {selectedTask.description && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                      {selectedTask.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant="secondary"
                                      className={
                                        selectedTask.priority === "high" ? "bg-red-500/20 text-red-700 dark:text-red-400" :
                                        selectedTask.priority === "medium" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                                        "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                                      }
                                    >
                                      {selectedTask.priority === "high" ? "أولوية عالية" :
                                       selectedTask.priority === "medium" ? "أولوية متوسطة" :
                                       "أولوية منخفضة"}
                                    </Badge>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      
                      {selectedStatus === 'working_on_project' && !isWorkingOnProject && (
                        <Button
                          onClick={handleConfirmWorkingOnProject}
                          className="w-full"
                          disabled={startSessionMutation.isPending || endSessionMutation.isPending || !selectedTaskId || selectedTaskId === 'none'}
                          data-testid="button-confirm-working-on-project"
                        >
                          {startSessionMutation.isPending || endSessionMutation.isPending ? 'جاري التحديث...' : 'تأكيد العمل على المشروع'}
                        </Button>
                      )}
                      {isWorkingOnProject && (
                        <Button
                          onClick={handleSubmitTask}
                          variant="destructive"
                          className="w-full"
                          disabled={updateTaskStatusMutation.isPending || startSessionMutation.isPending || endSessionMutation.isPending}
                          data-testid="button-submit-task"
                        >
                          {updateTaskStatusMutation.isPending || startSessionMutation.isPending || endSessionMutation.isPending ? 'جاري التسليم...' : 'تسليم'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* My Tasks */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        مهامي
                      </CardTitle>
                      <CardDescription>المهام المسندة لي</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userTasks && userTasks.length > 0 ? (
                        <div className="space-y-3">
                          {userTasks.slice(0, 5).map((task: any) => (
                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              {task.status === "completed" ? (
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                              ) : task.status === "in_progress" ? (
                                <Play className="w-5 h-5 text-blue-500 flex-shrink-0" />
                              ) : (
                                <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{task.title}</p>
                                <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                              </div>
                              <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}>
                                {task.priority === "high" ? "عالية" : task.priority === "medium" ? "متوسطة" : "منخفضة"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">لا توجد مهام حالياً</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Task Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        إحصائيات المهام
                      </CardTitle>
                      <CardDescription>نظرة عامة على توزيع المهام</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-medium">مهام معلقة</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pendingTasks.length}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                            <Play className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="font-medium">مهام جارية</span>
                        </div>
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{inProgressTasks.length}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="font-medium">مهام مكتملة</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTasks.length}</span>
                      </div>

                      {allTasks.length > 0 && (
                        <div className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">معدل الإنجاز</span>
                            <span className="text-sm font-bold text-primary">
                              {Math.round((completedTasks.length / allTasks.length) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                              style={{ width: `${(completedTasks.length / allTasks.length) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-6 h-6 text-yellow-500" />
                      لوحة المتصدرين
                    </CardTitle>
                    <CardDescription>أفضل الموظفين أداءً هذا الشهر</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Leaderboard />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
