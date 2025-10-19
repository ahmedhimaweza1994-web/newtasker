import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { getMediaUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface IncomingCallDialogProps {
  isOpen: boolean;
  caller: {
    id: string;
    fullName: string;
    profilePicture?: string;
  };
  callType: 'audio' | 'video';
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallDialog({
  isOpen,
  caller,
  callType,
  onAccept,
  onDecline,
}: IncomingCallDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[400px] p-0 overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-teal-900 dark:from-purple-950 dark:via-blue-950 dark:to-teal-950 border-none"
        data-testid="dialog-incoming-call"
      >
        <VisuallyHidden>
          <DialogTitle>{callType === 'video' ? 'اتصال فيديو وارد' : 'اتصال صوتي وارد'}</DialogTitle>
        </VisuallyHidden>
        <div className="p-8 text-white">
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Avatar className="w-32 h-32 mb-6 ring-4 ring-white/40" data-testid="avatar-incoming-caller">
                <AvatarImage src={getMediaUrl(caller.profilePicture)} alt={caller.fullName} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-600 to-blue-600">
                  {caller.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            
            <h2 className="text-2xl font-bold mb-2" data-testid="text-incoming-caller-name">{caller.fullName}</h2>
            <div className="flex items-center gap-2 mb-6">
              {callType === 'video' && <Video className="w-5 h-5" />}
              <p className="text-lg text-white/80" data-testid="text-incoming-call-type">
                {callType === 'video' ? 'اتصال فيديو وارد' : 'اتصال صوتي وارد'}
              </p>
            </div>
            
            <div className="flex gap-4 mt-4">
              <Button
                size="lg"
                onClick={onDecline}
                className="rounded-full w-16 h-16 p-0 bg-red-600 hover:bg-red-700"
                data-testid="button-decline-call"
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
              
              <Button
                size="lg"
                onClick={onAccept}
                className="rounded-full w-16 h-16 p-0 bg-green-600 hover:bg-green-700"
                data-testid="button-accept-call"
              >
                <Phone className="w-7 h-7" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
