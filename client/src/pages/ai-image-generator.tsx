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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Maximize2, ImageIcon, Sparkles, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export default function AIImageGenerator() {
  const { isCollapsed } = useSidebar();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [imageSize, setImageSize] = useState("1024x1024");
  const [imageStyle, setImageStyle] = useState("realistic");
  const [imageQuality, setImageQuality] = useState("standard");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    setTimeout(() => {
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: `https://picsum.photos/seed/${Date.now()}/1024/1024`,
        prompt: prompt,
      };
      setImages([newImage, ...images]);
      setIsGenerating(false);
      setPrompt("");
    }, 3000);
  };

  return (
    <MotionPageShell>
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 min-h-screen bg-gradient-to-br from-background via-background to-purple-500/5 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
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
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                >
                  <ImageIcon className="w-12 h-12 text-purple-500" />
                </motion.div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  مولد الصور بالذكاء الاصطناعي
                </h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground">
                أنشئ صوراً احترافية من النصوص باستخدام الذكاء الاصطناعي
              </p>
            </motion.div>

            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="prompt" className="text-base font-semibold mb-2 block">
                      وصف الصورة
                    </Label>
                    <Textarea
                      id="prompt"
                      data-testid="input-image-prompt"
                      placeholder="اكتب وصفاً تفصيلياً للصورة التي تريد إنشاءها..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px] text-right"
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="size" className="text-sm mb-2 block">حجم الصورة</Label>
                      <Select value={imageSize} onValueChange={setImageSize} disabled={isGenerating}>
                        <SelectTrigger id="size" data-testid="select-image-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="512x512">512×512</SelectItem>
                          <SelectItem value="1024x1024">1024×1024</SelectItem>
                          <SelectItem value="1792x1024">1792×1024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="style" className="text-sm mb-2 block">النمط</Label>
                      <Select value={imageStyle} onValueChange={setImageStyle} disabled={isGenerating}>
                        <SelectTrigger id="style" data-testid="select-image-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realistic">واقعي</SelectItem>
                          <SelectItem value="artistic">فني</SelectItem>
                          <SelectItem value="cartoon">كرتوني</SelectItem>
                          <SelectItem value="3d">ثلاثي الأبعاد</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quality" className="text-sm mb-2 block">الجودة</Label>
                      <Select value={imageQuality} onValueChange={setImageQuality} disabled={isGenerating}>
                        <SelectTrigger id="quality" data-testid="select-image-quality">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">عادية</SelectItem>
                          <SelectItem value="hd">عالية الدقة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    size="lg"
                    data-testid="button-generate-image"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <Sparkles className="ml-2 h-5 w-5" />
                        إنشاء الصورة
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
                  className="mb-8"
                >
                  <Card className="border-2 border-purple-500/20">
                    <CardContent className="p-8">
                      <div className="flex flex-col items-center gap-4">
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
                          <Sparkles className="w-16 h-16 text-purple-500" />
                        </motion.div>
                        <p className="text-lg font-semibold">جاري إنشاء صورتك المذهلة...</p>
                        <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, ease: "easeInOut" }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-xl font-bold mb-4">الصور المنشأة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden group">
                        <CardContent className="p-0 relative">
                          <img
                            src={image.url}
                            alt={image.prompt}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  data-testid={`button-view-${image.id}`}
                                >
                                  <Maximize2 className="h-5 w-5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <img src={image.url} alt={image.prompt} className="w-full" />
                                <p className="text-sm text-muted-foreground mt-2">{image.prompt}</p>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="secondary"
                              size="icon"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = image.url;
                                link.download = `ai-image-${image.id}.jpg`;
                                link.click();
                              }}
                              data-testid={`button-download-${image.id}`}
                            >
                              <Download className="h-5 w-5" />
                            </Button>
                          </div>
                          <div className="p-3 bg-background/95 backdrop-blur">
                            <p className="text-sm text-muted-foreground line-clamp-2 text-right">
                              {image.prompt}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {images.length === 0 && !isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <ImageIcon className="w-24 h-24 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">لم يتم إنشاء أي صور بعد</p>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </MotionPageShell>
  );
}
