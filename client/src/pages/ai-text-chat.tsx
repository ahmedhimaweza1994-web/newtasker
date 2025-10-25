import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { MotionPageShell } from "@/components/ui/motion-wrappers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Send, Trash2, Plus, Sparkles, User, Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function AITextChat() {
  const { isCollapsed } = useSidebar();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const currentChat = chats.find((c) => c.id === currentChatId);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "محادثة جديدة",
      messages: [],
      createdAt: new Date(),
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentChatId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setChats(
      chats.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              title: chat.messages.length === 0 ? input.slice(0, 30) + "..." : chat.title,
            }
          : chat
      )
    );

    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `شكراً على رسالتك! أنا مساعد ذكي يمكنني مساعدتك في مجموعة واسعة من المهام:

📝 **الكتابة والتحرير**: يمكنني مساعدتك في كتابة المقالات، الرسائل، والمحتوى الإبداعي.

💡 **الأفكار والإبداع**: أقدم أفكاراً جديدة وحلولاً إبداعية لمشاريعك.

📚 **التعلم والشرح**: أشرح المفاهيم المعقدة بطريقة بسيطة ومفهومة.

✅ **المراجعة والتصحيح**: أراجع النصوص وأصحح الأخطاء اللغوية والنحوية.

سؤالك: "${input}"

الإجابة: هذا نموذج توضيحي للمحادثة. في التطبيق الفعلي، سيتم الاتصال بنموذج الذكاء الاصطناعي لتقديم إجابات دقيقة ومفيدة. يمكنك استخدام هذه الواجهة للتفاعل مع المساعد الذكي والحصول على المساعدة في مختلف المهام.

كيف يمكنني مساعدتك اليوم؟`,
        timestamp: new Date(),
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, aiMessage] }
            : chat
        )
      );
      setIsTyping(false);
    }, 2000);
  };

  const handleClearChat = () => {
    if (currentChatId) {
      setChats(
        chats.map((chat) =>
          chat.id === currentChatId ? { ...chat, messages: [] } : chat
        )
      );
    }
  };

  useEffect(() => {
    if (chats.length === 0) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: "محادثة جديدة",
        messages: [],
        createdAt: new Date(),
      };
      setChats([newChat]);
      setCurrentChatId(newChat.id);
    }
  }, []);

  return (
    <MotionPageShell>
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 min-h-screen bg-gradient-to-br from-background via-background to-orange-500/5 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
          <div className="container mx-auto px-4 py-8 max-w-7xl h-[calc(100vh-2rem)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <FileText className="w-10 h-10 text-orange-500" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  المساعد النصي الذكي
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                مساعدك الشخصي للكتابة والإبداع
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100%-8rem)]">
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardContent className="p-4">
                    <Button
                      onClick={handleNewChat}
                      className="w-full mb-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      data-testid="button-new-chat"
                    >
                      <Plus className="ml-2 h-5 w-5" />
                      محادثة جديدة
                    </Button>

                    <h3 className="font-bold mb-3 text-sm">المحادثات السابقة</h3>
                    <ScrollArea className="h-[calc(100%-7rem)]">
                      <div className="space-y-2">
                        {chats.map((chat) => (
                          <motion.button
                            key={chat.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentChatId(chat.id)}
                            className={cn(
                              "w-full p-3 rounded-lg text-right transition-colors",
                              currentChatId === chat.id
                                ? "bg-orange-500/10 border-2 border-orange-500"
                                : "bg-muted hover:bg-muted/80 border-2 border-transparent"
                            )}
                            data-testid={`chat-${chat.id}`}
                          >
                            <p className="font-semibold text-sm truncate">{chat.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {chat.messages.length} رسالة
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
                      <h2 className="font-bold text-lg">{currentChat?.title || "محادثة جديدة"}</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearChat}
                        data-testid="button-clear-chat"
                      >
                        <Trash2 className="ml-2 h-4 w-4" />
                        مسح المحادثة
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 mb-4" data-testid="chat-messages">
                      {currentChat?.messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Bot className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg mb-2">
                              مرحباً! كيف يمكنني مساعدتك اليوم؟
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ابدأ المحادثة بسؤال أو طلب
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 pb-4">
                          {currentChat?.messages.map((message, index) => (
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
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div
                                className={cn(
                                  "max-w-[75%] rounded-lg p-4",
                                  message.role === "user"
                                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                                    : "bg-muted"
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap text-right">
                                  {message.content}
                                </p>
                                <p className="text-xs opacity-70 mt-2">
                                  {message.timestamp.toLocaleTimeString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
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
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-muted rounded-lg p-4">
                                  <div className="flex gap-1">
                                    <motion.div
                                      animate={{ y: [0, -5, 0] }}
                                      transition={{ duration: 0.6, repeat: Infinity }}
                                      className="w-2 h-2 bg-orange-500 rounded-full"
                                    />
                                    <motion.div
                                      animate={{ y: [0, -5, 0] }}
                                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                      className="w-2 h-2 bg-orange-500 rounded-full"
                                    />
                                    <motion.div
                                      animate={{ y: [0, -5, 0] }}
                                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                      className="w-2 h-2 bg-orange-500 rounded-full"
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
                        placeholder="اكتب رسالتك هنا..."
                        className="text-right resize-none"
                        rows={3}
                        disabled={isTyping}
                        data-testid="input-message"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 h-auto"
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
