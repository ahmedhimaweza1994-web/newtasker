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
import { Code, Send, Copy, Maximize2, Bot, User, BookOpen, Save, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  code?: {
    language: string;
    code: string;
  };
  timestamp: Date;
}

interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  description: string;
}

const languages = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "typescript", label: "TypeScript" },
  { value: "php", label: "PHP" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
];

const sampleSnippets: Snippet[] = [
  {
    id: "1",
    title: "دالة فرز مصفوفة",
    language: "javascript",
    code: `function sortArray(arr) {
  return arr.sort((a, b) => a - b);
}`,
    description: "دالة بسيطة لفرز المصفوفات",
  },
  {
    id: "2",
    title: "اتصال بقاعدة البيانات",
    language: "python",
    code: `import sqlite3

def connect_db():
    conn = sqlite3.connect('database.db')
    return conn`,
    description: "كود للاتصال بقاعدة بيانات SQLite",
  },
];

export default function AICodeAssistant() {
  const { isCollapsed } = useSidebar();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [snippets, setSnippets] = useState<Snippet[]>(sampleSnippets);
  const { toast } = useToast();

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
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `بالتأكيد! سأساعدك في كتابة الكود. إليك مثال باستخدام ${
          languages.find((l) => l.value === selectedLanguage)?.label || "JavaScript"
        }:`,
        code: {
          language: selectedLanguage,
          code: `// مثال على الكود ${selectedLanguage === "javascript" ? "JavaScript" : selectedLanguage}
function example() {
  // هذا نموذج توضيحي
  const result = "مرحباً بك في مساعد البرمجة";
  console.log(result);
  return result;
}

// استدعاء الدالة
example();`,
        },
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ الكود إلى الحافظة",
    });
  };

  const handleSaveSnippet = (code: string, language: string) => {
    const newSnippet: Snippet = {
      id: Date.now().toString(),
      title: `مقتطف ${language} جديد`,
      language,
      code,
      description: "تم الحفظ من المحادثة",
    };
    setSnippets([newSnippet, ...snippets]);
    toast({
      title: "تم الحفظ!",
      description: "تم حفظ المقتطف في المكتبة",
    });
  };

  return (
    <MotionPageShell>
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 min-h-screen bg-gradient-to-br from-background via-background to-indigo-500/5 dark:bg-gray-950 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
          <div className="container mx-auto px-4 py-8 max-w-7xl h-[calc(100vh-2rem)]">
            <Link href="/ai-center">
              <Button variant="ghost" className="mb-4" data-testid="button-back">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة إلى مركز الذكاء الاصطناعي
              </Button>
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Code className="w-10 h-10 text-indigo-500" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  مساعد البرمجة الذكي
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                اكتب كود احترافي بمساعدة الذكاء الاصطناعي
              </p>
            </motion.div>

            <Tabs defaultValue="chat" className="h-[calc(100%-8rem)]">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-4">
                <TabsTrigger value="chat" data-testid="tab-chat">المحادثة</TabsTrigger>
                <TabsTrigger value="snippets" data-testid="tab-snippets">مكتبة الأكواد</TabsTrigger>
                <TabsTrigger value="projects" data-testid="tab-projects">المشاريع</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="h-[calc(100%-3rem)]">
                <Card className="h-full flex flex-col dark:bg-gray-900">
                  <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">لغة البرمجة:</span>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger className="w-[180px]" data-testid="select-language">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <ScrollArea className="flex-1 mb-4" data-testid="chat-messages">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Code className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg mb-2">
                              مرحباً! كيف يمكنني مساعدتك في البرمجة؟
                            </p>
                            <p className="text-sm text-muted-foreground">
                              اطلب مني كتابة أو شرح أي كود برمجي
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 pb-4">
                          {messages.map((message, index) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={cn(
                                "flex gap-3",
                                message.role === "user" ? "justify-end" : "justify-start"
                              )}
                            >
                              {message.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div className="max-w-[85%]">
                                <div
                                  className={cn(
                                    "rounded-lg p-4 mb-2",
                                    message.role === "user"
                                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                                      : "bg-muted dark:bg-gray-800"
                                  )}
                                >
                                  <p className="text-sm whitespace-pre-wrap text-right">
                                    {message.content}
                                  </p>
                                </div>

                                {message.code && (
                                  <Card className="mt-2 dark:bg-gray-950">
                                    <CardContent className="p-0">
                                      <div className="flex items-center justify-between bg-muted dark:bg-gray-800 px-4 py-2 rounded-t-lg border-b dark:border-gray-700">
                                        <span className="text-xs font-mono text-muted-foreground">
                                          {message.code.language}
                                        </span>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleCopyCode(message.code!.code)}
                                            data-testid="button-copy-code"
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                              handleSaveSnippet(
                                                message.code!.code,
                                                message.code!.language
                                              )
                                            }
                                            data-testid="button-save-snippet"
                                          >
                                            <Save className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      <pre className="p-4 overflow-x-auto bg-gray-950 text-gray-100 rounded-b-lg">
                                        <code className="text-sm font-mono">{message.code.code}</code>
                                      </pre>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                              {message.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </motion.div>
                          ))}

                          <AnimatePresence>
                            {isTyping && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex gap-3"
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-muted dark:bg-gray-800 rounded-lg p-4">
                                  <div className="flex gap-1">
                                    <motion.div
                                      animate={{ y: [0, -5, 0] }}
                                      transition={{ duration: 0.6, repeat: Infinity }}
                                      className="w-2 h-2 bg-indigo-500 rounded-full"
                                    />
                                    <motion.div
                                      animate={{ y: [0, -5, 0] }}
                                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                      className="w-2 h-2 bg-indigo-500 rounded-full"
                                    />
                                    <motion.div
                                      animate={{ y: [0, -5, 0] }}
                                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                      className="w-2 h-2 bg-indigo-500 rounded-full"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </ScrollArea>

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
                        placeholder="اطلب مني كتابة أو شرح أي كود..."
                        className="text-right resize-none font-mono dark:bg-gray-800"
                        rows={3}
                        disabled={isTyping}
                        data-testid="input-message"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 h-auto"
                        data-testid="button-send"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="snippets" className="h-[calc(100%-3rem)]">
                <Card className="h-full dark:bg-gray-900">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-indigo-500" />
                      مكتبة المقتطفات البرمجية
                    </h2>
                    <ScrollArea className="h-[calc(100%-4rem)]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {snippets.map((snippet) => (
                          <motion.div
                            key={snippet.id}
                            whileHover={{ scale: 1.02 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <Card className="dark:bg-gray-800 hover:border-indigo-500 transition-colors">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold">{snippet.title}</h3>
                                  <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded">
                                    {snippet.language}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {snippet.description}
                                </p>
                                <pre className="bg-gray-950 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                                  <code className="font-mono">{snippet.code}</code>
                                </pre>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 w-full"
                                  onClick={() => handleCopyCode(snippet.code)}
                                >
                                  <Copy className="ml-2 h-4 w-4" />
                                  نسخ الكود
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="h-[calc(100%-3rem)]">
                <Card className="h-full dark:bg-gray-900">
                  <CardContent className="p-6 flex items-center justify-center h-full">
                    <div className="text-center">
                      <Code className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg mb-2">المشاريع المحفوظة</p>
                      <p className="text-sm text-muted-foreground">
                        سيتم إضافة هذه الميزة قريباً
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </MotionPageShell>
  );
}
