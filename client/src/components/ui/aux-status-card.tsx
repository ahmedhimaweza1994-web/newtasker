import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  CheckCircle, 
  Coffee, 
  User,
  Edit3,
  CheckSquare
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDuration, auxStatusLabels } from "@/lib/arabic-utils";
import type { Task } from "@shared/schema";

interface AuxStatusCardProps {
  currentStatus: string;
  timer: number;
  isTimerRunning: boolean;
  onStatusChange: (status: string) => void;
  onEndShift: () => void;
}

export default function AuxStatusCard({
  currentStatus,
  timer,
  isTimerRunning,
  onStatusChange,
  onEndShift
}: AuxStatusCardProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [isSelectingTask, setIsSelectingTask] = useState(false);

  const { data: userTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks/my"],
  });

  const auxStatuses = [
    { id: "ready", label: "جاهز", icon: CheckCircle, color: "bg-chart-1", textColor: "text-chart-1" },
    { id: "working", label: "عمل على مشروع", icon: Play, color: "bg-primary", textColor: "text-primary" },
    { id: "personal", label: "شخصي", icon: User, color: "bg-chart-4", textColor: "text-chart-4" },
    { id: "break", label: "استراحة", icon: Coffee, color: "bg-chart-2", textColor: "text-chart-2" },
  ];

  const currentAux = auxStatuses.find(aux => aux.id === currentStatus);

  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">الحالة الحالية</CardTitle>
            <CardDescription>تتبع وقت العمل والأنشطة</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            data-testid="button-change-aux-status"
          >
            <Edit3 className="w-4 h-4 ml-2" />
            تغيير الحالة
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status Display */}
        <div className={`relative p-6 rounded-xl bg-gradient-to-br ${currentAux?.color || 'bg-muted'}/20 border border-current/20`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${currentAux?.color || 'bg-muted'} flex items-center justify-center`}>
                {currentAux?.icon && <currentAux.icon className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {currentAux?.label || auxStatusLabels[currentStatus as keyof typeof auxStatusLabels]}
                </h3>
                <p className="text-sm text-muted-foreground">الحالة النشطة</p>
              </div>
            </div>
            
            <div className="text-left">
              <div className="text-4xl font-bold text-foreground timer-display" data-testid="aux-timer">
                {formatTimer(timer)}
              </div>
              <p className="text-xs text-muted-foreground">الوقت المستغرق</p>
            </div>
          </div>

          {/* Real-time indicator */}
          {isTimerRunning && (
            <div className="absolute top-4 left-4">
              <div className="flex items-center gap-2 px-2 py-1 bg-chart-1/20 rounded-full">
                <span className="w-2 h-2 bg-chart-1 rounded-full animate-pulse"></span>
                <span className="text-xs text-chart-1 font-medium">مباشر</span>
              </div>
            </div>
          )}
        </div>

        {/* AUX Status Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {auxStatuses.map((aux) => (
            <Button
              key={aux.id}
              variant={currentStatus === aux.id ? "default" : "outline"}
              className={`h-20 flex-col gap-2 transition-all hover:scale-105 ${
                currentStatus === aux.id 
                  ? `${aux.color} text-white` 
                  : `hover:${aux.color}/10`
              }`}
              onClick={() => onStatusChange(aux.id)}
              data-testid={`button-aux-${aux.id}`}
            >
              <aux.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{aux.label}</span>
            </Button>
          ))}
        </div>

        {/* Current Task Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              المهمة الحالية
            </h4>
          </div>
          
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger className="w-full" data-testid="select-current-task">
              <SelectValue placeholder="اختر المهمة التي تعمل عليها..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="none">لا أعمل على مهمة محددة</SelectItem>
              {userTasks
                .filter((task) => task.status !== 'completed')
                .map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {task.description.substring(0, 50)}...
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                          task.status === 'under_review' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' :
                          'bg-gray-500/10 text-gray-700 dark:text-gray-400'
                        }
                      >
                        {task.status === 'in_progress' ? 'قيد التنفيذ' :
                         task.status === 'under_review' ? 'قيد المراجعة' :
                         'قيد الانتظار'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {selectedTaskId && selectedTaskId !== 'none' && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              {(() => {
                const selectedTask = userTasks.find(t => t.id === selectedTaskId);
                if (!selectedTask) return null;
                return (
                  <>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {selectedTask.title}
                    </p>
                    {selectedTask.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {selectedTask.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary"
                        className={
                          selectedTask.priority === "high" ? "bg-red-500/20 text-red-700 dark:text-red-400" :
                          selectedTask.priority === "medium" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                          "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                        }
                      >
                        {selectedTask.priority === "high" ? "أولوية عالية" :
                         selectedTask.priority === "medium" ? "أولوية متوسطة" :
                         "أولوية منخفضة"}
                      </Badge>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Timer Controls */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button 
            className="flex-1 bg-chart-1 hover:bg-chart-1/90"
            disabled={isTimerRunning}
            data-testid="button-start-timer"
          >
            <Play className="w-4 h-4 ml-2" />
            ابدأ التوقيت
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1"
            disabled={!isTimerRunning}
            data-testid="button-pause-timer"
          >
            <Pause className="w-4 h-4 ml-2" />
            إيقاف مؤقت
          </Button>
          
          <Button 
            variant="destructive" 
            className="flex-1"
            disabled={!isTimerRunning}
            onClick={onEndShift}
            data-testid="button-stop-timer"
          >
            <Square className="w-4 h-4 ml-2" />
            إيقاف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
