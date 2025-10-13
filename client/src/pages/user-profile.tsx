import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionPageShell, MotionSection, MotionMetricCard, ResponsiveGrid } from "@/components/ui/motion-wrappers";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Calendar,
  Briefcase,
  CheckCircle,
  Users,
  Code,
  Edit,
  Save,
  X,
  Phone,
  MapPin,
  Trophy,
  Star,
  Target,
  TrendingUp,
  Clock,
  Award,
  Activity
} from "lucide-react";

function ProfileLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <Skeleton className="h-48 md:h-64 w-full" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-0 max-w-7xl">
            <div className="relative -mt-16 sm:-mt-20 mb-8">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                <Skeleton className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full" />
                <div className="flex-1 w-full">
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const userId = id || currentUser?.id;
  const isOwnProfile = !id || id === currentUser?.id;

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/profile", userId],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks/my"],
    enabled: isOwnProfile,
  });

  const { data: auxSessions } = useQuery<any[]>({
    queryKey: ["/api/aux/sessions"],
    enabled: isOwnProfile,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث الملف الشخصي بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث الملف الشخصي",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = () => {
    setEditData({
      fullName: profile?.fullName || "",
      department: profile?.department || "",
      jobTitle: profile?.jobTitle || "",
      bio: profile?.bio || "",
      phoneNumber: profile?.phoneNumber || "",
      address: profile?.address || "",
    });
    setProfileImagePreview(null);
    setCoverImagePreview(null);
    setIsEditing(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة فقط",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === 'profile') {
        setProfileImagePreview(base64String);
        setEditData({ ...editData, profilePicture: base64String });
      } else {
        setCoverImagePreview(base64String);
        setEditData({ ...editData, coverImage: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
    setProfileImagePreview(null);
    setCoverImagePreview(null);
  };

  if (profileLoading || !profile) {
    return <ProfileLoadingSkeleton />;
  }

  const completedTasks = tasks?.filter((t: any) => t.status === "completed").length || 0;
  const totalTasks = tasks?.length || 0;
  const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingTasks = tasks?.filter((t: any) => t.status === "pending").length || 0;
  const inProgressTasks = tasks?.filter((t: any) => t.status === "in-progress").length || 0;

  return (
    <MotionPageShell className="min-h-screen">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 transition-all duration-300", isCollapsed ? "mr-16" : "mr-64")}>
          {/* Modern Cover Section */}
          <motion.div 
            className="relative h-48 md:h-64 overflow-hidden group"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {coverImagePreview || profile.coverImage ? (
              <img 
                src={coverImagePreview || profile.coverImage} 
                alt="Cover" 
                className="w-full h-full max-w-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptLTIwIDRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            
            {isOwnProfile && isEditing && (
              <motion.div 
                className="absolute top-4 right-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label htmlFor="cover-upload" className="cursor-pointer">
                  <Button 
                    type="button" 
                    size="sm" 
                    className="gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                    data-testid="button-change-cover"
                  >
                    <Edit className="w-4 h-4" />
                    تغيير الغلاف
                  </Button>
                </label>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageChange(e, 'cover')}
                />
              </motion.div>
            )}
          </motion.div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-0 max-w-7xl">
            {/* Profile Header */}
            <MotionSection delay={0.2} className="relative -mt-16 sm:-mt-20 mb-8">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                {/* Avatar */}
                <motion.div 
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Avatar className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 border-4 border-background shadow-2xl ring-4 ring-primary/20">
                    <AvatarImage src={profileImagePreview || profile.profilePicture} alt={profile.fullName} className="max-w-full object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary text-white">
                      {profile.fullName?.split(" ")[0]?.charAt(0) || "م"}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isOwnProfile && isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <label htmlFor="profile-upload" className="cursor-pointer">
                        <Button 
                          type="button" 
                          size="sm" 
                          className="rounded-full gap-2"
                          onClick={() => document.getElementById('profile-upload')?.click()}
                          data-testid="button-change-profile-picture"
                        >
                          <Edit className="w-4 h-4" />
                          تغيير
                        </Button>
                      </label>
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, 'profile')}
                      />
                    </div>
                  )}
                </motion.div>

                {/* User Info & Actions */}
                <div className="flex-1 w-full bg-card rounded-xl p-4 sm:p-6 shadow-lg border border-border">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-user-fullname">
                          {profile.fullName}
                        </h1>
                        {profile.role === 'admin' && (
                          <Badge className="bg-purple-600 hover:bg-purple-700">
                            <Award className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-lg text-muted-foreground mb-4 flex items-center gap-2" data-testid="text-user-jobtitle">
                        <Briefcase className="w-4 h-4" />
                        {profile.jobTitle || "لا يوجد مسمى وظيفي"}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="font-medium" data-testid="text-user-department">{profile.department}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                          <Mail className="w-4 h-4 text-primary" />
                          <span data-testid="text-user-email">{profile.email}</span>
                        </div>
                        {profile.phoneNumber && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                            <Phone className="w-4 h-4 text-primary" />
                            <span data-testid="text-user-phone">{profile.phoneNumber}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>انضم {new Date(profile.hireDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long" })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isOwnProfile && (
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <AnimatePresence mode="wait">
                          {!isEditing ? (
                            <motion.div
                              key="edit"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="w-full sm:w-auto"
                            >
                              <Button 
                                onClick={handleEditClick} 
                                data-testid="button-edit-profile" 
                                className="shadow-lg w-full sm:w-auto"
                              >
                                <Edit className="w-4 h-4 ml-2" />
                                تعديل الملف
                              </Button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="save-cancel"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex gap-2 w-full sm:w-auto"
                            >
                              <Button
                                onClick={handleSave}
                                disabled={updateProfileMutation.isPending}
                                data-testid="button-save-profile"
                                className="shadow-lg w-full sm:w-auto"
                              >
                                <Save className="w-4 h-4 ml-2" />
                                {updateProfileMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={handleCancel} 
                                data-testid="button-cancel-edit"
                                className="w-full sm:w-auto"
                              >
                                <X className="w-4 h-4 ml-2" />
                                إلغاء
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </MotionSection>

            {/* Stats Grid */}
            {isOwnProfile && (
              <MotionSection delay={0.3} className="mb-8">
                <ResponsiveGrid cols={{ sm: 2, md: 4 }}>
                  <MotionMetricCard
                    title="إجمالي المهام"
                    value={totalTasks}
                    icon={Target}
                    variant="blue-cyan"
                    index={0}
                    testId="text-total-tasks"
                  />
                  <MotionMetricCard
                    title="مهام مكتملة"
                    value={completedTasks}
                    icon={CheckCircle}
                    variant="green-emerald"
                    index={1}
                    testId="text-completed-tasks"
                  />
                  <MotionMetricCard
                    title="نسبة الإنجاز"
                    value={`${productivity}%`}
                    icon={TrendingUp}
                    variant="purple-pink"
                    index={2}
                    testId="text-productivity-percentage"
                  />
                  <MotionMetricCard
                    title="نقاط المكافأة"
                    value={profile.totalPoints || 0}
                    icon={Trophy}
                    variant="yellow-amber"
                    index={3}
                    testId="text-total-points"
                  />
                </ResponsiveGrid>
              </MotionSection>
            )}

            {/* Tabbed Content */}
            <MotionSection delay={0.4} className="pb-12">
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                  <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
                    <Activity className="w-4 h-4" />
                    نظرة عامة
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="gap-2" data-testid="tab-tasks">
                    <Target className="w-4 h-4" />
                    المهام
                  </TabsTrigger>
                  <TabsTrigger value="about" className="gap-2" data-testid="tab-about">
                    <Users className="w-4 h-4" />
                    عن المستخدم
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Task Breakdown */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            توزيع المهام
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <motion.div 
                            className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="font-medium">مهام معلقة</span>
                            </div>
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-pending-tasks">{pendingTasks}</span>
                          </motion.div>
                          
                          <motion.div 
                            className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                                <Code className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <span className="font-medium">مهام جارية</span>
                            </div>
                            <span className="text-xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-inprogress-tasks">{inProgressTasks}</span>
                          </motion.div>

                          <motion.div 
                            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                              <span className="font-medium">مهام مكتملة</span>
                            </div>
                            <span className="text-xl font-bold text-green-600 dark:text-green-400" data-testid="text-completed-tasks-breakdown">{completedTasks}</span>
                          </motion.div>
                        </CardContent>
                      </Card>

                      {/* Performance Stats */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            الأداء والإحصائيات
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">معدل الإنجاز</span>
                              <span className="text-sm font-bold text-primary">{productivity}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-primary to-secondary"
                                initial={{ width: 0 }}
                                animate={{ width: `${productivity}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              ></motion.div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4">
                            <motion.div 
                              className="text-center p-4 bg-muted/50 rounded-lg"
                              whileHover={{ scale: 1.05 }}
                            >
                              <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-foreground">{profile.totalPoints || 0}</p>
                              <p className="text-xs text-muted-foreground">نقاط الأداء</p>
                            </motion.div>
                            <motion.div 
                              className="text-center p-4 bg-muted/50 rounded-lg"
                              whileHover={{ scale: 1.05 }}
                            >
                              <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-foreground">A+</p>
                              <p className="text-xs text-muted-foreground">التقييم</p>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>المهام الأخيرة</CardTitle>
                        <CardDescription>آخر المهام التي تم العمل عليها</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {tasksLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="h-20 w-full" />
                            ))}
                          </div>
                        ) : tasks && tasks.length > 0 ? (
                          <div className="space-y-3">
                            {tasks.slice(0, 5).map((task: any, index: number) => (
                              <motion.div 
                                key={task.id} 
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                data-testid={`task-item-${task.id}`}
                              >
                                <div className="flex items-start gap-3">
                                  {task.status === "completed" ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                  ) : task.status === "in-progress" ? (
                                    <Code className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium break-words">{task.title}</p>
                                    <p className="text-sm text-muted-foreground break-words">{task.description}</p>
                                  </div>
                                </div>
                                <Badge variant={task.status === "completed" ? "default" : "secondary"} className="self-start sm:self-center">
                                  {task.status === "completed" ? "مكتملة" : task.status === "in-progress" ? "جارية" : "معلقة"}
                                </Badge>
                              </motion.div>
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
                  </motion.div>
                </TabsContent>

                {/* About Tab */}
                <TabsContent value="about">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>المعلومات الشخصية</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isEditing ? (
                          <motion.div 
                            className="space-y-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <div>
                              <Label htmlFor="fullName">الاسم الكامل</Label>
                              <Input
                                id="fullName"
                                value={editData.fullName || ""}
                                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                                data-testid="input-edit-fullname"
                                className="h-11 sm:h-10"
                              />
                            </div>
                            <div>
                              <Label htmlFor="department">القسم</Label>
                              <Input
                                id="department"
                                value={editData.department || ""}
                                onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                                data-testid="input-edit-department"
                                className="h-11 sm:h-10"
                              />
                            </div>
                            <div>
                              <Label htmlFor="jobTitle">المسمى الوظيفي</Label>
                              <Input
                                id="jobTitle"
                                value={editData.jobTitle || ""}
                                onChange={(e) => setEditData({ ...editData, jobTitle: e.target.value })}
                                data-testid="input-edit-jobtitle"
                                className="h-11 sm:h-10"
                              />
                            </div>
                            <div>
                              <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                              <Input
                                id="phoneNumber"
                                value={editData.phoneNumber || ""}
                                onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                                data-testid="input-edit-phone"
                                className="h-11 sm:h-10"
                              />
                            </div>
                            <div>
                              <Label htmlFor="address">العنوان</Label>
                              <Input
                                id="address"
                                value={editData.address || ""}
                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                data-testid="input-edit-address"
                                className="h-11 sm:h-10"
                              />
                            </div>
                            <div>
                              <Label htmlFor="bio">نبذة تعريفية</Label>
                              <Textarea
                                id="bio"
                                value={editData.bio || ""}
                                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                rows={4}
                                data-testid="input-edit-bio"
                                className="resize-none"
                              />
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            className="space-y-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <Label className="text-muted-foreground">الاسم الكامل</Label>
                                <p className="text-lg font-medium mt-1" data-testid="text-display-fullname">{profile.fullName}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">القسم</Label>
                                <p className="text-lg font-medium mt-1" data-testid="text-display-department">{profile.department}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">المسمى الوظيفي</Label>
                                <p className="text-lg font-medium mt-1" data-testid="text-display-jobtitle">{profile.jobTitle || "غير محدد"}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">البريد الإلكتروني</Label>
                                <p className="text-lg font-medium mt-1" data-testid="text-display-email">{profile.email}</p>
                              </div>
                              {profile.phoneNumber && (
                                <div>
                                  <Label className="text-muted-foreground">رقم الهاتف</Label>
                                  <p className="text-lg font-medium mt-1" data-testid="text-display-phone">{profile.phoneNumber}</p>
                                </div>
                              )}
                              {profile.address && (
                                <div>
                                  <Label className="text-muted-foreground">العنوان</Label>
                                  <p className="text-lg font-medium mt-1 flex items-center gap-2" data-testid="text-display-address">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    {profile.address}
                                  </p>
                                </div>
                              )}
                            </div>
                            {profile.bio && (
                              <div className="pt-4 border-t">
                                <Label className="text-muted-foreground">نبذة تعريفية</Label>
                                <p className="text-lg mt-2 leading-relaxed" data-testid="text-display-bio">{profile.bio}</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </MotionSection>
          </div>
        </main>
      </div>
    </MotionPageShell>
  );
}
