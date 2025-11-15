import { forwardRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GripVertical, Clock, User, CheckCircle2, AlertCircle } from "lucide-react";

interface TrelloCardProps {
  title: string;
  description?: string;
  badges?: Array<{ label: string; variant?: "default" | "secondary" | "destructive" | "outline" }>;
  assignee?: { name: string; avatar?: string };
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  status?: string;
  onClick?: () => void;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  testId?: string;
}

const TrelloCard = forwardRef<HTMLDivElement, TrelloCardProps>(({
  title,
  description,
  badges,
  assignee,
  dueDate,
  priority,
  status,
  onClick,
  className,
  draggable = false,
  onDragStart,
  onDragEnd,
  testId,
}, ref) => {
  const priorityColor = {
    low: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20",
    medium: "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20",
    high: "bg-red-500/10 text-red-700 dark:bg-red-500/20",
  };

  return (
    <Card
      ref={ref}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all hover-elevate active-elevate-2",
        className
      )}
      data-testid={testId}
    >
      <CardHeader className="p-3 pb-2 gap-2">
        <div className="flex items-start gap-2">
          {draggable && (
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <CardTitle className="text-sm font-medium leading-snug">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs line-clamp-2">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      {(badges && badges.length > 0) && (
        <CardContent className="p-3 pt-0">
          <div className="flex flex-wrap gap-1">
            {badges.map((badge, idx) => (
              <Badge key={idx} variant={badge.variant || "secondary"} className="text-xs">
                {badge.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}

      <CardFooter className="p-3 pt-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {priority && (
            <div className={cn(
              "px-2 py-0.5 rounded-md text-xs font-medium",
              priorityColor[priority]
            )}>
              {priority === "high" && <AlertCircle className="w-3 h-3 inline-block ml-1" />}
              {priority === "low" ? "منخفضة" : priority === "medium" ? "متوسطة" : "عالية"}
            </div>
          )}
          
          {dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{dueDate}</span>
            </div>
          )}

          {status && (
            <div className="flex items-center gap-1 text-xs">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">{status}</span>
            </div>
          )}
        </div>

        {assignee && (
          <div className="flex items-center gap-1">
            <Avatar className="w-6 h-6">
              <AvatarImage src={assignee.avatar} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-accent text-white">
                {assignee.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </CardFooter>
    </Card>
  );
});

TrelloCard.displayName = "TrelloCard";

export { TrelloCard };