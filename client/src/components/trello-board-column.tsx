import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrelloBoardColumnProps {
  title: string;
  count?: number;
  color?: string;
  children: React.ReactNode;
  onAddClick?: () => void;
  className?: string;
  testId?: string;
}

export function TrelloBoardColumn({
  title,
  count,
  color = "bg-gradient-to-r from-primary to-accent",
  children,
  onAddClick,
  className,
  testId,
}: TrelloBoardColumnProps) {
  return (
    <div className={cn("flex flex-col w-80 shrink-0", className)} data-testid={testId}>
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-1 h-6 rounded-full", color)} />
          <h3 className="font-semibold text-sm">{title}</h3>
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {count}
            </Badge>
          )}
        </div>
        {onAddClick && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onAddClick}
            data-testid={`${testId}-add`}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {children}
      </div>
    </div>
  );
}
