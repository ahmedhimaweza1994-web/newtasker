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
import { motion } from "framer-motion";
import { MotionPageShell, MotionSection, MotionMetricCard, ResponsiveGrid } from "@/components/ui/motion-wrappers";
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
    <MotionPageShell>
      <Sidebar />
      <div className={cn(
        "flex-1 transition-all duration-300",
        isCollapsed ? "mr-16" : "mr-64"
      )}>
        <Navigation title="خصومات الراتب" />
        
        <main className="p-4 md:p-6 space-y-6">
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
            <MotionMetricCard delay={0.1}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الخصومات</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-deductions">
                  {totalAmount.toFixed(2)} ر.س
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  من {myDeductions.length} خصم
                </p>
              </CardContent>
            </MotionMetricCard>

            <MotionMetricCard delay={0.2}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الأيام</CardTitle>
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-total-days">
                  {totalDays} يوم
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  أيام الخصم المطبقة
                </p>
              </CardContent>
            </MotionMetricCard>

            <MotionMetricCard delay={0.3}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">عدد الخصومات</CardTitle>
                <TrendingDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-deductions-count">
                  {myDeductions.length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  إجمالي السجلات
                </p>
              </CardContent>
            </MotionMetricCard>
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
    </MotionPageShell>
  );
}
