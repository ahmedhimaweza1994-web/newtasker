import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { MotionPageShell } from "@/components/ui/motion-wrappers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Send, Plus, Bot, User, ArrowRight, Search, Megaphone, Share2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AiConversation, AiMessage } from "@shared/schema";

const templates = [
  {
    id: "blog-seo",
    title: "تحسين SEO",
    icon: Search,
    prompt: "أنشئ عنواناً محسّناً لـ SEO ومقدمة جذابة لمقال عن",
  },
  {
    id: "ad-campaign",
    title: "حملة إعلانية",
    icon: Megaphone,
    prompt: "صمم حملة إعلانية كاملة مع عناوين ونصوص جذابة لـ",
  },
  {
    id: "social-media",
    title: "محتوى وسائل التواصل",
    icon: Share2,
    prompt: "اكتب منشورات لوسائل التواصل الاجتماعي عن",
  },
];

export default function AIMarketingSEO() {
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery<AiConversation[]>({
    queryKey: ["/api/ai/conversations", "marketing"],
    queryFn: () => fetch("/api/ai/conversations?modelType=marketing").then(res => res.json()),
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<AiMessage[]>({
    queryKey: ["/api/ai/conversations", currentConversationId, "messages"],
    enabled: !!currentConversationId,
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/ai/conversations", {
        method: "POST",
        body: JSON.stringify({ modelType: "marketing" }),
      });
    },
    onSuccess: (data: AiConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      setCurrentConversationId(data.id);
    },
  });

  const handleNewChat = () => {
    createConversationMutation.mutate();
  };

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || !currentConversationId || isStreaming) return;

    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: currentConversationId,
          message: messageToSend,
          modelType: "marketing",
        }),
      });

      if (!response.ok) {
        throw new Error("فشل في الحصول على الرد");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullContent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);

                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                  }
                }
              } catch (e) {
                console.error("Failed to parse streaming data:", e);
              }
            }
          }
        }
      }

      await refetchMessages();
      setStreamingContent("");
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء الإرسال",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  return (
    <MotionPageShell>
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 min-h-screen bg-gradient-to-br from-background via-background to-green-500/5 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
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
                <TrendingUp className="w-10 h-10 text-green-500" />
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  مساعد التسويق والسيو
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                محتوى تسويقي احترافي محسّن لمحركات البحث
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100%-8rem)]">
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardContent className="p-4">
                    <Button
                      onClick={handleNewChat}
                      disabled={createConversationMutation.isPending}
                      className="w-full mb-4 bg-gradient-to-r from-green-500 to-emerald-500"
                      data-testid="button-new-chat"
                    >
                      <Plus className="ml-2 h-5 w-5" />
                      مشروع جديد
                    </Button>

                    <h3 className="font-bold mb-3 text-sm">القوالب السريعة</h3>
                    <div className="space-y-2 mb-4">
                      {templates.map((template) => (
                        <Button
                          key={template.id}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            if (currentConversationId) {
                              setInput(template.prompt + " ");
                            }
                          }}
                          data-testid={`template-${template.id}`}
                        >
                          <template.icon className="ml-2 h-4 w-4" />
                          {template.title}
                        </Button>
                      ))}
                    </div>

                    <h3 className="font-bold mb-3 text-sm">المشاريع السابقة</h3>
                    <ScrollArea className="h-[calc(100%-16rem)]">
                      <div className="space-y-2">
                        {conversations.map((conversation) => (
                          <motion.button
                            key={conversation.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentConversationId(conversation.id)}
                            className={cn(
                              "w-full p-3 rounded-lg text-right transition-colors",
                              currentConversationId === conversation.id
                                ? "bg-green-500/10 border-2 border-green-500"
                                : "bg-muted hover:bg-muted/80 border-2 border-transparent"
                            )}
                            data-testid={`project-${conversation.id}`}
                          >
                            <p className="font-semibold text-sm truncate">{conversation.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(conversation.createdAt).toLocaleDateString("ar-SA")}
                            </p>
                          </motion.button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3">
                <Card className="h-full flex flex-col">
                  <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-bold text-lg">{currentConversation?.title || "مشروع جديد"}</h2>
                    </div>

                    <ScrollArea className="flex-1 mb-4" ref={scrollRef} data-testid="chat-messages">
                      {!currentConversationId ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <TrendingUp className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg mb-2">
                              مرحباً! انقر على "مشروع جديد" للبدء
                            </p>
                          </div>
                        </div>
                      ) : messages.length === 0 && !streamingContent ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <TrendingUp className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg mb-2">
                              كيف يمكنني مساعدتك في التسويق والسيو؟
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
                              transition={{ delay: index * 0.02 }}
                              className={cn(
                                "flex gap-3",
                                message.role === "user" ? "justify-end" : "justify-start"
                              )}
                            >
                              {message.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div
                                className={cn(
                                  "max-w-[75%] rounded-lg p-4",
                                  message.role === "user"
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                    : "bg-muted"
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap text-right">
                                  {message.content}
                                </p>
                              </div>
                              {message.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </motion.div>
                          ))}

                          {streamingContent && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex gap-3"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-white" />
                              </div>
                              <div className="max-w-[75%] bg-muted rounded-lg p-4">
                                <p className="text-sm whitespace-pre-wrap text-right">
                                  {streamingContent}
                                </p>
                              </div>
                            </motion.div>
                          )}

                          <AnimatePresence>
                            {isStreaming && !streamingContent && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex gap-3"
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-muted rounded-lg p-4">
                                  <div className="flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                      <motion.div
                                        key={i}
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                                        className="w-2 h-2 bg-green-500 rounded-full"
                                      />
                                    ))}
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
                        placeholder="اطلب محتوى تسويقي، عناوين، كلمات مفتاحية..."
                        className="text-right resize-none"
                        rows={3}
                        disabled={isStreaming || !currentConversationId}
                        data-testid="input-message"
                      />
                      <Button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isStreaming || !currentConversationId}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-auto"
                        data-testid="button-send"
                      >
                        <Send className="h-5 w-5" />
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
