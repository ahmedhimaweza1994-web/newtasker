import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  DollarSign, 
  Calendar,
  AlertTriangle,
  TrendingDown
} from "lucide-react";
import type { SalaryDeduction } from "@shared/schema";
import { MotionSection, MotionMetricCard, ResponsiveGrid } from "@/components/ui/motion-wrappers";
import { formatArabicDate } from "@/lib/arabic-date";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MyDeductions() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const { data: myDeductions = [], isLoading } = useQuery<SalaryDeduction[]>({
    queryKey: ["/api/deductions/user"],
  });

  // Calculate total deductions
  const totalAmount = myDeductions.reduce((sum, d) => sum + (parseFloat(d.amount?.toString() || '0')), 0);
  const totalDays = myDeductions.reduce((sum, d) => sum + (d.daysDeducted || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation title="خصومات الراتب" />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 p-4 md:p-6 space-y-6 transition-all duration-300", "md:mr-16", !isCollapsed && "md:mr-64")}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold dark:text-white">خصومات الراتب</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                عرض كافة الخصومات المطبقة على راتبك
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <ResponsiveGrid>
            <MotionMetricCard 
              title="إجمالي الخصومات"
              value={`${totalAmount.toFixed(2)} ر.س`}
              subtitle={`من ${myDeductions.length} خصم`}
              icon={DollarSign}
              variant="red-pink"
              index={0}
              testId="text-total-deductions"
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
              value={myDeductions.length}
              subtitle="إجمالي السجلات"
              icon={TrendingDown}
              variant="indigo-purple"
              index={2}
              testId="text-deductions-count"
            />
          </ResponsiveGrid>

          {/* Deductions Table */}
          <MotionSection delay={0.4}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  سجل الخصومات
                </CardTitle>
                <CardDescription>
                  جميع الخصومات المطبقة على راتبك
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    جاري التحميل...
                  </div>
                ) : myDeductions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    لا توجد خصومات مسجلة
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">التاريخ</TableHead>
                          <TableHead className="text-right">السبب</TableHead>
                          <TableHead className="text-right">الأيام المخصومة</TableHead>
                          <TableHead className="text-right">المبلغ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myDeductions.map((deduction, index) => (
                          <TableRow key={deduction.id} data-testid={`row-deduction-${index}`}>
                            <TableCell className="font-medium" data-testid={`text-date-${index}`}>
                              {formatArabicDate(deduction.createdAt)}
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </MotionSection>
        </main>
      </div>
    </div>
  );
}
