import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { MotionPageShell } from "@/components/ui/motion-wrappers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AiModelSettings } from "@shared/schema";

const MODEL_TYPES = [
  { value: "chat", label: "محادثة نصية", icon: "💬" },
  { value: "code", label: "مساعد البرمجة", icon: "💻" },
  { value: "marketing", label: "تسويق وسيو", icon: "📈" },
  { value: "image", label: "إنشاء الصور", icon: "🎨" },
  { value: "video", label: "إنشاء الفيديو", icon: "🎬" },
];

export default function AISettings() {
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const [selectedModelType, setSelectedModelType] = useState<string>("chat");
  const [apiKey, setApiKey] = useState("");
  const [isTestingKey, setIsTestingKey] = useState(false);

  const { data: allSettings, isLoading } = useQuery<AiModelSettings[]>({
    queryKey: ["/api/ai/settings"],
  });

  const { data: availableModels, refetch: refetchModels } = useQuery<any[]>({
    queryKey: ["/api/ai/models"],
    enabled: false,
  });

  const currentSettings = allSettings?.find(s => s.modelType === selectedModelType);

  const [formData, setFormData] = useState<Partial<AiModelSettings>>({
    modelId: "",
    systemPrompt: "",
    temperature: "0.7",
    topP: "1.0",
    maxTokens: 2000,
    presencePenalty: "0.0",
    frequencyPenalty: "0.0",
    isActive: true,
  });

  const updateFormData = (settings: AiModelSettings | undefined) => {
    if (settings) {
      setFormData({
        modelId: settings.modelId,
        systemPrompt: settings.systemPrompt || "",
        temperature: settings.temperature || "0.7",
        topP: settings.topP || "1.0",
        maxTokens: settings.maxTokens || 2000,
        presencePenalty: settings.presencePenalty || "0.0",
        frequencyPenalty: settings.frequencyPenalty || "0.0",
        isActive: settings.isActive ?? true,
      });
    }
  };

  const createSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/ai/settings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/settings"] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات النموذج بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/ai/settings/${selectedModelType}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/settings"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات النموذج بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحديث الإعدادات",
        variant: "destructive",
      });
    },
  });

  const handleLoadModels = async () => {
    if (!apiKey) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال API Key أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsTestingKey(true);
    try {
      const response = await apiRequest("/api/ai/models/list", {
        method: "POST",
        body: JSON.stringify({ apiKey }),
      });
      refetchModels();
      toast({
        title: "نجح",
        description: "تم تحميل قائمة النماذج المتاحة",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "API Key غير صالح أو حدث خطأ في الاتصال",
        variant: "destructive",
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSave = () => {
    const data = {
      modelType: selectedModelType,
      apiKey: apiKey || undefined,
      ...formData,
    };

    if (currentSettings) {
      updateSettingsMutation.mutate(data);
    } else {
      createSettingsMutation.mutate(data);
    }
  };

  return (
    <MotionPageShell>
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 min-h-screen bg-gradient-to-br from-background via-background to-primary/5 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-8 h-8 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold">
                  إعدادات نماذج الذكاء الاصطناعي
                </h1>
              </div>
              <p className="text-muted-foreground">
                قم بتكوين إعدادات نماذج OpenRouter للتطبيق
              </p>
            </motion.div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>اختر نوع النموذج</CardTitle>
                  <CardDescription>
                    حدد نوع النموذج الذي تريد تكوينه
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedModelType} onValueChange={(value) => {
                    setSelectedModelType(value);
                    updateFormData(allSettings?.find(s => s.modelType === value));
                  }}>
                    <TabsList className="grid grid-cols-5 w-full">
                      {MODEL_TYPES.map((type) => (
                        <TabsTrigger key={type.value} value={type.value} data-testid={`tab-${type.value}`}>
                          <span className="mr-2">{type.icon}</span>
                          {type.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>OpenRouter API Key</CardTitle>
                  <CardDescription>
                    أدخل مفتاح API من OpenRouter لتمكين النموذج
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        data-testid="input-api-key"
                      />
                      <Button
                        onClick={handleLoadModels}
                        disabled={isTestingKey || !apiKey}
                        data-testid="button-test-key"
                      >
                        {isTestingKey ? (
                          <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="ml-2 h-4 w-4" />
                        )}
                        اختبار
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      احصل على API Key من{" "}
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        OpenRouter.ai
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إعدادات النموذج</CardTitle>
                  <CardDescription>
                    قم بتخصيص معاملات النموذج
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="modelId">معرف النموذج</Label>
                    <Input
                      id="modelId"
                      value={formData.modelId}
                      onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                      placeholder="openai/gpt-4"
                      data-testid="input-model-id"
                    />
                    <p className="text-xs text-muted-foreground">
                      مثال: openai/gpt-4, anthropic/claude-3.5-sonnet, google/gemini-pro
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="systemPrompt">System Prompt</Label>
                    <Textarea
                      id="systemPrompt"
                      value={formData.systemPrompt}
                      onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                      placeholder="أنت مساعد ذكي يساعد المستخدمين..."
                      rows={4}
                      data-testid="input-system-prompt"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature ({formData.temperature})</Label>
                      <Input
                        id="temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        data-testid="input-temperature"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topP">Top P ({formData.topP})</Label>
                      <Input
                        id="topP"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.topP}
                        onChange={(e) => setFormData({ ...formData, topP: e.target.value })}
                        data-testid="input-top-p"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        min="100"
                        max="100000"
                        step="100"
                        value={formData.maxTokens}
                        onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                        data-testid="input-max-tokens"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="presencePenalty">Presence Penalty ({formData.presencePenalty})</Label>
                      <Input
                        id="presencePenalty"
                        type="number"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={formData.presencePenalty}
                        onChange={(e) => setFormData({ ...formData, presencePenalty: e.target.value })}
                        data-testid="input-presence-penalty"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">تفعيل النموذج</Label>
                      <p className="text-sm text-muted-foreground">
                        السماح للمستخدمين باستخدام هذا النموذج
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      data-testid="switch-is-active"
                    />
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={createSettingsMutation.isPending || updateSettingsMutation.isPending}
                    className="w-full"
                    data-testid="button-save-settings"
                  >
                    <Save className="ml-2 h-4 w-4" />
                    حفظ الإعدادات
                  </Button>
                </CardContent>
              </Card>

              {currentSettings && (
                <Card>
                  <CardHeader>
                    <CardTitle>الإعدادات الحالية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">النموذج:</span>
                        <span className="font-mono">{currentSettings.modelId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الحالة:</span>
                        <span className={currentSettings.isActive ? "text-green-600" : "text-red-600"}>
                          {currentSettings.isActive ? "مفعّل" : "معطّل"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">آخر تحديث:</span>
                        <span>{new Date(currentSettings.updatedAt).toLocaleDateString("ar-SA")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </MotionPageShell>
  );
}
