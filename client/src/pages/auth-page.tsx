import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { CheckCircle, Users, Clock, BarChart3, Shield, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    fullName: "",
    department: "",
    jobTitle: "",
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerForm, {
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  const departments = [
    "التطوير",
    "التصميم",
    "التسويق",
    "المبيعات",
    "الموارد البشرية",
    "المحاسبة",
    "خدمة العملاء",
    "الإدارة العامة"
  ];

  const features = [
    {
      icon: Users,
      title: "إدارة الفرق",
      description: "تتبع نشاط الموظفين وإدارة المهام بكفاءة عالية"
    },
    {
      icon: Clock,
      title: "تتبع الوقت الفعلي",
      description: "مراقبة أوقات العمل والاستراحة بدقة عالية"
    },
    {
      icon: BarChart3,
      title: "تقارير وتحليلات",
      description: "رؤى شاملة عن الأداء والإنتاجية"
    },
    {
      icon: Shield,
      title: "أمان وموثوقية",
      description: "حماية بيانات موظفيك مع أعلى معايير الأمان"
    }
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-muted dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-0 flex items-center justify-center relative z-10">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div className="text-center lg:text-right mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-accent to-secondary rounded-3xl mb-6 shadow-2xl"
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-l from-primary via-accent to-secondary bg-clip-text text-transparent dark:from-primary dark:via-accent dark:to-secondary">
                  GWT إدارة المهام
                </h1>
                <p className="text-lg text-muted-foreground dark:text-gray-300 mb-8">
                  نظام شامل لإدارة المهام والموظفين مع تتبع الوقت الفعلي
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="p-6 rounded-2xl bg-card/50 dark:bg-gray-800/50 backdrop-blur-sm border border-border dark:border-gray-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary dark:text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 lg:order-2"
            >
              <div className="bg-card/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-border/50 dark:border-gray-700/50">
                <div className="flex gap-2 mb-8">
                  <Button
                    variant={isLogin ? "default" : "ghost"}
                    className={`flex-1 h-12 text-base font-semibold transition-all ${
                      isLogin 
                        ? "shadow-lg" 
                        : "text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
                    }`}
                    onClick={() => setIsLogin(true)}
                    data-testid="tab-login"
                  >
                    تسجيل الدخول
                  </Button>
                  <Button
                    variant={!isLogin ? "default" : "ghost"}
                    className={`flex-1 h-12 text-base font-semibold transition-all ${
                      !isLogin 
                        ? "shadow-lg" 
                        : "text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
                    }`}
                    onClick={() => setIsLogin(false)}
                    data-testid="tab-register"
                  >
                    حساب جديد
                  </Button>
                </div>

                <AnimatePresence mode="wait">
                  {isLogin ? (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handleLogin}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-foreground dark:text-white">البريد الإلكتروني</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="example@domain.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          required
                          autoComplete="username"
                          className="h-12 bg-background/50 dark:bg-gray-900/50 border-border dark:border-gray-600 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500"
                          data-testid="login-email-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-foreground dark:text-white">كلمة المرور</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          required
                          autoComplete="current-password"
                          className="h-12 bg-background/50 dark:bg-gray-900/50 border-border dark:border-gray-600 text-foreground dark:text-white"
                          data-testid="login-password-input"
                        />
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-l from-primary via-accent to-secondary hover:opacity-90"
                          disabled={loginMutation.isPending}
                          data-testid="login-submit-button"
                        >
                          {loginMutation.isPending ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                          ) : (
                            <span className="flex items-center gap-2">
                              تسجيل الدخول
                              <ArrowRight className="w-5 h-5" />
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handleRegister}
                      className="space-y-5"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="register-name" className="text-foreground dark:text-white">الاسم الكامل</Label>
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="أحمد محمد علي"
                          value={registerForm.fullName}
                          onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                          required
                          className="h-12 bg-background/50 dark:bg-gray-900/50 border-border dark:border-gray-600 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500"
                          data-testid="register-name-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="text-foreground dark:text-white">البريد الإلكتروني</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="example@domain.com"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          required
                          className="h-12 bg-background/50 dark:bg-gray-900/50 border-border dark:border-gray-600 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500"
                          data-testid="register-email-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-foreground dark:text-white">كلمة المرور</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="••••••••"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          required
                          autoComplete="new-password"
                          className="h-12 bg-background/50 dark:bg-gray-900/50 border-border dark:border-gray-600 text-foreground dark:text-white"
                          data-testid="register-password-input"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-department" className="text-foreground dark:text-white">القسم</Label>
                          <Select
                            value={registerForm.department}
                            onValueChange={(value) => setRegisterForm({ ...registerForm, department: value })}
                            required
                          >
                            <SelectTrigger 
                              className="h-12 bg-background/50 dark:bg-gray-900/50 border-border dark:border-gray-600 text-foreground dark:text-white" 
                              data-testid="register-department-select"
                            >
                              <SelectValue placeholder="اختر القسم" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-job" className="text-foreground dark:text-white">المسمى الوظيفي</Label>
                          <Input
                            id="register-job"
                            type="text"
                            placeholder="مطور ويب"
                            value={registerForm.jobTitle}
                            onChange={(e) => setRegisterForm({ ...registerForm, jobTitle: e.target.value })}
                            className="h-12 bg-background/50 dark:bg-gray-900/50 border-border dark:border-gray-600 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500"
                            data-testid="register-job-input"
                          />
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-l from-primary via-accent to-secondary hover:opacity-90"
                          disabled={registerMutation.isPending}
                          data-testid="register-submit-button"
                        >
                          {registerMutation.isPending ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                          ) : (
                            <span className="flex items-center gap-2">
                              إنشاء الحساب
                              <Sparkles className="w-5 h-5" />
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
