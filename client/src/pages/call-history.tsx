import { useState } from "react";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn, getMediaUrl } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { 
  Phone, Video, PhoneIncoming, PhoneOutgoing, 
  PhoneMissed, PhoneOff, Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MotionPageShell, MotionSection } from "@/components/ui/motion-wrappers";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface CallLog {
  id: string;
  roomId: string;
  callerId: string;
  receiverId: string;
  callType: 'audio' | 'video';
  status: 'initiated' | 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected' | 'busy' | 'failed';
  startedAt: string;
  endedAt?: string;
  duration?: number;
  caller: {
    id: string;
    fullName: string;
    profilePicture?: string;
  };
  receiver: {
    id: string;
    fullName: string;
    profilePicture?: string;
  };
}

export default function CallHistory() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [filterType, setFilterType] = useState<'all' | 'audio' | 'video'>('all');

  const { data: callLogs, isLoading } = useQuery<CallLog[]>({
    queryKey: ['/api/calls/history'],
  });

  const getCallIcon = (log: CallLog) => {
    const isOutgoing = log.callerId === user?.id;
    const isMissed = log.status === 'missed' || log.status === 'rejected' || log.status === 'failed';
    
    if (isMissed) {
      return <PhoneMissed className="w-5 h-5 text-red-500" />;
    }
    
    if (log.callType === 'video') {
      return <Video className={cn("w-5 h-5", isOutgoing ? "text-green-500" : "text-blue-500")} />;
    }
    
    return isOutgoing ? (
      <PhoneOutgoing className="w-5 h-5 text-green-500" />
    ) : (
      <PhoneIncoming className="w-5 h-5 text-blue-500" />
    );
  };

  const getStatusText = (log: CallLog) => {
    const isOutgoing = log.callerId === user?.id;
    
    switch (log.status) {
      case 'missed':
        return isOutgoing ? 'لم يتم الرد' : 'مكالمة فائتة';
      case 'rejected':
        return 'مرفوضة';
      case 'failed':
        return 'فشلت';
      case 'connected':
      case 'ended':
        return log.duration ? formatDuration(log.duration) : 'انتهت';
      default:
        return log.status;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOtherUser = (log: CallLog) => {
    return log.callerId === user?.id ? log.receiver : log.caller;
  };

  const filteredLogs = callLogs?.filter(log => {
    if (filterType === 'all') return true;
    return log.callType === filterType;
  });

  return (
    <MotionPageShell>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
        <Navigation />
        <Sidebar />
        
        <main className={cn(
          "transition-all duration-300 ease-in-out pt-16 min-h-screen",
          isCollapsed ? "lg:mr-16" : "lg:mr-64"
        )}>
          <div className="container mx-auto p-4 lg:p-6 max-w-4xl">
            <MotionSection delay={0.1}>
              <Card className="shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-purple-200 dark:border-purple-700">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Phone className="w-6 h-6" />
                    سجل المكالمات
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="mb-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all" data-testid="tab-all-calls">
                        الكل
                      </TabsTrigger>
                      <TabsTrigger value="audio" data-testid="tab-audio-calls">
                        <Phone className="w-4 h-4 ml-2" />
                        صوتية
                      </TabsTrigger>
                      <TabsTrigger value="video" data-testid="tab-video-calls">
                        <Video className="w-4 h-4 ml-2" />
                        فيديو
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <ScrollArea className="h-[600px] pr-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                      </div>
                    ) : filteredLogs && filteredLogs.length > 0 ? (
                      <div className="space-y-3">
                        {filteredLogs.map((log) => {
                          const otherUser = getOtherUser(log);
                          const isOutgoing = log.callerId === user?.id;
                          const isMissed = log.status === 'missed' || log.status === 'rejected' || log.status === 'failed';
                          
                          return (
                            <div
                              key={log.id}
                              className={cn(
                                "flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md",
                                isMissed
                                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                              )}
                              data-testid={`call-log-${log.id}`}
                            >
                              <div className="flex-shrink-0">
                                {getCallIcon(log)}
                              </div>
                              
                              <Avatar className="w-12 h-12" data-testid={`avatar-${otherUser.id}`}>
                                <AvatarImage src={getMediaUrl(otherUser.profilePicture)} alt={otherUser.fullName} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                                  {otherUser.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900 dark:text-white truncate" data-testid={`text-name-${log.id}`}>
                                    {otherUser.fullName}
                                  </p>
                                  {log.callType === 'video' && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Video className="w-3 h-3 ml-1" />
                                      فيديو
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <span data-testid={`text-status-${log.id}`}>{getStatusText(log)}</span>
                                  <span>•</span>
                                  <span data-testid={`text-time-${log.id}`}>
                                    {format(new Date(log.startedAt), 'PPp', { locale: ar })}
                                  </span>
                                </div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="flex-shrink-0"
                                data-testid={`button-call-back-${log.id}`}
                              >
                                {log.callType === 'video' ? (
                                  <Video className="w-5 h-5" />
                                ) : (
                                  <Phone className="w-5 h-5" />
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400">
                        <PhoneOff className="w-12 h-12 mb-2 opacity-50" />
                        <p data-testid="text-no-calls">لا توجد مكالمات</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </MotionSection>
          </div>
        </main>
      </div>
    </MotionPageShell>
  );
}
