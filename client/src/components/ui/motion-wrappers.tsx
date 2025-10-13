import { motion } from "framer-motion";
import { ReactNode } from "react";
import { pageVariants, containerVariants, itemVariants, metricsVariants, iconRotateHover, buttonHoverEffect, floatingAnimation, numberScaleIn } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils";

interface MotionPageShellProps {
  children: ReactNode;
  className?: string;
}

export function MotionPageShell({ children, className }: MotionPageShellProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={cn("min-h-screen bg-gradient-to-br from-background via-background to-accent/5", className)}
    >
      {children}
    </motion.div>
  );
}

interface MotionSectionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function MotionSection({ children, delay = 0, className }: MotionSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface MotionGridProps {
  children: ReactNode;
  className?: string;
}

export function MotionGrid({ children, className }: MotionGridProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

type GradientVariant = 
  | "blue-cyan" 
  | "green-emerald" 
  | "purple-pink" 
  | "orange-red" 
  | "red-pink" 
  | "yellow-amber"
  | "indigo-purple"
  | "teal-cyan"
  | "primary";

const gradientStyles: Record<GradientVariant, { 
  overlay: string; 
  background: string;
  iconColor: string;
}> = {
  "blue-cyan": {
    overlay: "absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity",
    background: "absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full opacity-10",
    iconColor: "text-blue-600 dark:text-blue-500"
  },
  "green-emerald": {
    overlay: "absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity",
    background: "absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full opacity-10",
    iconColor: "text-green-600 dark:text-green-500"
  },
  "purple-pink": {
    overlay: "absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity",
    background: "absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-10",
    iconColor: "text-purple-600 dark:text-purple-500"
  },
  "orange-red": {
    overlay: "absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity",
    background: "absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-orange-500 to-red-500 rounded-full opacity-10",
    iconColor: "text-orange-600 dark:text-orange-500"
  },
  "red-pink": {
    overlay: "absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity",
    background: "absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-red-500 to-pink-500 rounded-full opacity-10",
    iconColor: "text-red-600 dark:text-red-500"
  },
  "yellow-amber": {
    overlay: "absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity",
    background: "absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-full opacity-10",
    iconColor: "text-yellow-600 dark:text-yellow-500"
  },
  "indigo-purple": {
    overlay: "absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity",
    background: "absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full opacity-10",
    iconColor: "text-indigo-600 dark:text-indigo-500"
  },
  "teal-cyan": {
    overlay: "absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity",
    background: "absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full opacity-10",
    iconColor: "text-teal-600 dark:text-teal-500"
  },
  primary: {
    overlay: "absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity",
    background: "absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full opacity-10",
    iconColor: "text-primary"
  }
};

interface MotionMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  variant?: GradientVariant;
  index?: number;
  testId?: string;
}

export function MotionMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "primary",
  index = 0,
  testId
}: MotionMetricCardProps) {
  const styles = gradientStyles[variant];
  
  return (
    <motion.div
      custom={index}
      variants={metricsVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300" data-testid={testId}>
        <div className={styles.overlay} />
        <motion.div
          className={styles.background}
          {...floatingAnimation}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <motion.div {...iconRotateHover}>
            <Icon className={cn("h-5 w-5", styles.iconColor)} />
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            {...numberScaleIn(index * 0.1)}
            className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          >
            {value}
          </motion.div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  className 
}: ResponsiveGridProps) {
  const gridClass = cn(
    "grid gap-4 md:gap-6",
    cols.sm === 1 && "grid-cols-1",
    cols.sm === 2 && "grid-cols-2",
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  );
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={gridClass}
    >
      {children}
    </motion.div>
  );
}

interface MotionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  testId?: string;
}

export function MotionButton({ children, className, ...props }: MotionButtonProps) {
  return (
    <motion.button
      {...buttonHoverEffect}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

interface MotionListItemProps {
  children: ReactNode;
  index: number;
  className?: string;
  testId?: string;
}

export function MotionListItem({ children, index, className, testId }: MotionListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className={className}
      data-testid={testId}
    >
      {children}
    </motion.div>
  );
}
