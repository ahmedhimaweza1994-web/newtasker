import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden">
          <table className={cn("min-w-full divide-y divide-border", className)}>
            {children}
          </table>
        </div>
      </div>
    </div>
  );
}

interface MobileCardWrapperProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardWrapper({ children, className }: MobileCardWrapperProps) {
  return (
    <div className={cn("block md:hidden space-y-3", className)}>
      {children}
    </div>
  );
}

interface DesktopTableWrapperProps {
  children: ReactNode;
  className?: string;
}

export function DesktopTableWrapper({ children, className }: DesktopTableWrapperProps) {
  return (
    <div className={cn("hidden md:block", className)}>
      {children}
    </div>
  );
}
