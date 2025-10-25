import { useState } from "react";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { MotionPageShell, MotionSection } from "@/components/ui/motion-wrappers";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  TrendingUp, 
  FileText, 
  Code,
  Brain,
  Zap
} from "lucide-react";

const modelCards = [
  {
    id: "image-model",
    title: "موديل انشاء الصور",
    icon: ImageIcon,
    description: "إنشاء صور احترافية باستخدام الذكاء الاصطناعي",
    gradient: "from-purple-500 to-pink-500",
    href: "#",
  },
  {
    id: "video-model",
    title: "موديل انشاء الفيديوهات",
    icon: Video,
    description: "إنتاج فيديوهات مذهلة بتقنيات متقدمة",
    gradient: "from-blue-500 to-cyan-500",
    href: "#",
  },
  {
    id: "marketing-model",
    title: "موديل التسويق والسيو",
    icon: TrendingUp,
    description: "تحسين المحتوى وزيادة التفاعل",
    gradient: "from-green-500 to-emerald-500",
    href: "#",
  },
  {
    id: "text-model",
    title: "موديل النصي",
    icon: FileText,
    description: "كتابة وتحرير نصوص بذكاء اصطناعي",
    gradient: "from-orange-500 to-red-500",
    href: "#",
  },
  {
    id: "code-model",
    title: "موديل البرمجة",
    icon: Code,
    description: "كتابة وتطوير الأكواد البرمجية",
    gradient: "from-indigo-500 to-purple-500",
    href: "#",
  },
];

export default function AICenter() {
  const { isCollapsed } = useSidebar();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <MotionPageShell>
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 min-h-screen bg-gradient-to-br from-background via-background to-primary/5 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <MotionSection delay={0.1} className="text-center mb-12">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block mb-6"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Brain className="w-24 h-24 text-primary mx-auto" />
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="w-8 h-8 text-accent" />
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                    className="absolute -bottom-2 -left-2"
                  >
                    <Zap className="w-8 h-8 text-yellow-500" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4"
              >
                مركز الذكاء الاصطناعي
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-muted-foreground max-w-2xl mx-auto"
              >
                اكتشف قوة الذكاء الاصطناعي مع مجموعة متنوعة من النماذج المتخصصة
              </motion.p>
            </MotionSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modelCards.map((model, index) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  onHoverStart={() => setHoveredCard(model.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                >
                  <a href={model.href} data-testid={`card-${model.id}`}>
                    <Card className={cn(
                      "h-full overflow-hidden cursor-pointer transition-all duration-300 border-2",
                      hoveredCard === model.id ? "shadow-2xl border-primary" : "shadow-lg border-transparent"
                    )}>
                      <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                          <motion.div
                            animate={hoveredCard === model.id ? {
                              rotate: [0, 360],
                              scale: [1, 1.2, 1],
                            } : {}}
                            transition={{ duration: 2 }}
                          >
                            <model.icon className="w-full h-full" />
                          </motion.div>
                        </div>

                        <motion.div
                          animate={hoveredCard === model.id ? {
                            scale: [1, 1.1, 1],
                          } : {}}
                          transition={{ duration: 0.5 }}
                          className={cn(
                            "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center mb-4 relative z-10",
                            model.gradient
                          )}
                        >
                          <model.icon className="w-8 h-8 text-white" />
                        </motion.div>

                        <h3 className="text-xl font-bold mb-2 relative z-10">
                          {model.title}
                        </h3>

                        <p className="text-muted-foreground relative z-10">
                          {model.description}
                        </p>

                        <motion.div
                          initial={{ width: 0 }}
                          animate={hoveredCard === model.id ? { width: "100%" } : { width: 0 }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                            "h-1 bg-gradient-to-r mt-4 rounded-full",
                            model.gradient
                          )}
                        />
                      </CardContent>
                    </Card>
                  </a>
                </motion.div>
              ))}
            </div>

            <MotionSection delay={0.8} className="mt-16 text-center">
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-block"
              >
                <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                  <h3 className="text-2xl font-bold mb-2">
                    🚀 المزيد قريباً
                  </h3>
                  <p className="text-muted-foreground">
                    نعمل على تطوير المزيد من النماذج المتقدمة لخدمتك
                  </p>
                </div>
              </motion.div>
            </MotionSection>
          </div>
        </main>
      </div>
    </MotionPageShell>
  );
}
