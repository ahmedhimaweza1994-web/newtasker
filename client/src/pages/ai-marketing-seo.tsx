import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { MotionPageShell } from "@/components/ui/motion-wrappers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Copy, Download, Sparkles, FileText, Megaphone, Search, Share2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Template {
  id: string;
  title: string;
  icon: any;
  description: string;
  prompt: string;
}

const templates: Template[] = [
  {
    id: "blog-seo",
    title: "تحسين SEO للمدونة",
    icon: Search,
    description: "إنشاء عناوين ومحتوى محسّن لمحركات البحث",
    prompt: "أنشئ عنواناً محسّناً لـ SEO ومقدمة جذابة لمقال عن",
  },
  {
    id: "ad-campaign",
    title: "حملة إعلانية",
    icon: Megaphone,
    description: "إنشاء نصوص إعلانية فعّالة",
    prompt: "صمم حملة إعلانية كاملة مع عناوين ونصوص جذابة لـ",
  },
  {
    id: "keywords",
    title: "تحسين الكلمات المفتاحية",
    icon: TrendingUp,
    description: "اقتراح كلمات مفتاحية قوية",
    prompt: "اقترح قائمة بالكلمات المفتاحية الأكثر فعالية لـ",
  },
  {
    id: "social-media",
    title: "محتوى وسائل التواصل",
    icon: Share2,
    description: "إنشاء منشورات جذابة",
    prompt: "اكتب منشورات لوسائل التواصل الاجتماعي (فيسبوك، تويتر، انستغرام) عن",
  },
];

export default function AIMarketingSEO() {
  const { isCollapsed } = useSidebar();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setInput(template.prompt + " ");
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setIsGenerating(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `# نتائج التحسين التسويقي

## العنوان الرئيسي:
"${input.split(' ').slice(-3).join(' ')}: دليلك الشامل لتحقيق النجاح في 2024"

## الوصف التعريفي (Meta Description):
اكتشف كل ما تحتاج معرفته عن ${input.split(' ').slice(-3).join(' ')}. دليل شامل يساعدك على تحقيق أهدافك بخطوات عملية وفعّالة. ابدأ الآن!

## الكلمات المفتاحية المقترحة:
- ${input.split(' ').slice(-3).join(' ')}
- دليل ${input.split(' ').slice(-3).join(' ')}
- أفضل طرق ${input.split(' ').slice(-3).join(' ')}
- تعلم ${input.split(' ').slice(-3).join(' ')}
- ${input.split(' ').slice(-3).join(' ')} للمبتدئين

## نموذج محتوى SEO:
### المقدمة:
في عالم اليوم المتسارع، يعتبر ${input.split(' ').slice(-3).join(' ')} أحد أهم العوامل التي تحدد النجاح. في هذا الدليل الشامل، سنستكشف معاً كل ما تحتاج معرفته لتحقيق أهدافك.

### النقاط الرئيسية:
1. **الأساسيات**: فهم المبادئ الأساسية
2. **الاستراتيجيات**: أفضل الممارسات المجربة
3. **التطبيق العملي**: خطوات واضحة وقابلة للتنفيذ
4. **قياس النجاح**: مؤشرات الأداء الرئيسية

## نصائح إضافية للتحسين:
- استخدم الكلمات المفتاحية بشكل طبيعي في المحتوى
- أضف روابط داخلية وخارجية ذات صلة
- استخدم الصور المحسّنة مع نصوص ALT واضحة
- تأكد من سرعة تحميل الصفحة`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsGenerating(false);
      setSelectedTemplate(null);
    }, 2000);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ المحتوى إلى الحافظة",
    });
  };

  return (
    <MotionPageShell>
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 min-h-screen bg-gradient-to-br from-background via-background to-green-500/5 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Link href="/ai-center">
              <Button variant="ghost" className="mb-4" data-testid="button-back">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة إلى مركز الذكاء الاصطناعي
              </Button>
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <TrendingUp className="w-12 h-12 text-green-500" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  مساعد التسويق والـ SEO
                </h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">
                أنشئ محتوى تسويقي محسّن لمحركات البحث
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4">القوالب الجاهزة</h3>
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <motion.button
                          key={template.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTemplateSelect(template)}
                          className={cn(
                            "w-full p-3 rounded-lg text-right transition-colors border-2",
                            selectedTemplate?.id === template.id
                              ? "bg-green-500/10 border-green-500"
                              : "bg-muted hover:bg-muted/80 border-transparent"
                          )}
                          data-testid={`template-${template.id}`}
                        >
                          <div className="flex items-start gap-2">
                            <template.icon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{template.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {template.description}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3">
                <Card className="h-[calc(100vh-16rem)]">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4" data-testid="chat-messages">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              اختر قالباً أو ابدأ المحادثة لإنشاء محتوى تسويقي
                            </p>
                          </div>
                        </div>
                      ) : (
                        messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                              "flex",
                              message.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] rounded-lg p-4",
                                message.role === "user"
                                  ? "bg-green-500 text-white"
                                  : "bg-muted"
                              )}
                            >
                              {message.role === "assistant" ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none text-right">
                                  <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br/>').replace(/##/g, '<strong>').replace(/\*\*/g, '<strong>').replace(/\*/g, '') }} />
                                  <div className="flex gap-2 mt-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCopy(message.content)}
                                      data-testid="button-copy-content"
                                    >
                                      <Copy className="ml-2 h-4 w-4" />
                                      نسخ
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const blob = new Blob([message.content], { type: 'text/plain' });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = 'marketing-content.txt';
                                        link.click();
                                      }}
                                      data-testid="button-download-content"
                                    >
                                      <Download className="ml-2 h-4 w-4" />
                                      تحميل
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm">{message.content}</p>
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}

                      <AnimatePresence>
                        {isGenerating && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-start"
                          >
                            <div className="bg-muted rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                  <Sparkles className="w-5 h-5 text-green-500" />
                                </motion.div>
                                <span className="text-sm text-muted-foreground">جاري إنشاء المحتوى...</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="اكتب طلبك هنا..."
                        className="text-right resize-none"
                        rows={2}
                        disabled={isGenerating}
                        data-testid="input-message"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isGenerating}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        data-testid="button-send"
                      >
                        <Sparkles className="ml-2 h-5 w-5" />
                        إرسال
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </MotionPageShell>
  );
}
