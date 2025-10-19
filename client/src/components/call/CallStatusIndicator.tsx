import { motion } from "framer-motion";
import { Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallStatusIndicatorProps {
  isActive: boolean;
  callType: 'audio' | 'video';
  duration: number;
  onClick?: () => void;
}

export function CallStatusIndicator({
  isActive,
  callType,
  duration,
  onClick,
}: CallStatusIndicatorProps) {
  if (!isActive) return null;

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-50",
        "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700",
        "text-white px-6 py-3 rounded-full shadow-xl",
        "flex items-center gap-3 cursor-pointer hover:shadow-2xl transition-shadow"
      )}
      onClick={onClick}
      data-testid="indicator-ongoing-call"
    >
      <div className="relative">
        {callType === 'video' ? (
          <Video className="w-5 h-5" />
        ) : (
          <Phone className="w-5 h-5" />
        )}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-white/30"
        />
      </div>
      
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-90">مكالمة نشطة</span>
        <span className="text-sm font-bold" data-testid="text-call-duration">{formattedDuration}</span>
      </div>
    </motion.div>
  );
}
