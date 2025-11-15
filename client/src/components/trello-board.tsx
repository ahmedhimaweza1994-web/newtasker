import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TrelloBoardProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

export function TrelloBoard({ children, className, testId }: TrelloBoardProps) {
  return (
    <div className={cn("h-full", className)} data-testid={testId}>
      <ScrollArea className="h-full">
        <div className="flex gap-4 p-6 h-full">
          {children}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
