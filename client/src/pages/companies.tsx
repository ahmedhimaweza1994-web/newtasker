import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MotionPageShell, MotionSection } from "@/components/ui/motion-wrappers";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Building2, Pencil, Trash2, Eye, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import type { SelectCompany, SelectUser } from "@shared/schema";

export default function Companies() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<SelectCompany | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: "",
    industry: "",
    description: "",
    status: "active" as "active" | "inactive" | "pending",
    managerId: "",
    startDate: "",
    endDate: "",
    logo: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");

  const { data: companies = [], isLoading: companiesLoading } = useQuery<SelectCompany[]>({
    queryKey: ["/api/companies"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<SelectUser[]>({
    queryKey: ["/api/users"],
  });

  const isLoading = companiesLoading || usersLoading;

  const createCompanyMutation = useMutation({
    mutationFn: async (companyData: any) => {
      const res = await apiRequest("POST", "/api/companies", companyData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsCreateDialogOpen(false);
      setNewCompany({
        name: "",
        industry: "",
        description: "",
        status: "active",
        managerId: "",
        startDate: "",
        endDate: "",
        logo: "",
      });
      toast({
        title: "تم إنشاء الشركة بنجاح",
        description: "تمت إضافة الشركة الجديدة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إنشاء الشركة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/companies/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsEditDialogOpen(false);
      setEditingCompany(null);
      toast({
        title: "تم تحديث الشركة بنجاح",
        description: "تم حفظ التغييرات",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث الشركة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const res = await apiRequest("DELETE", `/api/companies/${companyId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "تم حذف الشركة",
        description: "تم حذف الشركة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في حذف الشركة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();

    const companyData: any = {
      ...newCompany,
      managerId: newCompany.managerId || undefined,
    };

    if (newCompany.startDate) {
      companyData.startDate = new Date(newCompany.startDate).toISOString();
    }

    if (newCompany.endDate) {
      const endDate = new Date(newCompany.endDate);
      const startDate = newCompany.startDate ? new Date(newCompany.startDate) : new Date();
      
      if (endDate <= startDate) {
        toast({
          title: "خطأ في التاريخ",
          description: "يجب أن يكون تاريخ انتهاء العقد بعد تاريخ البدء",
          variant: "destructive",
        });
        return;
      }
      companyData.endDate = endDate.toISOString();
    }

    if (newCompany.logo) {
      companyData.logo = newCompany.logo;
    }

    createCompanyMutation.mutate(companyData);
  };

  const handleUpdateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    const companyData: any = {
      name: editingCompany.name,
      industry: editingCompany.industry,
      description: editingCompany.description,
      status: editingCompany.status,
      managerId: editingCompany.managerId || undefined,
    };

    if (editingCompany.startDate) {
      companyData.startDate = new Date(editingCompany.startDate).toISOString();
    }

    if (editingCompany.endDate) {
      companyData.endDate = new Date(editingCompany.endDate).toISOString();
    }

    if (editingCompany.logo) {
      companyData.logo = editingCompany.logo;
    }

    updateCompanyMutation.mutate({ id: editingCompany.id, data: companyData });
  };

  const handleDeleteCompany = (companyId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الشركة؟")) {
      deleteCompanyMutation.mutate(companyId);
    }
  };

  const handleEditCompany = (company: SelectCompany) => {
    setEditingCompany(company);
    setIsEditDialogOpen(true);
  };

  const industries = Array.from(new Set(companies.map(c => c.industry))).filter(Boolean);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || company.status === statusFilter;
    const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

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

  const isAdmin = user?.role === 'admin' || user?.role === 'sub-admin';

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
                  إدارة الشركات
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  تنظيم وإدارة معلومات الشركات والمشاريع
                </p>
              </div>

              {isAdmin && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="flex items-center gap-2 h-11 sm:h-10 w-full sm:w-auto" data-testid="button-create-company">
                        <Plus className="w-5 h-5" />
                        <span>إضافة شركة جديدة</span>
                      </Button>
                    </motion.div>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[550px]" data-testid="dialog-create-company">
                    <DialogHeader>
                      <DialogTitle className="text-xl sm:text-2xl">إضافة شركة جديدة</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleCreateCompany} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">اسم الشركة *</Label>
                        <Input
                          id="company-name"
                          value={newCompany.name}
                          onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                          placeholder="أدخل اسم الشركة"
                          required
                          data-testid="input-company-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company-industry">المجال *</Label>
                        <Input
                          id="company-industry"
                          value={newCompany.industry}
                          onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                          placeholder="مثال: تقنية، تسويق، صناعة"
                          required
                          data-testid="input-company-industry"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company-description">الوصف</Label>
                        <Textarea
                          id="company-description"
                          value={newCompany.description}
                          onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                          placeholder="وصف الشركة أو المشروع"
                          rows={3}
                          data-testid="input-company-description"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company-status">الحالة</Label>
                          <Select
                            value={newCompany.status}
                            onValueChange={(value: any) => setNewCompany({ ...newCompany, status: value })}
                          >
                            <SelectTrigger id="company-status" data-testid="select-company-status">
                              <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">نشطة</SelectItem>
                              <SelectItem value="inactive">غير نشطة</SelectItem>
                              <SelectItem value="pending">قيد الانتظار</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company-manager">مدير الحساب</Label>
                          <Select
                            value={newCompany.managerId || "unassigned"}
                            onValueChange={(value) => setNewCompany({ ...newCompany, managerId: value === "unassigned" ? "" : value })}
                          >
                            <SelectTrigger id="company-manager" data-testid="select-company-manager">
                              <SelectValue placeholder="اختر المدير" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">غير محدد</SelectItem>
                              {users.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company-start-date">تاريخ البدء</Label>
                          <Input
                            id="company-start-date"
                            type="date"
                            value={newCompany.startDate}
                            onChange={(e) => setNewCompany({ ...newCompany, startDate: e.target.value })}
                            data-testid="input-company-start-date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company-end-date">تاريخ انتهاء العقد</Label>
                          <Input
                            id="company-end-date"
                            type="date"
                            value={newCompany.endDate}
                            onChange={(e) => setNewCompany({ ...newCompany, endDate: e.target.value })}
                            data-testid="input-company-end-date"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company-logo">شعار الشركة</Label>
                        <Input
                          id="company-logo"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                const res = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formData,
                                  credentials: 'include',
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  setNewCompany({ ...newCompany, logo: data.url });
                                  toast({
                                    title: "تم رفع الشعار",
                                    description: "تم رفع شعار الشركة بنجاح",
                                  });
                                } else {
                                  toast({
                                    title: "خطأ في رفع الشعار",
                                    description: data.message || "حدث خطأ",
                                    variant: "destructive",
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: "خطأ في رفع الشعار",
                                  description: "حدث خطأ غير متوقع",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          data-testid="input-company-logo"
                        />
                        {newCompany.logo && (
                          <div className="mt-2">
                            <img src={newCompany.logo} alt="Logo preview" className="w-20 h-20 object-cover rounded-md" />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-end pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                          data-testid="button-cancel-create"
                        >
                          إلغاء
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createCompanyMutation.isPending}
                          data-testid="button-submit-create"
                        >
                          {createCompanyMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </MotionSection>

          <MotionSection delay={0.2}>
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>البحث</Label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="ابحث عن شركة..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                        data-testid="input-search-companies"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger data-testid="select-filter-status">
                        <SelectValue placeholder="جميع الحالات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="active">نشطة</SelectItem>
                        <SelectItem value="inactive">غير نشطة</SelectItem>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>المجال</Label>
                    <Select value={industryFilter} onValueChange={setIndustryFilter}>
                      <SelectTrigger data-testid="select-filter-industry">
                        <SelectValue placeholder="جميع المجالات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المجالات</SelectItem>
                        {industries.map(industry => (
                          <SelectItem key={industry} value={industry!}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionSection>

          <MotionSection delay={0.3}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">لا توجد شركات</p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || industryFilter !== "all"
                      ? "لم يتم العثور على شركات تطابق معايير البحث"
                      : "ابدأ بإضافة شركة جديدة"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompanies.map((company) => (
                  <motion.div
                    key={company.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full" data-testid={`card-company-${company.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          {company.logo && (
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="w-12 h-12 rounded-md object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2 line-clamp-1">{company.name}</CardTitle>
                            {getStatusBadge(company.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {company.industry && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{company.industry}</span>
                            </div>
                          )}

                          {company.managerId && (
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{getManagerName(company.managerId)}</span>
                            </div>
                          )}

                          {company.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {company.description}
                            </p>
                          )}

                          <div className="flex gap-2 pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => setLocation(`/companies/${company.id}`)}
                              data-testid={`button-view-${company.id}`}
                            >
                              <Eye className="w-4 h-4 ml-2" />
                              عرض
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditCompany(company)}
                                  data-testid={`button-edit-${company.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteCompany(company.id)}
                                  data-testid={`button-delete-${company.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </MotionSection>
        </main>
      </div>

      {editingCompany && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">تعديل الشركة</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpdateCompany} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company-name">اسم الشركة *</Label>
                <Input
                  id="edit-company-name"
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  required
                  data-testid="input-edit-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-company-industry">المجال *</Label>
                <Input
                  id="edit-company-industry"
                  value={editingCompany.industry}
                  onChange={(e) => setEditingCompany({ ...editingCompany, industry: e.target.value })}
                  required
                  data-testid="input-edit-industry"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-company-description">الوصف</Label>
                <Textarea
                  id="edit-company-description"
                  value={editingCompany.description || ""}
                  onChange={(e) => setEditingCompany({ ...editingCompany, description: e.target.value })}
                  rows={3}
                  data-testid="input-edit-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-company-status">الحالة</Label>
                  <Select
                    value={editingCompany.status}
                    onValueChange={(value: any) => setEditingCompany({ ...editingCompany, status: value })}
                  >
                    <SelectTrigger id="edit-company-status" data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشطة</SelectItem>
                      <SelectItem value="inactive">غير نشطة</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-company-manager">مدير الحساب</Label>
                  <Select
                    value={editingCompany.managerId || "unassigned"}
                    onValueChange={(value) => setEditingCompany({ ...editingCompany, managerId: value === "unassigned" ? null : value })}
                  >
                    <SelectTrigger id="edit-company-manager" data-testid="select-edit-manager">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">غير محدد</SelectItem>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-company-start-date">تاريخ البدء</Label>
                  <Input
                    id="edit-company-start-date"
                    type="date"
                    value={editingCompany.startDate ? new Date(editingCompany.startDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => setEditingCompany({ ...editingCompany, startDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    data-testid="input-edit-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company-end-date">تاريخ انتهاء العقد</Label>
                  <Input
                    id="edit-company-end-date"
                    type="date"
                    value={editingCompany.endDate ? new Date(editingCompany.endDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => setEditingCompany({ ...editingCompany, endDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    data-testid="input-edit-end-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-company-logo">شعار الشركة</Label>
                <Input
                  id="edit-company-logo"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const res = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                          credentials: 'include',
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setEditingCompany({ ...editingCompany, logo: data.url });
                          toast({
                            title: "تم رفع الشعار",
                            description: "تم رفع شعار الشركة بنجاح",
                          });
                        } else {
                          toast({
                            title: "خطأ في رفع الشعار",
                            description: data.message || "حدث خطأ",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "خطأ في رفع الشعار",
                          description: "حدث خطأ غير متوقع",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  data-testid="input-edit-logo"
                />
                {editingCompany.logo && (
                  <div className="mt-2">
                    <img src={editingCompany.logo} alt="Logo preview" className="w-20 h-20 object-cover rounded-md" />
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateCompanyMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateCompanyMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </MotionPageShell>
  );
}
