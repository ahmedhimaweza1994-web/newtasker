import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Sidebar from "@/components/sidebar";
import NavHeader from "@/components/ui/nav-header";
import {
  UserPlus,
  Edit2,
  Shield,
  Users,
  Search,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Trash2,
} from "lucide-react";
import { MotionPageShell, MotionSection, MotionMetricCard, ResponsiveGrid } from "@/components/ui/motion-wrappers";
import { motion } from "framer-motion";

const userFormSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").optional(),
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  department: z.string().min(1, "القسم مطلوب"),
  jobTitle: z.string().min(1, "المسمى الوظيفي مطلوب"),
  role: z.enum(["admin", "sub-admin", "employee"]),
  phoneNumber: z.string().optional(),
  salary: z.string().optional(),
  hireDate: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      department: "",
      jobTitle: "",
      role: "employee",
      phoneNumber: "",
      salary: "",
      hireDate: new Date().toISOString().split('T')[0],
    },
  });

  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema.omit({ password: true })),
    defaultValues: {
      email: "",
      fullName: "",
      department: "",
      jobTitle: "",
      role: "employee",
      phoneNumber: "",
      salary: "",
      hireDate: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/admin/employees", {
        ...data,
        salary: data.salary ? parseFloat(data.salary) : 0,
        hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المستخدم بنجاح",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في إضافة المستخدم",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormValues> }) => {
      const res = await apiRequest("PUT", `/api/admin/employees/${id}`, {
        ...data,
        salary: data.salary ? parseFloat(data.salary) : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث المستخدم بنجاح",
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في تحديث المستخدم",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/employees/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة المستخدم بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في تحديث حالة المستخدم",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/employees/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المستخدم بنجاح",
      });
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في حذف المستخدم",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };

  const handleUpdateUser = (data: UserFormValues) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data });
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      jobTitle: user.jobTitle || "",
      role: user.role,
      phoneNumber: user.phoneNumber || "",
      salary: user.salary || "",
      hireDate: user.hireDate ? new Date(user.hireDate).toISOString().split('T')[0] : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    toggleUserStatusMutation.mutate({
      id: user.id,
      isActive: !user.isActive,
    });
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.department.toLowerCase().includes(query) ||
      (user.jobTitle && user.jobTitle.toLowerCase().includes(query))
    );
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "sub-admin":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "مدير";
      case "sub-admin":
        return "مدير مساعد";
      default:
        return "موظف";
    }
  };

  if (currentUser?.role !== "admin" && currentUser?.role !== "sub-admin") {
    return (
      <MotionPageShell>
        <NavHeader />
        <div className="flex">
          <Sidebar />
          <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
            <div className="p-4 sm:p-6 md:p-8">
              <Card>
                <CardHeader>
                  <CardTitle>غير مصرح</CardTitle>
                  <CardDescription>ليس لديك صلاحية للوصول إلى هذه الصفحة</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </MotionPageShell>
    );
  }

  const adminCount = users.filter(u => u.role === 'admin').length;
  const subAdminCount = users.filter(u => u.role === 'sub-admin').length;
  const employeeCount = users.filter(u => u.role === 'employee').length;
  const activeCount = users.filter(u => u.isActive).length;

  return (
    <MotionPageShell>
      <NavHeader />
      <div className="flex">
        <Sidebar />
        <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
          <div className="p-4 sm:p-6 md:p-8">
            <MotionSection delay={0}>
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">إدارة المستخدمين</h1>
                <p className="text-sm sm:text-base text-muted-foreground">إدارة جميع مستخدمي النظام وصلاحياتهم</p>
              </div>
            </MotionSection>

            <MotionSection delay={0.1}>
              <ResponsiveGrid cols={{ sm: 2, md: 2, lg: 4 }} className="mb-6 sm:mb-8">
                <MotionMetricCard
                  title="إجمالي المستخدمين"
                  value={users.length}
                  subtitle={`${activeCount} نشط`}
                  icon={Users}
                  variant="primary"
                  testId="metric-total-users"
                  index={0}
                />
                <MotionMetricCard
                  title="المديرين"
                  value={adminCount}
                  subtitle="حسابات مدير"
                  icon={Shield}
                  variant="red-pink"
                  testId="metric-admins"
                  index={1}
                />
                <MotionMetricCard
                  title="مديرين مساعدين"
                  value={subAdminCount}
                  subtitle="حسابات مدير مساعد"
                  icon={Shield}
                  variant="purple-pink"
                  testId="metric-sub-admins"
                  index={2}
                />
                <MotionMetricCard
                  title="الموظفين"
                  value={employeeCount}
                  subtitle="حسابات موظف"
                  icon={Users}
                  variant="blue-cyan"
                  testId="metric-employees"
                  index={3}
                />
              </ResponsiveGrid>
            </MotionSection>

            <MotionSection delay={0.2}>
              <Card>
                <CardHeader className="border-b p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                      <div className="relative flex-1 w-full sm:max-w-md">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="بحث عن مستخدم..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pr-10 h-11 sm:h-10"
                          data-testid="input-search-users"
                        />
                      </div>
                      <Badge variant="outline" className="gap-2">
                        <Users className="h-4 w-4" />
                        {filteredUsers.length} مستخدم
                      </Badge>
                    </div>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto gap-2" data-testid="button-create-user">
                          <UserPlus className="h-4 w-4" />
                          إضافة مستخدم جديد
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                          <DialogDescription>
                            أدخل بيانات المستخدم الجديد
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...createForm}>
                          <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={createForm.control}
                                name="fullName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الاسم الكامل</FormLabel>
                                    <FormControl>
                                      <Input {...field} className="h-11 sm:h-10" data-testid="input-fullname" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={createForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>البريد الإلكتروني</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input {...field} type="email" className="pr-10 h-11 sm:h-10" data-testid="input-email" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={createForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>كلمة المرور</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="password" className="h-11 sm:h-10" placeholder="كلمة المرور" data-testid="input-password" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={createForm.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>رقم الهاتف</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input {...field} className="pr-10 h-11 sm:h-10" data-testid="input-phone" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={createForm.control}
                                name="department"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>القسم</FormLabel>
                                    <FormControl>
                                      <Input {...field} className="h-11 sm:h-10" data-testid="input-department" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={createForm.control}
                                name="jobTitle"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>المسمى الوظيفي</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Briefcase className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input {...field} className="pr-10 h-11 sm:h-10" data-testid="input-jobtitle" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={createForm.control}
                                name="role"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الصلاحية</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="h-11 sm:h-10" data-testid="select-role">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="employee">موظف</SelectItem>
                                        <SelectItem value="sub-admin">مدير مساعد</SelectItem>
                                        <SelectItem value="admin">مدير</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={createForm.control}
                                name="salary"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الراتب</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input {...field} type="number" step="0.01" className="pr-10 h-11 sm:h-10" data-testid="input-salary" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={createForm.control}
                                name="hireDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>تاريخ التعيين</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input {...field} type="date" className="pr-10 h-11 sm:h-10" data-testid="input-hiredate" />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => setIsCreateDialogOpen(false)}
                                data-testid="button-cancel-create"
                              >
                                إلغاء
                              </Button>
                              <Button type="submit" className="w-full sm:w-auto" disabled={createUserMutation.isPending} data-testid="button-submit-create">
                                {createUserMutation.isPending ? "جاري الإضافة..." : "إضافة المستخدم"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">الاسم</TableHead>
                              <TableHead className="text-right">البريد الإلكتروني</TableHead>
                              <TableHead className="text-right">القسم</TableHead>
                              <TableHead className="text-right">المسمى الوظيفي</TableHead>
                              <TableHead className="text-right">الصلاحية</TableHead>
                              <TableHead className="text-right">الحالة</TableHead>
                              <TableHead className="text-right">الإجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                  لا يوجد مستخدمين
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredUsers.map((user) => (
                                <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                                  <TableCell className="font-medium">{user.fullName}</TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell>{user.department}</TableCell>
                                  <TableCell>{user.jobTitle || "-"}</TableCell>
                                  <TableCell>
                                    <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                                      <Shield className="h-3 w-3" />
                                      {getRoleLabel(user.role)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={user.isActive}
                                        onCheckedChange={() => handleToggleStatus(user)}
                                        disabled={toggleUserStatusMutation.isPending}
                                        data-testid={`switch-status-${user.id}`}
                                      />
                                      <Label>
                                        {user.isActive ? (
                                          <Badge variant="default" className="bg-green-500">نشط</Badge>
                                        ) : (
                                          <Badge variant="secondary">غير نشط</Badge>
                                        )}
                                      </Label>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditClick(user)}
                                        className="gap-2"
                                        data-testid={`button-edit-${user.id}`}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                        تعديل
                                      </Button>
                                      {currentUser?.role === 'admin' && currentUser.id !== user.id && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setUserToDelete(user)}
                                          className="gap-2 text-destructive hover:text-destructive"
                                          data-testid={`button-delete-${user.id}`}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          حذف
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="md:hidden p-4 space-y-4">
                        {filteredUsers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            لا يوجد مستخدمين
                          </div>
                        ) : (
                          filteredUsers.map((user, index) => (
                            <motion.div
                              key={user.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card data-testid={`card-user-${user.id}`}>
                                <CardHeader className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="text-base">{user.fullName}</CardTitle>
                                      <CardDescription className="text-sm mt-1">{user.email}</CardDescription>
                                    </div>
                                    <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                                      <Shield className="h-3 w-3" />
                                      {getRoleLabel(user.role)}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">القسم:</span>
                                    <span>{user.department}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">المسمى الوظيفي:</span>
                                    <span>{user.jobTitle || "-"}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">الحالة:</span>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={user.isActive}
                                        onCheckedChange={() => handleToggleStatus(user)}
                                        disabled={toggleUserStatusMutation.isPending}
                                        data-testid={`switch-status-mobile-${user.id}`}
                                      />
                                      {user.isActive ? (
                                        <Badge variant="default" className="bg-green-500">نشط</Badge>
                                      ) : (
                                        <Badge variant="secondary">غير نشط</Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => handleEditClick(user)}
                                      data-testid={`button-edit-mobile-${user.id}`}
                                    >
                                      <Edit2 className="h-4 w-4 ml-2" />
                                      تعديل
                                    </Button>
                                    {currentUser?.role === 'admin' && currentUser.id !== user.id && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setUserToDelete(user)}
                                        className="text-destructive hover:text-destructive"
                                        data-testid={`button-delete-mobile-${user.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </MotionSection>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
                  <DialogDescription>
                    تحديث بيانات {selectedUser?.fullName}
                  </DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الاسم الكامل</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11 sm:h-10" data-testid="input-edit-fullname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>البريد الإلكتروني</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} type="email" className="pr-10 h-11 sm:h-10" disabled data-testid="input-edit-email" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم الهاتف</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pr-10 h-11 sm:h-10" data-testid="input-edit-phone" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>القسم</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11 sm:h-10" data-testid="input-edit-department" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المسمى الوظيفي</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Briefcase className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} className="pr-10 h-11 sm:h-10" data-testid="input-edit-jobtitle" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الصلاحية</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 sm:h-10" data-testid="select-edit-role">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="employee">موظف</SelectItem>
                                <SelectItem value="sub-admin">مدير مساعد</SelectItem>
                                <SelectItem value="admin">مدير</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="salary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الراتب</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} type="number" step="0.01" className="pr-10 h-11 sm:h-10" data-testid="input-edit-salary" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setIsEditDialogOpen(false);
                          setSelectedUser(null);
                        }}
                        data-testid="button-cancel-edit"
                      >
                        إلغاء
                      </Button>
                      <Button type="submit" className="w-full sm:w-auto" disabled={updateUserMutation.isPending} data-testid="button-submit-edit">
                        {updateUserMutation.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف المستخدم "{userToDelete?.fullName}" نهائياً. لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto" data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
                    className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteUserMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {deleteUserMutation.isPending ? "جاري الحذف..." : "حذف"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </MotionPageShell>
  );
}
