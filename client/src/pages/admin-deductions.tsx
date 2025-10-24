import { useState } from "react";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  DollarSign, 
  Plus,
  Calendar,
  AlertTriangle,
  TrendingDown,
  Pencil,
  Trash2,
  Search,
  X
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SalaryDeduction, User } from "@shared/schema";
import { MotionSection, MotionMetricCard, ResponsiveGrid } from "@/components/ui/motion-wrappers";
import { formatArabicDate } from "@/lib/arabic-date";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DeductionWithUser = SalaryDeduction & {
  user?: Partial<User>;
  addedBy?: Partial<User>;
};

export default function AdminDeductions() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDeduction, setSelectedDeduction] = useState<DeductionWithUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [deductionForm, setDeductionForm] = useState({
    userId: '',
    reason: '',
    daysDeducted: '',
    amount: '',
  });

  // Fetch all deductions
  const { data: allDeductions = [], isLoading } = useQuery<DeductionWithUser[]>({
    queryKey: ["/api/deductions"],
  });

  // Fetch all users for dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Filter deductions by search term
  const filteredDeductions = allDeductions.filter(d => 
    !searchTerm || d.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalAmount = filteredDeductions.reduce((sum, d) => sum + (parseFloat(d.amount?.toString() || '0')), 0);
  const totalDays = filteredDeductions.reduce((sum, d) => sum + (d.daysDeducted || 0), 0);

  // Create deduction mutation
  const createDeductionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/deductions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deductions"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "تم إضافة الخصم",
        description: "تم إضافة الخصم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إضافة الخصم",
        variant: "destructive",
      });
    },
  });

  // Update deduction mutation
  const updateDeductionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/deductions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deductions"] });
      setIsEditDialogOpen(false);
      setSelectedDeduction(null);
      resetForm();
      toast({
        title: "تم تحديث الخصم",
        description: "تم تحديث الخصم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث الخصم",
        variant: "destructive",
      });
    },
  });

  // Delete deduction mutation
  const deleteDeductionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/deductions/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deductions"] });
      setIsDeleteDialogOpen(false);
      setSelectedDeduction(null);
      toast({
        title: "تم حذف الخصم",
        description: "تم حذف الخصم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف الخصم",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setDeductionForm({
      userId: '',
      reason: '',
      daysDeducted: '',
      amount: '',
    });
  };

  const handleCreate = () => {
    if (!deductionForm.userId || !deductionForm.reason || !deductionForm.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    createDeductionMutation.mutate({
      userId: deductionForm.userId,
      reason: deductionForm.reason,
      daysDeducted: deductionForm.daysDeducted ? parseInt(deductionForm.daysDeducted) : null,
      amount: deductionForm.amount,
    });
  };

  const handleEdit = () => {
    if (!selectedDeduction || !deductionForm.reason || !deductionForm.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    updateDeductionMutation.mutate({
      id: selectedDeduction.id,
      data: {
        reason: deductionForm.reason,
        daysDeducted: deductionForm.daysDeducted ? parseInt(deductionForm.daysDeducted) : null,
        amount: deductionForm.amount,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedDeduction) return;
    deleteDeductionMutation.mutate(selectedDeduction.id);
  };

  const openEditDialog = (deduction: DeductionWithUser) => {
    setSelectedDeduction(deduction);
    setDeductionForm({
      userId: deduction.userId,
      reason: deduction.reason,
      daysDeducted: deduction.daysDeducted?.toString() || '',
      amount: deduction.amount?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (deduction: DeductionWithUser) => {
    setSelectedDeduction(deduction);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation title="إدارة خصومات الرواتب" />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 p-4 md:p-6 space-y-6 transition-all duration-300", "md:mr-16", !isCollapsed && "md:mr-64")}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold dark:text-white">إدارة خصومات الرواتب</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                إدارة كاملة لخصومات رواتب الموظفين
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-add-deduction">
                  <Plus className="h-4 w-4" />
                  إضافة خصم جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة خصم جديد</DialogTitle>
                  <DialogDescription>
                    أضف خصماً على راتب موظف
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="userId">الموظف *</Label>
                    <Select
                      value={deductionForm.userId}
                      onValueChange={(value) => setDeductionForm({ ...deductionForm, userId: value })}
                    >
                      <SelectTrigger id="userId" data-testid="select-user">
                        <SelectValue placeholder="اختر موظفاً" />
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
                  <div>
                    <Label htmlFor="reason">سبب الخصم *</Label>
                    <Textarea
                      id="reason"
                      data-testid="input-reason"
                      placeholder="اكتب سبب الخصم..."
                      value={deductionForm.reason}
                      onChange={(e) => setDeductionForm({ ...deductionForm, reason: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="daysDeducted">عدد الأيام المخصومة (اختياري)</Label>
                    <Input
                      id="daysDeducted"
                      data-testid="input-days"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={deductionForm.daysDeducted}
                      onChange={(e) => setDeductionForm({ ...deductionForm, daysDeducted: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">مبلغ الخصم (ر.س) *</Label>
                    <Input
                      id="amount"
                      data-testid="input-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={deductionForm.amount}
                      onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                    data-testid="button-cancel-add"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createDeductionMutation.isPending}
                    data-testid="button-submit-add"
                  >
                    {createDeductionMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary Cards */}
          <ResponsiveGrid>
            <MotionMetricCard 
              title="إجمالي الخصومات"
              value={`${totalAmount.toFixed(2)} ر.س`}
              subtitle={`من ${filteredDeductions.length} خصم`}
              icon={DollarSign}
              variant="red-pink"
              index={0}
              testId="text-total-amount"
            />

            <MotionMetricCard 
              title="إجمالي الأيام"
              value={`${totalDays} يوم`}
              subtitle="أيام الخصم المطبقة"
              icon={Calendar}
              variant="orange-red"
              index={1}
              testId="text-total-days"
            />

            <MotionMetricCard 
              title="عدد الخصومات"
              value={filteredDeductions.length}
              subtitle="إجمالي السجلات"
              icon={TrendingDown}
              variant="indigo-purple"
              index={2}
              testId="text-count"
            />
          </ResponsiveGrid>

          {/* Search & Filter */}
          <MotionSection delay={0.4}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث بإسم الموظف..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                      data-testid="input-search"
                    />
                  </div>
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchTerm("")}
                      data-testid="button-clear-search"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </MotionSection>

          {/* Deductions Table */}
          <MotionSection delay={0.5}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  جميع الخصومات
                </CardTitle>
                <CardDescription>
                  إدارة كاملة لكافة خصومات رواتب الموظفين
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    جاري التحميل...
                  </div>
                ) : filteredDeductions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد خصومات مسجلة"}
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-4">
                      {filteredDeductions.map((deduction, index) => (
                        <Card key={deduction.id} className="p-4" data-testid={`card-deduction-mobile-${index}`}>
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {deduction.user?.profilePicture ? (
                                  <img
                                    src={deduction.user.profilePicture}
                                    alt={deduction.user.fullName}
                                    className="w-12 h-12 rounded-full"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-lg font-medium">
                                      {deduction.user?.fullName?.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="font-bold text-base">{deduction.user?.fullName || 'غير معروف'}</div>
                                  <div className="text-sm text-muted-foreground">{deduction.user?.department}</div>
                                </div>
                              </div>
                              <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                                {parseFloat(deduction.amount?.toString() || '0').toFixed(2)} ر.س
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-semibold text-muted-foreground">السبب: </span>
                                <span>{deduction.reason}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div>
                                  <span className="font-semibold text-muted-foreground">التاريخ: </span>
                                  <span>{formatArabicDate(deduction.createdAt)}</span>
                                </div>
                                {deduction.daysDeducted && (
                                  <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                                    {deduction.daysDeducted} يوم
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(deduction)}
                                className="flex-1"
                                data-testid={`button-edit-mobile-${index}`}
                              >
                                <Pencil className="h-4 w-4 ml-2" />
                                تعديل
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(deduction)}
                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                data-testid={`button-delete-mobile-${index}`}
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                حذف
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">الموظف</TableHead>
                            <TableHead className="text-right">السبب</TableHead>
                            <TableHead className="text-right">الأيام</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDeductions.map((deduction, index) => (
                          <TableRow key={deduction.id} data-testid={`row-deduction-${index}`}>
                            <TableCell className="font-medium" data-testid={`text-date-${index}`}>
                              {formatArabicDate(deduction.createdAt)}
                            </TableCell>
                            <TableCell data-testid={`text-user-${index}`}>
                              <div className="flex items-center gap-2">
                                {deduction.user?.profilePicture ? (
                                  <img
                                    src={deduction.user.profilePicture}
                                    alt={deduction.user.fullName}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-sm font-medium">
                                      {deduction.user?.fullName?.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{deduction.user?.fullName || 'غير معروف'}</div>
                                  <div className="text-xs text-gray-500">{deduction.user?.department}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-reason-${index}`}>
                              <div className="max-w-md">
                                {deduction.reason}
                              </div>
                            </TableCell>
                            <TableCell data-testid={`text-days-${index}`}>
                              {deduction.daysDeducted ? (
                                <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                                  {deduction.daysDeducted} يوم
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell data-testid={`text-amount-${index}`}>
                              <span className="font-bold text-red-600 dark:text-red-400">
                                {parseFloat(deduction.amount?.toString() || '0').toFixed(2)} ر.س
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(deduction)}
                                  data-testid={`button-edit-${index}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog(deduction)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                  data-testid={`button-delete-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  </>
                )}
              </CardContent>
            </Card>
          </MotionSection>
        </main>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الخصم</DialogTitle>
            <DialogDescription>
              تعديل بيانات الخصم
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-reason">سبب الخصم *</Label>
              <Textarea
                id="edit-reason"
                data-testid="input-edit-reason"
                placeholder="اكتب سبب الخصم..."
                value={deductionForm.reason}
                onChange={(e) => setDeductionForm({ ...deductionForm, reason: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-daysDeducted">عدد الأيام المخصومة (اختياري)</Label>
              <Input
                id="edit-daysDeducted"
                data-testid="input-edit-days"
                type="number"
                min="0"
                placeholder="0"
                value={deductionForm.daysDeducted}
                onChange={(e) => setDeductionForm({ ...deductionForm, daysDeducted: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-amount">مبلغ الخصم (ر.س) *</Label>
              <Input
                id="edit-amount"
                data-testid="input-edit-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={deductionForm.amount}
                onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedDeduction(null);
                resetForm();
              }}
              data-testid="button-cancel-edit"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updateDeductionMutation.isPending}
              data-testid="button-submit-edit"
            >
              {updateDeductionMutation.isPending ? "جاري التحديث..." : "تحديث"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا الخصم نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteDeductionMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
