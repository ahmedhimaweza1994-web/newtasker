import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import AuxStatusTracker from "@/components/aux-status-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MotionPageShell, MotionSection, MotionMetricCard, ResponsiveGrid, MotionListItem } from "@/components/ui/motion-wrappers";
import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle2, TrendingUp, Coffee } from "lucide-react";
import { motion } from "framer-motion";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  // Fetch user tasks
  const { data: myTasks = [] } = useQuery({
    queryKey: ["/api/tasks/my"],
  });

  const { data: assignedTasks = [] } = useQuery({
    queryKey: ["/api/tasks/assigned"],
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const completedTasks = [...myTasks, ...assignedTasks].filter(task => task.status === 'completed');
  const pendingTasks = [...myTasks, ...assignedTasks].filter(task => task.status === 'pending');

  return (
    <MotionPageShell>
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300", "lg:mr-16", !isCollapsed && "lg:mr-64")}>
          {/* Welcome Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                مرحباً، {user?.fullName}! 👋
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                إليك ملخص يومك وأنشطتك الحالية
              </p>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 4 }} className="mb-6 md:mb-8">
            <MotionMetricCard
              title="ساعات اليوم"
              value="7:45"
              subtitle="+1.2 ساعة من أمس"
              icon={Clock}
              variant="blue-cyan"
              index={0}
              testId="card-daily-hours"
            />
            <MotionMetricCard
              title="مهام مكتملة"
              value={completedTasks.length}
              subtitle={`من ${myTasks.length + assignedTasks.length} مهمة`}
              icon={CheckCircle2}
              variant="green-emerald"
              index={1}
              testId="card-completed-tasks"
            />
            <MotionMetricCard
              title="الإنتاجية"
              value="87%"
              subtitle="+5% من الأسبوع الماضي"
              icon={TrendingUp}
              variant="purple-pink"
              index={2}
              testId="card-productivity"
            />
            <MotionMetricCard
              title="وقت الاستراحة"
              value="45 د"
              subtitle="طبيعي"
              icon={Coffee}
              variant="orange-red"
              index={3}
              testId="card-break-time"
            />
          </ResponsiveGrid>

          {/* AUX Status Tracker */}
          <MotionSection delay={0.4} className="mb-6 md:mb-8">
            <AuxStatusTracker />
          </MotionSection>

          {/* Tasks and Activity */}
          <MotionSection delay={0.5}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Today's Tasks */}
              <Card data-testid="card-todays-tasks" className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span>مهام اليوم</span>
                    <span className="text-sm text-muted-foreground">
                      {pendingTasks.length} قيد التنفيذ
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingTasks.slice(0, 5).map((task, index) => (
                    <MotionListItem key={task.id} index={index} testId={`task-item-${task.id}`}>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <input type="checkbox" className="mt-1 w-4 h-4 text-primary rounded" data-testid={`checkbox-task-${task.id}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground break-words">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1 break-words">
                              {task.description.substring(0, 100)}...
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              task.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                              task.priority === 'medium' ? 'bg-warning/20 text-warning' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                موعد: {new Date(task.dueDate).toLocaleDateString('ar-EG')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </MotionListItem>
                  ))}
                  
                  {pendingTasks.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 text-muted-foreground"
                    >
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-success" />
                      <p>رائع! لا توجد مهام معلقة</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card data-testid="card-recent-activity" className="overflow-hidden">
                <CardHeader>
                  <CardTitle>النشاط الأخير</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <MotionListItem key={notification.id} index={index} testId={`notification-${notification.id}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground break-words">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 break-words">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    </MotionListItem>
                  ))}

                  {notifications.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 text-muted-foreground"
                    >
                      <p>لا توجد إشعارات جديدة</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          </MotionSection>
        </main>
      </div>
    </MotionPageShell>
  );
}
