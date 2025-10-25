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
import { Label } from "@/components/ui/label";
import { Loader2, Download, Video, Sparkles, Play, Pause, RotateCcw, Upload, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  duration: string;
}

interface PromptHistory {
  id: string;
  prompt: string;
  timestamp: Date;
}

export default function AIVideoGenerator() {
  const { isCollapsed } = useSidebar();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    setTimeout(() => {
      const newVideo: GeneratedVideo = {
        id: Date.now().toString(),
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        prompt: prompt,
        duration: "0:30",
      };
      setGeneratedVideo(newVideo);
      setPromptHistory([{ id: Date.now().toString(), prompt, timestamp: new Date() }, ...promptHistory]);
      setIsGenerating(false);
      setPrompt("");
      setProgress(100);
    }, 3000);
  };

  return (
    <MotionPageShell>
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 min-h-screen bg-gradient-to-br from-background via-background to-blue-500/5 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
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
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <Video className="w-12 h-12 text-blue-500" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  مولد الفيديوهات بالذكاء الاصطناعي
                </h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">
                أنشئ فيديوهات مذهلة من النصوص باستخدام الذكاء الاصطناعي
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="prompt" className="text-base font-semibold mb-2 block">
                          وصف الفيديو
                        </Label>
                        <Textarea
                          id="prompt"
                          data-testid="input-video-prompt"
                          placeholder="اكتب وصفاً تفصيلياً للفيديو الذي تريد إنشاءه..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-[120px] text-right"
                          disabled={isGenerating}
                        />
                      </div>

                      <div>
                        <Label className="text-sm mb-2 block">رفع صورة أو فيديو (اختياري)</Label>
                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">اسحب وأفلت أو انقر للرفع</p>
                        </div>
                      </div>

                      <Button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                        size="lg"
                        data-testid="button-generate-video"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                            جاري الإنشاء...
                          </>
                        ) : (
                          <>
                            <Sparkles className="ml-2 h-5 w-5" />
                            إنشاء الفيديو
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <AnimatePresence>
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Card className="border-2 border-blue-500/20">
                        <CardContent className="p-8">
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <motion.div
                                animate={{
                                  rotate: 360,
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              >
                                <Video className="w-8 h-8 text-blue-500" />
                              </motion.div>
                              <div className="flex-1">
                                <p className="font-semibold mb-2">جاري إنشاء الفيديو...</p>
                                <Progress value={progress} className="h-2" />
                              </div>
                              <span className="text-2xl font-bold text-blue-500">{progress}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {generatedVideo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-4">الفيديو المنشأ</h2>
                        <div className="space-y-4">
                          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                            <video
                              src={generatedVideo.url}
                              className="w-full h-full"
                              controls
                              data-testid="video-player"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsPlaying(!isPlaying)}
                              data-testid="button-play-pause"
                            >
                              {isPlaying ? (
                                <><Pause className="ml-2 h-4 w-4" /> إيقاف</>
                              ) : (
                                <><Play className="ml-2 h-4 w-4" /> تشغيل</>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleGenerate}
                              data-testid="button-regenerate"
                            >
                              <RotateCcw className="ml-2 h-4 w-4" />
                              إعادة الإنشاء
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = generatedVideo.url;
                                link.download = `ai-video-${generatedVideo.id}.mp4`;
                                link.click();
                              }}
                              data-testid="button-download-video"
                            >
                              <Download className="ml-2 h-4 w-4" />
                              تحميل
                            </Button>
                          </div>

                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">الوصف:</p>
                            <p className="text-sm font-medium">{generatedVideo.prompt}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {!generatedVideo && !isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Video className="w-24 h-24 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">لم يتم إنشاء أي فيديو بعد</p>
                  </motion.div>
                )}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4">تفاصيل الفيديو</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">المدة</span>
                        <span className="font-medium">{generatedVideo?.duration || "-"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الدقة</span>
                        <span className="font-medium">1080p</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">معدل الإطارات</span>
                        <span className="font-medium">30 FPS</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-4">سجل الأوامر</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {promptHistory.length > 0 ? (
                        promptHistory.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => setPrompt(item.prompt)}
                          >
                            <p className="text-sm line-clamp-2 text-right">{item.prompt}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(item.timestamp).toLocaleTimeString('ar-SA')}
                            </p>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          لا يوجد سجل بعد
                        </p>
                      )}
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
