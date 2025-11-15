import { useState } from "react";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MotionPageShell, MotionSection } from "@/components/ui/motion-wrappers";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Bell, Shield, Palette, Database, Users, Mail } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    weeklyReports: false,
  });

  const handleSaveSettings = () => {
    toast({
      title: "تم حفظ الإعدادات",
      description: "تم تحديث إعدادات التطبيق بنجاح",
    });
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'sub-admin';

  return (
    <MotionPageShell>
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300", "md:mr-16", !isCollapsed && "md:mr-64")}>
          <MotionSection delay={0.1}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  الإعدادات
                </h1>
                <p className="text-muted-foreground">
                  إدارة إعدادات التطبيق والحساب الشخصي
                </p>
              </div>
              <SettingsIcon className="w-10 h-10 text-primary" />
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
                <TabsTrigger value="general" className="gap-2" data-testid="tab-general">
                  <SettingsIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">عام</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2" data-testid="tab-notifications">
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">الإشعارات</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2" data-testid="tab-security">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">الأمان</span>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="system" className="gap-2" data-testid="tab-system">
                    <Database className="w-4 h-4" />
                    <span className="hidden sm:inline">النظام</span>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>الإعدادات العامة</CardTitle>
                    <CardDescription>إدارة إعدادات التطبيق الأساسية</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="language">اللغة</Label>
                      <Select defaultValue="ar">
                        <SelectTrigger id="language" data-testid="select-language">
                          <SelectValue placeholder="اختر اللغة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar" data-testid="option-language-ar">العربية</SelectItem>
                          <SelectItem value="en" data-testid="option-language-en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">المنطقة الزمنية</Label>
                      <Select defaultValue="asia-riyadh">
                        <SelectTrigger id="timezone" data-testid="select-timezone">
                          <SelectValue placeholder="اختر المنطقة الزمنية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asia-riyadh" data-testid="option-timezone-asia-riyadh">الرياض (GMT+3)</SelectItem>
                          <SelectItem value="asia-dubai" data-testid="option-timezone-asia-dubai">دبي (GMT+4)</SelectItem>
                          <SelectItem value="africa-cairo" data-testid="option-timezone-africa-cairo">القاهرة (GMT+2)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>الوضع الداكن</Label>
                        <p className="text-sm text-muted-foreground">التطبيق يعمل دائماً بالوضع الداكن</p>
                      </div>
                      <Switch checked disabled data-testid="switch-dark-mode" />
                    </div>

                    <Button onClick={handleSaveSettings} data-testid="button-save-general">
                      حفظ التغييرات
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Settings */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      إعدادات الإشعارات
                    </CardTitle>
                    <CardDescription>التحكم في كيفية وصول الإشعارات إليك</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">إشعارات البريد الإلكتروني</Label>
                        <p className="text-sm text-muted-foreground">تلقي إشعارات عبر البريد الإلكتروني</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailNotifications: checked })
                        }
                        data-testid="switch-email-notifications"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notifications">الإشعارات الفورية</Label>
                        <p className="text-sm text-muted-foreground">تلقي إشعارات فورية في المتصفح</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, pushNotifications: checked })
                        }
                        data-testid="switch-push-notifications"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="task-reminders">تذكيرات المهام</Label>
                        <p className="text-sm text-muted-foreground">تلقي تذكيرات عند اقتراب موعد المهام</p>
                      </div>
                      <Switch
                        id="task-reminders"
                        checked={notifications.taskReminders}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, taskReminders: checked })
                        }
                        data-testid="switch-task-reminders"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="weekly-reports">التقارير الأسبوعية</Label>
                        <p className="text-sm text-muted-foreground">تلقي ملخص أسبوعي للأداء</p>
                      </div>
                      <Switch
                        id="weekly-reports"
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, weeklyReports: checked })
                        }
                        data-testid="switch-weekly-reports"
                      />
                    </div>

                    <Button onClick={handleSaveSettings} data-testid="button-save-notifications">
                      حفظ التغييرات
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      الأمان والخصوصية
                    </CardTitle>
                    <CardDescription>إدارة إعدادات الأمان لحسابك</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="أدخل كلمة المرور الحالية"
                        data-testid="input-current-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="أدخل كلمة المرور الجديدة"
                        data-testid="input-new-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                        data-testid="input-confirm-password"
                      />
                    </div>

                    <Button onClick={handleSaveSettings} data-testid="button-change-password">
                      تغيير كلمة المرور
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* System Settings (Admin Only) */}
              {isAdmin && (
                <TabsContent value="system">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        إعدادات النظام
                      </CardTitle>
                      <CardDescription>إعدادات متقدمة للمسؤولين فقط</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>معلومات النظام</Label>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">إصدار التطبيق</p>
                            <p className="font-medium">1.0.0</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">قاعدة البيانات</p>
                            <p className="font-medium">PostgreSQL</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>وضع الصيانة</Label>
                          <p className="text-sm text-muted-foreground">تعطيل الوصول للمستخدمين مؤقتاً</p>
                        </div>
                        <Switch data-testid="switch-maintenance-mode" />
                      </div>

                      <Button variant="destructive" data-testid="button-clear-cache">
                        مسح ذاكرة التخزين المؤقت
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </MotionSection>
        </main>
      </div>
    </MotionPageShell>
  );
}
