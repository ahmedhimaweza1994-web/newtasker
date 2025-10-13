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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Calendar, 
  DollarSign, 
  Plus,
  CheckCircle, 
  XCircle, 
  Clock,
  CalendarDays,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LeaveRequest, SalaryAdvanceRequest } from "@shared/schema";
import { motion } from "framer-motion";
import { MotionPageShell, MotionSection, MotionMetricCard, ResponsiveGrid } from "@/components/ui/motion-wrappers";

export default function MyRequests() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isSalaryAdvanceDialogOpen, setIsSalaryAdvanceDialogOpen] = useState(false);
  
  const [leaveForm, setLeaveForm] = useState({
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });
  
  const [salaryAdvanceForm, setSalaryAdvanceForm] = useState({
    amount: '',
    reason: '',
    repaymentDate: '',
  });

  const { data: myLeaveRequests = [] } = useQuery<(LeaveRequest & { user?: any; approver?: any })[]>({
    queryKey: ["/api/leaves/my"],
  });

  const { data: mySalaryAdvanceRequests = [] } = useQuery<(SalaryAdvanceRequest & { user?: any; approver?: any })[]>({
    queryKey: ["/api/salary-advances/user"],
  });

  const createLeaveRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/leaves", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves/my"] });
      setIsLeaveDialogOpen(false);
      setLeaveForm({
        type: 'annual',
        startDate: '',
        endDate: '',
        reason: '',
      });
      toast({
        title: "تم إرسال الطلب",
        description: "تم إرسال طلب الإجازة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إرسال الطلب",
        variant: "destructive",
      });
    },
  });

  const createSalaryAdvanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/salary-advances", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salary-advances/user"] });
      setIsSalaryAdvanceDialogOpen(false);
      setSalaryAdvanceForm({
        amount: '',
        reason: '',
        repaymentDate: '',
      });
      toast({
        title: "تم إرسال الطلب",
        description: "تم إرسال طلب السلفة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إرسال الطلب",
        variant: "destructive",
      });
    },
  });

  const handleSubmitLeave = () => {
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد تاريخ البداية والنهاية",
        variant: "destructive",
      });
      return;
    }

    const startDate = new Date(leaveForm.startDate);
    const endDate = new Date(leaveForm.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    createLeaveRequestMutation.mutate({
      type: leaveForm.type,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days,
      reason: leaveForm.reason || '',
    });
  };

  const handleSubmitSalaryAdvance = () => {
    if (!salaryAdvanceForm.amount || !salaryAdvanceForm.reason) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    createSalaryAdvanceMutation.mutate(salaryAdvanceForm);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 ml-1" />موافق عليه</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" />مرفوض</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 ml-1" />قيد المراجعة</Badge>;
    }
  };

  const leaveTypeLabels: Record<string, string> = {
    annual: 'إجازة سنوية',
    sick: 'إجازة مرضية',
    maternity: 'إجازة أمومة',
    emergency: 'إجازة طارئة',
  };

  const totalLeaveRequests = myLeaveRequests.length;
  const approvedLeaveRequests = myLeaveRequests.filter(r => r.status === 'approved').length;
  const pendingLeaveRequests = myLeaveRequests.filter(r => r.status === 'pending').length;
  const totalSalaryRequests = mySalaryAdvanceRequests.length;
  const approvedSalaryRequests = mySalaryAdvanceRequests.filter(r => r.status === 'approved').length;

  return (
    <MotionPageShell>
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
          <div className="container mx-auto max-w-7xl">
            <MotionSection delay={0}>
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 sm:mb-3">
                  طلباتي
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                  يمكنك هنا تقديم طلبات الإجازات والسلف المالية ومتابعة حالتها
                </p>
              </div>
            </MotionSection>

            <MotionSection delay={0.1}>
              <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 4 }} className="mb-6 sm:mb-8">
                <MotionMetricCard
                  title="إجمالي طلبات الإجازة"
                  value={totalLeaveRequests}
                  subtitle={`${approvedLeaveRequests} موافق عليها`}
                  icon={Calendar}
                  iconColor="text-primary"
                  testId="metric-total-leave"
                  index={0}
                />
                <MotionMetricCard
                  title="طلبات قيد المراجعة"
                  value={pendingLeaveRequests}
                  subtitle="إجازات في انتظار الموافقة"
                  icon={Clock}
                  iconColor="text-yellow-600 dark:text-yellow-500"
                  testId="metric-pending-leave"
                  index={1}
                />
                <MotionMetricCard
                  title="طلبات السلف"
                  value={totalSalaryRequests}
                  subtitle={`${approvedSalaryRequests} موافق عليها`}
                  icon={DollarSign}
                  iconColor="text-accent"
                  testId="metric-total-salary"
                  index={2}
                />
                <MotionMetricCard
                  title="معدل الموافقة"
                  value={`${totalLeaveRequests > 0 ? Math.round((approvedLeaveRequests / totalLeaveRequests) * 100) : 0}%`}
                  subtitle="من طلبات الإجازة"
                  icon={TrendingUp}
                  iconColor="text-secondary"
                  testId="metric-approval-rate"
                  index={3}
                />
              </ResponsiveGrid>
            </MotionSection>

            <MotionSection delay={0.2}>
              <Tabs defaultValue="leave" className="w-full">
                <TabsList className="grid w-full max-w-full sm:max-w-md grid-cols-2 mb-4 sm:mb-6">
                  <TabsTrigger value="leave" data-testid="tab-leave-requests" className="text-sm sm:text-base">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                    <span className="hidden sm:inline">طلبات الإجازات</span>
                    <span className="sm:hidden">إجازات</span>
                  </TabsTrigger>
                  <TabsTrigger value="salary" data-testid="tab-salary-advance" className="text-sm sm:text-base">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                    <span className="hidden sm:inline">طلبات السلف</span>
                    <span className="sm:hidden">سلف</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="leave" className="space-y-4 md:space-y-6">
                  <div className="flex justify-end">
                    <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto" data-testid="button-new-leave-request">
                          <Plus className="w-4 h-4 ml-2" />
                          طلب إجازة جديد
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>طلب إجازة جديد</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="leave-type">نوع الإجازة</Label>
                            <Select
                              value={leaveForm.type}
                              onValueChange={(value) =>
                                setLeaveForm({ ...leaveForm, type: value })
                              }
                            >
                              <SelectTrigger id="leave-type" className="h-11 sm:h-10" data-testid="select-leave-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="annual">إجازة سنوية</SelectItem>
                                <SelectItem value="sick">إجازة مرضية</SelectItem>
                                <SelectItem value="maternity">إجازة أمومة</SelectItem>
                                <SelectItem value="emergency">إجازة طارئة</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="start-date">تاريخ البداية</Label>
                              <Input
                                id="start-date"
                                type="date"
                                className="h-11 sm:h-10"
                                value={leaveForm.startDate}
                                onChange={(e) =>
                                  setLeaveForm({ ...leaveForm, startDate: e.target.value })
                                }
                                data-testid="input-leave-start-date"
                              />
                            </div>
                            <div>
                              <Label htmlFor="end-date">تاريخ النهاية</Label>
                              <Input
                                id="end-date"
                                type="date"
                                className="h-11 sm:h-10"
                                value={leaveForm.endDate}
                                onChange={(e) =>
                                  setLeaveForm({ ...leaveForm, endDate: e.target.value })
                                }
                                data-testid="input-leave-end-date"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="leave-reason">السبب (اختياري)</Label>
                            <Textarea
                              id="leave-reason"
                              value={leaveForm.reason}
                              onChange={(e) =>
                                setLeaveForm({ ...leaveForm, reason: e.target.value })
                              }
                              placeholder="اذكر سبب طلب الإجازة"
                              data-testid="textarea-leave-reason"
                            />
                          </div>

                          <Button
                            onClick={handleSubmitLeave}
                            className="w-full"
                            disabled={createLeaveRequestMutation.isPending}
                            data-testid="button-submit-leave-request"
                          >
                            {createLeaveRequestMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-4">
                    {myLeaveRequests.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <CalendarDays className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">لا توجد طلبات إجازات</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ) : (
                      myLeaveRequests.map((request, index) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50" data-testid={`leave-request-${request.id}`}>
                            <CardHeader className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                <div className="flex-1">
                                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                    {leaveTypeLabels[request.type]}
                                  </CardTitle>
                                  <CardDescription className="mt-2 text-sm">
                                    {new Date(request.startDate).toLocaleDateString('ar-SA')} - {new Date(request.endDate).toLocaleDateString('ar-SA')}
                                    {' '}({request.days} أيام)
                                  </CardDescription>
                                </div>
                                {getStatusBadge(request.status)}
                              </div>
                            </CardHeader>
                            {request.reason && (
                              <CardContent className="p-4 sm:p-6 pt-0">
                                <p className="text-sm text-muted-foreground">{request.reason}</p>
                                {request.status === 'rejected' && request.rejectionReason && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-3 p-3 bg-destructive/10 rounded-md border border-destructive/20"
                                  >
                                    <p className="text-sm font-medium flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4" />
                                      سبب الرفض:
                                    </p>
                                    <p className="text-sm mt-1">{request.rejectionReason}</p>
                                  </motion.div>
                                )}
                              </CardContent>
                            )}
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="salary" className="space-y-4 md:space-y-6">
                  <div className="flex justify-end">
                    <Dialog open={isSalaryAdvanceDialogOpen} onOpenChange={setIsSalaryAdvanceDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto" data-testid="button-new-salary-advance">
                          <Plus className="w-4 h-4 ml-2" />
                          طلب سلفة جديدة
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>طلب سلفة من الراتب</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="amount">المبلغ المطلوب</Label>
                            <Input
                              id="amount"
                              type="number"
                              className="h-11 sm:h-10"
                              value={salaryAdvanceForm.amount}
                              onChange={(e) =>
                                setSalaryAdvanceForm({ ...salaryAdvanceForm, amount: e.target.value })
                              }
                              placeholder="أدخل المبلغ"
                              data-testid="input-salary-amount"
                            />
                          </div>

                          <div>
                            <Label htmlFor="repayment-date">تاريخ السداد المتوقع</Label>
                            <Input
                              id="repayment-date"
                              type="date"
                              className="h-11 sm:h-10"
                              value={salaryAdvanceForm.repaymentDate}
                              onChange={(e) =>
                                setSalaryAdvanceForm({
                                  ...salaryAdvanceForm,
                                  repaymentDate: e.target.value,
                                })
                              }
                              data-testid="input-repayment-date"
                            />
                          </div>

                          <div>
                            <Label htmlFor="salary-reason">السبب</Label>
                            <Textarea
                              id="salary-reason"
                              value={salaryAdvanceForm.reason}
                              onChange={(e) =>
                                setSalaryAdvanceForm({ ...salaryAdvanceForm, reason: e.target.value })
                              }
                              placeholder="اذكر سبب طلب السلفة"
                              data-testid="textarea-salary-reason"
                            />
                          </div>

                          <Button
                            onClick={handleSubmitSalaryAdvance}
                            className="w-full"
                            disabled={createSalaryAdvanceMutation.isPending}
                            data-testid="button-submit-salary-advance"
                          >
                            {createSalaryAdvanceMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-4">
                    {mySalaryAdvanceRequests.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">لا توجد طلبات سلف</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ) : (
                      mySalaryAdvanceRequests.map((request, index) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent/50" data-testid={`salary-advance-${request.id}`}>
                            <CardHeader className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                <div className="flex-1">
                                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                                    {parseFloat(request.amount).toFixed(2)} ريال
                                  </CardTitle>
                                  <CardDescription className="mt-2 text-sm">
                                    {request.repaymentDate && `تاريخ السداد: ${new Date(request.repaymentDate).toLocaleDateString('ar-SA')}`}
                                  </CardDescription>
                                </div>
                                {getStatusBadge(request.status)}
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                              <p className="text-sm text-muted-foreground mb-2">
                                <strong>السبب:</strong> {request.reason}
                              </p>
                              {request.status === 'rejected' && request.rejectionReason && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-3 p-3 bg-destructive/10 rounded-md border border-destructive/20"
                                >
                                  <p className="text-sm font-medium flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    سبب الرفض:
                                  </p>
                                  <p className="text-sm mt-1">{request.rejectionReason}</p>
                                </motion.div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </MotionSection>
          </div>
        </main>
      </div>
    </MotionPageShell>
  );
}
