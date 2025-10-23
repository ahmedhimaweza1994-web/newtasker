import { useState } from "react";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MotionPageShell, MotionSection } from "@/components/ui/motion-wrappers";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Lightbulb, Bug, Sparkles, MessageSquare, Edit } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function SuggestionsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({
    title: "",
    description: "",
    category: "other",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<any>(null);

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["/api/suggestions"],
    enabled: !!user,
  });

  const createSuggestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/suggestions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      setIsCreateDialogOpen(false);
      setNewSuggestion({ title: "", description: "", category: "other" });
      toast({
        title: "تم إرسال المقترح بنجاح",
        description: "سيتم مراجعته من قبل الإدارة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في إرسال المقترح",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editSuggestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/suggestions/${data.id}`, {
        title: data.title,
        description: data.description,
        category: data.category,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      setIsEditDialogOpen(false);
      setEditingSuggestion(null);
      toast({
        title: "تم تحديث المقترح بنجاح",
        description: "تم حفظ التغييرات",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في تحديث المقترح",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    createSuggestionMutation.mutate(newSuggestion);
  };

  const handleEditSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    editSuggestionMutation.mutate(editingSuggestion);
  };

  const openEditDialog = (suggestion: any) => {
    setEditingSuggestion({
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
    });
    setIsEditDialogOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "improvement": return <Sparkles className="w-4 h-4" />;
      case "bug": return <Bug className="w-4 h-4" />;
      case "feature": return <Lightbulb className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "improvement": return "تحسين";
      case "bug": return "مشكلة";
      case "feature": return "ميزة جديدة";
      default: return "أخرى";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "under_review": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "موافق عليه";
      case "rejected": return "مرفوض";
      case "under_review": return "قيد المراجعة";
      default: return "قيد الانتظار";
    }
  };

  return (
    <MotionPageShell>
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300", "md:mr-16", !isCollapsed && "md:mr-64")}>
          <MotionSection delay={0.1}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                  صفحة المقترحات
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  شاركنا أفكارك و اقتراحاتك لتحسين التطبيق
                </p>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="flex items-center gap-2 h-11 sm:h-10 w-full sm:w-auto" data-testid="button-create-suggestion">
                      <Plus className="w-5 h-5" />
                      <span className="hidden sm:inline">إضافة مقترح جديد</span>
                      <span className="sm:hidden">مقترح جديد</span>
                    </Button>
                  </motion.div>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-[550px]" data-testid="dialog-create-suggestion">
                  <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl">إضافة مقترح جديد</DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleCreateSuggestion} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="suggestion-title" className="text-sm sm:text-base font-medium">عنوان المقترح *</Label>
                      <Input
                        id="suggestion-title"
                        placeholder="أدخل عنوان المقترح"
                        value={newSuggestion.title}
                        onChange={(e) => setNewSuggestion({ ...newSuggestion, title: e.target.value })}
                        required
                        data-testid="input-suggestion-title"
                        className="text-base h-11 sm:h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suggestion-category" className="text-sm sm:text-base font-medium">نوع المقترح</Label>
                      <Select
                        value={newSuggestion.category}
                        onValueChange={(value) => setNewSuggestion({ ...newSuggestion, category: value })}
                      >
                        <SelectTrigger data-testid="select-suggestion-category" className="h-11 sm:h-10">
                          <SelectValue placeholder="اختر نوع المقترح" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="improvement">تحسين</SelectItem>
                          <SelectItem value="bug">مشكلة تقنية</SelectItem>
                          <SelectItem value="feature">ميزة جديدة</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suggestion-description" className="text-sm sm:text-base font-medium">التفاصيل *</Label>
                      <Textarea
                        id="suggestion-description"
                        placeholder="اشرح مقترحك بالتفصيل..."
                        value={newSuggestion.description}
                        onChange={(e) => setNewSuggestion({ ...newSuggestion, description: e.target.value })}
                        required
                        rows={6}
                        data-testid="input-suggestion-description"
                        className="text-base resize-none"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={createSuggestionMutation.isPending}
                        data-testid="button-submit-suggestion"
                        className="flex-1 h-11 sm:h-10"
                      >
                        {createSuggestionMutation.isPending ? "جاري الإرسال..." : "إرسال المقترح"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-suggestion"
                        className="h-11 sm:h-10"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[550px]" data-testid="dialog-edit-suggestion">
                  <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl">تعديل المقترح</DialogTitle>
                  </DialogHeader>
                  
                  {editingSuggestion && (
                    <form onSubmit={handleEditSuggestion} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-suggestion-title" className="text-sm sm:text-base font-medium">عنوان المقترح *</Label>
                        <Input
                          id="edit-suggestion-title"
                          placeholder="أدخل عنوان المقترح"
                          value={editingSuggestion.title}
                          onChange={(e) => setEditingSuggestion({ ...editingSuggestion, title: e.target.value })}
                          required
                          data-testid="input-edit-suggestion-title"
                          className="text-base h-11 sm:h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-suggestion-category" className="text-sm sm:text-base font-medium">نوع المقترح</Label>
                        <Select
                          value={editingSuggestion.category}
                          onValueChange={(value) => setEditingSuggestion({ ...editingSuggestion, category: value })}
                        >
                          <SelectTrigger data-testid="select-edit-suggestion-category" className="h-11 sm:h-10">
                            <SelectValue placeholder="اختر نوع المقترح" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="improvement">تحسين</SelectItem>
                            <SelectItem value="bug">مشكلة تقنية</SelectItem>
                            <SelectItem value="feature">ميزة جديدة</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-suggestion-description" className="text-sm sm:text-base font-medium">التفاصيل *</Label>
                        <Textarea
                          id="edit-suggestion-description"
                          placeholder="اشرح مقترحك بالتفصيل..."
                          value={editingSuggestion.description}
                          onChange={(e) => setEditingSuggestion({ ...editingSuggestion, description: e.target.value })}
                          required
                          rows={6}
                          data-testid="input-edit-suggestion-description"
                          className="text-base resize-none"
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={editSuggestionMutation.isPending}
                          data-testid="button-submit-edit-suggestion"
                          className="flex-1 h-11 sm:h-10"
                        >
                          {editSuggestionMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditDialogOpen(false)}
                          data-testid="button-cancel-edit-suggestion"
                          className="h-11 sm:h-10"
                        >
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </MotionSection>

          <MotionSection delay={0.2}>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Lightbulb className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">لا توجد مقترحات بعد</h3>
                  <p className="text-muted-foreground mb-4">كن أول من يشارك اقتراحاته!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {suggestions.map((suggestion: any) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow" data-testid={`suggestion-card-${suggestion.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getCategoryIcon(suggestion.category)}
                              <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(suggestion.category)}
                              </Badge>
                              <Badge className={cn("text-xs", getStatusColor(suggestion.status))}>
                                {getStatusLabel(suggestion.status)}
                              </Badge>
                            </div>
                          </div>
                          {suggestion.userId === user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(suggestion)}
                              data-testid={`button-edit-suggestion-${suggestion.id}`}
                            >
                              <Edit className="w-4 h-4 ml-2" />
                              تعديل
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {suggestion.description}
                        </p>
                        {suggestion.adminResponse && (
                          <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">رد الإدارة:</p>
                            <p className="text-sm">{suggestion.adminResponse}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span>تم الإرسال: {new Date(suggestion.createdAt).toLocaleDateString('ar-EG')}</span>
                          {suggestion.respondedAt && (
                            <span>تم الرد: {new Date(suggestion.respondedAt).toLocaleDateString('ar-EG')}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </MotionSection>
        </main>
      </div>
    </MotionPageShell>
  );
}
