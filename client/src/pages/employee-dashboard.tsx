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
import { formatArabicDate } from "@/lib/arabic-date";

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
        
        <main className={cn("flex-1 p-6 sm:p-8 transition-all duration-300 bg-neural-gradient particle-bg bg-noise", "md:mr-16", !isCollapsed && "md:mr-64")}>
          {/* AI-Inspired Hero with Glass Effect */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-panel p-6 rounded-lg neon-edge-green"
          >
            <h1 className="text-display-md mb-2 gradient-text-green font-bold">
              مرحباً، {user?.fullName}
            </h1>
            <p className="text-body text-muted-foreground">
              {formatArabicDate(new Date())} • إليك ملخص يومك وأنشطتك الحالية
            </p>
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
              {/* Today's Tasks - AI Glass Design */}
              <div data-testid="card-todays-tasks" className="card-neural overflow-hidden">
                <div className="border-b border-border/20 bg-gradient-green-teal p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-heading-md text-foreground font-semibold">مهام اليوم</span>
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30">
                      {pendingTasks.length} قيد التنفيذ
                    </span>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  {pendingTasks.slice(0, 5).map((task, index) => (
                    <MotionListItem key={task.id} index={index} testId={`task-item-${task.id}`}>
                      <div className="group glass-panel p-3 rounded-md hover:neon-edge-green transition-all duration-200 hover-lift">
                        <div className="flex items-start gap-3">
                          <input 
                            type="checkbox" 
                            className="mt-1 w-4 h-4 text-primary rounded border-primary/30 focus:ring-2 focus:ring-primary/30 transition-all accent-primary" 
                            data-testid={`checkbox-task-${task.id}`} 
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-body font-medium text-foreground break-words group-hover:text-primary transition-colors">{task.title}</h4>
                            {task.description && (
                              <p className="text-body-sm text-muted-foreground mt-1 break-words line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                task.priority === 'high' ? 'bg-destructive/20 text-destructive border border-destructive/30 glow-primary-sm' :
                                task.priority === 'medium' ? 'bg-warning/20 text-warning border border-warning/30' :
                                'bg-muted/50 text-muted-foreground border border-border/30'
                              }`}>
                                {task.priority === 'high' ? 'عالي' : task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </span>
                              {task.dueDate && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatArabicDate(task.dueDate)}
                                </span>
                              )}
                            </div>
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
                </div>
              </div>

              {/* Recent Activity - AI Glass Design */}
              <div data-testid="card-recent-activity" className="card-neural overflow-hidden">
                <div className="border-b border-border/20 bg-gradient-green-teal p-4">
                  <span className="text-heading-md text-foreground font-semibold">النشاط الأخير</span>
                </div>
                <div className="space-y-3 p-4">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <MotionListItem key={notification.id} index={index} testId={`notification-${notification.id}`}>
                      <div className="glass-panel p-3 rounded-md hover:neon-edge-teal transition-all duration-200 hover-lift">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary/30 glow-primary-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-body font-medium text-foreground break-words">{notification.title}</p>
                            <p className="text-body-sm text-muted-foreground mt-1 break-words line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-tertiary mt-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatArabicDate(notification.createdAt)}
                            </p>
                          </div>
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
