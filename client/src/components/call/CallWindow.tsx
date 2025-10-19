import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { cn, getMediaUrl } from "@/lib/utils";

interface CallWindowProps {
  isOpen: boolean;
  callType: 'audio' | 'video';
  isOutgoing: boolean;
  otherUser: {
    id: string;
    fullName: string;
    profilePicture?: string;
  };
  callStatus: 'ringing' | 'connecting' | 'connected';
  duration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  localVideoRef?: React.RefObject<HTMLVideoElement>;
  remoteVideoRef?: React.RefObject<HTMLVideoElement>;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export function CallWindow({
  isOpen,
  callType,
  isOutgoing,
  otherUser,
  callStatus,
  duration,
  isMuted,
  isVideoEnabled,
  localVideoRef,
  remoteVideoRef,
  onToggleMute,
  onToggleVideo,
  onEndCall,
}: CallWindowProps) {
  const [formattedDuration, setFormattedDuration] = useState('00:00');

  useEffect(() => {
    if (callStatus === 'connected') {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      setFormattedDuration(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }
  }, [duration, callStatus]);

  const getStatusText = () => {
    if (callStatus === 'ringing') {
      return isOutgoing ? 'جاري الاتصال...' : 'اتصال وارد';
    }
    if (callStatus === 'connecting') {
      return 'جاري الاتصال...';
    }
    return formattedDuration;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[600px] p-0 overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-teal-900 dark:from-purple-950 dark:via-blue-950 dark:to-teal-950 border-none"
        data-testid="dialog-call-window"
      >
        <div className="relative min-h-[500px] flex flex-col">
          {callType === 'video' && callStatus === 'connected' ? (
            <div className="relative flex-1">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                data-testid="video-remote"
              />
              
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-4 right-4 w-32 h-24 object-cover rounded-lg border-2 border-white dark:border-gray-700 shadow-lg"
                data-testid="video-local"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-white">
              <Avatar className="w-32 h-32 mb-6 ring-4 ring-white/20" data-testid="avatar-caller">
                <AvatarImage src={getMediaUrl(otherUser.profilePicture)} alt={otherUser.fullName} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-purple-600 to-blue-600">
                  {otherUser.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-2xl font-bold mb-2" data-testid="text-caller-name">{otherUser.fullName}</h2>
              <p className="text-lg text-white/80" data-testid="text-call-status">{getStatusText()}</p>
              
              {callStatus === 'ringing' && (
                <div className="mt-4 flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="bg-black/30 backdrop-blur-lg p-6">
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                variant="ghost"
                onClick={onToggleMute}
                className={cn(
                  "rounded-full w-14 h-14 p-0",
                  isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
                )}
                data-testid="button-toggle-mute"
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </Button>
              
              {callType === 'video' && (
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={onToggleVideo}
                  className={cn(
                    "rounded-full w-14 h-14 p-0",
                    !isVideoEnabled ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
                  )}
                  data-testid="button-toggle-video"
                >
                  {isVideoEnabled ? (
                    <Video className="w-6 h-6 text-white" />
                  ) : (
                    <VideoOff className="w-6 h-6 text-white" />
                  )}
                </Button>
              )}
              
              <Button
                size="lg"
                onClick={onEndCall}
                className="rounded-full w-16 h-16 p-0 bg-red-600 hover:bg-red-700"
                data-testid="button-end-call"
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
