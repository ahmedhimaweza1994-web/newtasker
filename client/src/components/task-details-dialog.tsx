import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Eye,
  Building2,
  MessageSquare,
  Edit,
  User,
  Users,
  Trash2,
  Trophy
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Task, User as UserType, SelectCompany } from "@shared/schema";
import { cn } from "@/lib/utils";
import { formatArabicDate } from "@/lib/arabic-date";

interface TaskDetailsDialogProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  users: UserType[];
  companies: SelectCompany[];
  getCompanyName: (companyId: string | null) => string | null;
  onDelete: () => void;
}

export function TaskDetailsDialog({ 
  taskId, 
  open, 
  onOpenChange, 
  editMode, 
  setEditMode, 
  users,
  companies,
  getCompanyName,
  onDelete 
}: TaskDetailsDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ["/api/tasks", taskId],
    enabled: !!taskId,
  });

  const { data: comments = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks", taskId, "comments"],
    enabled: !!taskId,
  });

  const [editedTask, setEditedTask] = useState<any>({});
  const [commentText, setCommentText] = useState("");

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiRequest("PUT", `/api/tasks/${taskId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setEditMode(false);
      toast({
        title: "تم تحديث المهمة",
        description: "تم حفظ التغييرات بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (text: string) =>
      apiRequest("POST", `/api/tasks/${taskId}/comments`, { content: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "comments"] });
      setCommentText("");
      toast({
        title: "تم إضافة التعليق",
        description: "تمت إضافة التعليق بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إضافة التعليق",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جاري التحميل...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSaveEdit = () => {
    const updates: any = {
      ...editedTask,
    };
    
    if (editedTask.dueDate) {
      updates.dueDate = new Date(editedTask.dueDate).toISOString();
    }
    
    updateTaskMutation.mutate(updates);
  };

  const handleStartEdit = () => {
    setEditedTask({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      assignedTo: task.assignedTo || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      companyId: task.companyId || "",
    });
    setEditMode(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "medium": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "low": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      default: return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "عالي";
      case "medium": return "متوسط";
      case "low": return "منخفض";
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "قيد الانتظار";
      case "in_progress": return "قيد التنفيذ";
      case "under_review": return "تحت المراجعة";
      case "completed": return "مكتمل";
      default: return status;
    }
  };

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'sub-admin' || task.createdBy === currentUser?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" data-testid="dialog-task-details">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <span>{editMode ? "تعديل المهمة" : "تفاصيل المهمة"}</span>
            </div>
            {!editMode && canEdit && (
              <Button variant="outline" size="sm" onClick={handleStartEdit} data-testid="button-edit-task">
                <Edit className="w-4 h-4 ml-2" />
                تعديل
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {editMode ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-title">عنوان المهمة *</Label>
                <Input
                  id="edit-title"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  data-testid="input-edit-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">الوصف</Label>
                <Textarea
                  id="edit-description"
                  value={editedTask.description}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  rows={4}
                  data-testid="textarea-edit-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">الأولوية</Label>
                  <Select value={editedTask.priority} onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}>
                    <SelectTrigger id="edit-priority" data-testid="select-edit-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-assignee">المراجع</Label>
                  <Select value={editedTask.assignedTo} onValueChange={(value) => setEditedTask({ ...editedTask, assignedTo: value })}>
                    <SelectTrigger id="edit-assignee" data-testid="select-edit-assignee">
                      <SelectValue placeholder="اختر موظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-due-date">تاريخ الاستحقاق</Label>
                  <Input
                    id="edit-due-date"
                    type="date"
                    value={editedTask.dueDate}
                    onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                    data-testid="input-edit-due-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-company">الشركة</Label>
                  <Select value={editedTask.companyId || "none"} onValueChange={(value) => setEditedTask({ ...editedTask, companyId: value === "none" ? "" : value })}>
                    <SelectTrigger id="edit-company" data-testid="select-edit-company">
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون شركة</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveEdit} disabled={updateTaskMutation.isPending} className="flex-1" data-testid="button-save-edit">
                  {updateTaskMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)} data-testid="button-cancel-edit">
                  إلغاء
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-2xl font-bold mb-2" data-testid="text-task-title">{task.title}</h3>
                {task.description && (
                  <p className="text-muted-foreground" data-testid="text-task-description">{task.description}</p>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">الحالة</Label>
                  <p className="font-medium mt-1" data-testid="text-task-status">{getStatusLabel(task.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الأولوية</Label>
                  <Badge className={cn("mt-1", getPriorityColor(task.priority))} data-testid="badge-task-priority">
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <User className="w-4 h-4" />
                    مكلفة لـ
                  </Label>
                  {(task as any).createdForUser ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={(task as any).createdForUser.profilePicture || undefined} 
                          alt={(task as any).createdForUser.fullName || "مكلفة لـ"} 
                          className="object-cover"
                        />
                        <AvatarFallback>{(task as any).createdForUser.fullName?.[0] || "م"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid="text-task-assigned">{(task as any).createdForUser.fullName}</p>
                        {(task as any).createdForUser.department && (
                          <p className="text-xs text-muted-foreground">{(task as any).createdForUser.department}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground mt-2" data-testid="text-no-assigned">غير محدد</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    المراجع
                  </Label>
                  {(task as any).assignedToUser ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={(task as any).assignedToUser.profilePicture || undefined} 
                          alt={(task as any).assignedToUser.fullName || "المراجع"} 
                          className="object-cover"
                        />
                        <AvatarFallback>{(task as any).assignedToUser.fullName?.[0] || "م"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid="text-task-reviewer">{(task as any).assignedToUser.fullName}</p>
                        {(task as any).assignedToUser.department && (
                          <p className="text-xs text-muted-foreground">{(task as any).assignedToUser.department}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground mt-2" data-testid="text-no-reviewer">غير محدد</p>
                  )}
                </div>
              </div>

              {(task.dueDate || (task.companyId && getCompanyName(task.companyId))) && (
                <div className="grid grid-cols-2 gap-4">
                  {task.dueDate && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        تاريخ الاستحقاق
                      </Label>
                      <p className="font-medium mt-1" data-testid="text-task-due-date">{formatArabicDate(task.dueDate)}</p>
                    </div>
                  )}
                  {task.companyId && getCompanyName(task.companyId) && (
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        الشركة
                      </Label>
                      <p className="font-medium mt-1" data-testid="text-task-company">{getCompanyName(task.companyId)}</p>
                    </div>
                  )}
                </div>
              )}

              {task.rewardPoints && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    نقاط المكافأة
                  </Label>
                  <p className="font-medium mt-1 flex items-center gap-2" data-testid="text-task-reward">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    {task.rewardPoints} نقطة
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    التعليقات ({comments.length})
                  </Label>
                </div>

                <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4">
                  {comments.length > 0 ? (
                    comments.map((comment: any, index: number) => (
                      <div key={comment.id} className="p-3 bg-muted/50 rounded-lg" data-testid={`comment-${comment.id || index}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage 
                              src={comment.user?.profilePicture || undefined} 
                              alt={comment.user?.fullName || "مستخدم"} 
                              className="object-cover"
                            />
                            <AvatarFallback className="text-xs">
                              {comment.user?.fullName?.[0] || "م"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">{comment.user?.fullName || "مستخدم"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatArabicDate(comment.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4" data-testid="no-comments">لا توجد تعليقات بعد</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder="اكتب تعليقك هنا..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    className="resize-none"
                    data-testid="textarea-task-comment"
                  />
                  <Button
                    onClick={() => commentText.trim() && addCommentMutation.mutate(commentText.trim())}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    className="w-full"
                    data-testid="button-add-comment"
                  >
                    {addCommentMutation.isPending ? "جاري الإضافة..." : "إضافة تعليق"}
                  </Button>
                </div>
              </div>

              {canEdit && (
                <>
                  <Separator />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={onDelete}
                    data-testid="button-delete-task-details"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف المهمة
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
