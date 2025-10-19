import { useState, useEffect, useRef } from "react";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn, getMediaUrl } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSearch } from "wouter";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Send, MessageSquare, Users, Smile, Paperclip, Mic, 
  X, Reply, Image as ImageIcon, File, Download, AtSign,
  Phone, PhoneOff, MoreVertical, Search, Video, Trash2, Menu
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/lib/websocket";
import { useCallManager } from "@/hooks/use-call-manager";
import { CallWindow } from "@/components/call/CallWindow";
import { IncomingCallDialog } from "@/components/call/IncomingCallDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { MotionPageShell, MotionSection } from "@/components/ui/motion-wrappers";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEnhancedNotifications } from "@/hooks/use-enhanced-notifications";

interface User {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
}

interface ChatRoom {
  id: string;
  name?: string;
  type: 'private' | 'group';
  members: User[];
  lastMessage?: any;
}

interface ChatMessage {
  id: string;
  content?: string;
  messageType: string;
  senderId: string;
  sender: User;
  reactions: any[];
  createdAt: string;
  attachments?: any[];
  replyTo?: string;
}

export default function Chat() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const searchParams = useSearch();
  const urlRoomId = new URLSearchParams(searchParams).get('roomId');
  const urlMessageId = new URLSearchParams(searchParams).get('messageId');
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messageText, setMessageText] = useState("");
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomImage, setNewRoomImage] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [openReactionPopover, setOpenReactionPopover] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [incomingCallFrom, setIncomingCallFrom] = useState<User | null>(null);
  const [incomingCallType, setIncomingCallType] = useState<'audio' | 'video'>('audio');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  const { handleMessageNotification } = useEnhancedNotifications();
  
  const { callState, startCall, endCall, toggleMute, toggleVideo, localVideoRef, remoteVideoRef } = useCallManager();

  const { data: rooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    refetchInterval: 3000,
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages", selectedRoom?.id],
    enabled: !!selectedRoom,
    refetchInterval: 2000,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/chat/messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedRoom?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setMessageText("");
      setReplyingTo(null);
      setAttachments([]);
      setRecordedAudio(null);
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/chat/rooms", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setCreateRoomOpen(false);
      setNewRoomName("");
      setNewRoomImage("");
      setSelectedMembers([]);
      toast({
        title: "تم إنشاء الغرفة",
        description: "تم إنشاء غرفة الدردشة بنجاح",
      });
    },
  });

  const startPrivateChatMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      const res = await apiRequest("POST", "/api/chat/private", { otherUserId });
      return res.json();
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setSelectedRoom(room);
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const res = await apiRequest("POST", "/api/chat/reactions", { messageId, emoji });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedRoom?.id] });
      setOpenReactionPopover(null);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = await Promise.all(
      Array.from(files).map(async (file) => {
        const reader = new FileReader();
        return new Promise<any>((resolve) => {
          reader.onloadend = () => {
            resolve({
              name: file.name,
              type: file.type.startsWith("image/") ? "image" : "file",
              url: reader.result as string,
              size: file.size,
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setAttachments([...attachments, ...newAttachments]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setRecordedAudio(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "لا يمكن الوصول إلى الميكروفون",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRoom) return;
    
    let content = messageText.trim();
    let messageType = "text";
    let messageAttachments = attachments;

    if (recordedAudio) {
      const reader = new FileReader();
      const audioDataUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(recordedAudio);
      });

      messageAttachments = [{
        name: "تسجيل صوتي",
        type: "audio",
        url: audioDataUrl,
      }];
      messageType = "file";
      content = "🎤 تسجيل صوتي";
    }

    if (!content && messageAttachments.length === 0) return;

    sendMessageMutation.mutate({
      roomId: selectedRoom.id,
      content: content || (messageAttachments.length > 0 ? "📎 مرفق" : ""),
      messageType: messageAttachments.length > 0 ? "file" : messageType,
      attachments: messageAttachments,
      replyTo: replyingTo?.id,
    });
  };

  const handleStartAudioCall = () => {
    if (!selectedRoom || selectedRoom.type !== 'private') return;
    const otherUser = selectedRoom.members.find(m => m.id !== user?.id);
    if (!otherUser) return;
    
    startCall(selectedRoom.id, otherUser.id, otherUser, 'audio');
  };

  const handleStartVideoCall = () => {
    if (!selectedRoom || selectedRoom.type !== 'private') return;
    const otherUser = selectedRoom.members.find(m => m.id !== user?.id);
    if (!otherUser) return;
    
    startCall(selectedRoom.id, otherUser.id, otherUser, 'video');
  };

  const handleAcceptCall = () => {
    setIncomingCallFrom(null);
  };

  const handleDeclineCall = () => {
    setIncomingCallFrom(null);
    endCall(true);
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim() || selectedMembers.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الغرفة واختيار الأعضاء",
        variant: "destructive",
      });
      return;
    }

    createRoomMutation.mutate({
      name: newRoomName,
      type: "group",
      memberIds: selectedMembers,
      image: newRoomImage || undefined,
    });
  };

  const handleRoomImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة فقط",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewRoomImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const insertMention = (userName: string) => {
    const newText = messageText + `@${userName} `;
    setMessageText(newText);
    setShowMentions(false);
    setMentionSearch("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const lastWord = messageText.split(" ").pop() || "";
    if (lastWord.startsWith("@") && lastWord.length > 1) {
      setMentionSearch(lastWord.slice(1));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }, [messageText]);


  useEffect(() => {
    if (urlRoomId && rooms.length > 0 && !selectedRoom) {
      const room = rooms.find(r => r.id === urlRoomId);
      if (room) {
        setSelectedRoom(room);
      }
    }
  }, [urlRoomId, rooms, selectedRoom]);

  useEffect(() => {
    if (urlMessageId && messages.length > 0) {
      setTimeout(() => {
        const messageElement = document.getElementById(`message-${urlMessageId}`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          messageElement.classList.add('bg-primary/10');
          setTimeout(() => {
            messageElement.classList.remove('bg-primary/10');
          }, 2000);
        }
      }, 500);
    }
  }, [urlMessageId, messages]);

  useEffect(() => {
    if (lastMessage?.type === 'new_message' && lastMessage.data) {
      const message = lastMessage.data;
      if (message.senderId !== user?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
        queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", message.roomId] });
        
        const senderName = message.sender?.fullName || 'مستخدم';
        const messageContent = message.content || 'أرسل رسالة';
        handleMessageNotification(message.roomId, messageContent, senderName);
      }
    }
  }, [lastMessage, user?.id, handleMessageNotification]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'call_offer' && lastMessage.from) {
      setIncomingCallFrom(lastMessage.from);
      setIncomingCallType(lastMessage.callType || 'audio');
    }
  }, [lastMessage]);

  const getRoomName = (room: ChatRoom) => {
    if (room.type === 'group') return room.name || 'غرفة جماعية';
    const otherMember = room.members.find(m => m.id !== user?.id);
    return otherMember?.fullName || 'دردشة خاصة';
  };

  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === 'group') return getMediaUrl(room.image);
    const otherMember = room.members.find(m => m.id !== user?.id);
    return getMediaUrl(otherMember?.profilePicture);
  };

  const getReplyMessage = (replyId?: string) => {
    return messages.find(m => m.id === replyId);
  };

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '✨'];

  const sortedRooms = [...rooms].sort((a, b) => {
    if (a.name === 'الغرفة العامة') return -1;
    if (b.name === 'الغرفة العامة') return 1;
    return 0;
  });

  const filteredUsers = users
    .filter((u) => 
      u.id !== user?.id && 
      u.fullName.toLowerCase().includes(mentionSearch.toLowerCase())
    );

  const filteredRooms = sortedRooms.filter(room =>
    getRoomName(room).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chatListContent = (
    <>
      <div className="p-4 border-b border-border bg-card/80">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            الدردشات
          </h2>
          <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 shadow-lg hover:shadow-primary/50 transition-all" data-testid="button-create-room">
                <Users className="w-4 h-4" />
                غرفة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إنشاء غرفة دردشة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="room-name">اسم الغرفة</Label>
                  <Input
                    id="room-name"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="أدخل اسم الغرفة"
                    data-testid="input-room-name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="room-image">صورة الغرفة (اختياري)</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      id="room-image"
                      type="file"
                      accept="image/*"
                      onChange={handleRoomImageChange}
                      data-testid="input-room-image"
                      className="flex-1"
                    />
                    {newRoomImage && (
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={newRoomImage} alt="Room preview" />
                        <AvatarFallback>صورة</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
                <div>
                  <Label>الأعضاء</Label>
                  <ScrollArea className="h-48 border rounded-md p-2 mt-2">
                    {users
                      .filter((u) => u.id !== user?.id)
                      .map((u) => (
                        <div key={u.id} className="flex items-center gap-2 py-2 hover:bg-muted/50 rounded px-2 transition-colors">
                          <Checkbox
                            id={`member-${u.id}`}
                            checked={selectedMembers.includes(u.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMembers([...selectedMembers, u.id]);
                              } else {
                                setSelectedMembers(selectedMembers.filter((id) => id !== u.id));
                              }
                            }}
                            data-testid={`checkbox-member-${u.id}`}
                          />
                          <Label htmlFor={`member-${u.id}`} className="cursor-pointer flex-1">
                            {u.fullName}
                          </Label>
                        </div>
                      ))}
                  </ScrollArea>
                </div>
                <Button onClick={handleCreateRoom} className="w-full" data-testid="button-submit-room">
                  إنشاء الغرفة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="بحث في الدردشات..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10" 
            data-testid="input-search-chat" 
          />
        </div>
      </div>
      <ScrollArea className={cn("h-[calc(100vh-250px)]", isMobile && "h-[calc(100vh-200px)]")}>
        <AnimatePresence mode="popLayout">
          {filteredRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                setSelectedRoom(room);
                if (isMobile) setMobileSheetOpen(false);
              }}
              className={cn(
                "p-4 cursor-pointer transition-all duration-200 touch-manipulation",
                "hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10",
                "border-b border-border/50",
                "active:scale-[0.98]",
                selectedRoom?.id === room.id && "bg-gradient-to-r from-primary/20 to-accent/20 border-l-4 border-l-primary"
              )}
              data-testid={`room-item-${room.id}`}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar className="ring-2 ring-primary/20">
                    {getRoomAvatar(room) && (
                      <AvatarImage src={getRoomAvatar(room)!} alt={getRoomName(room)} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                      {room.type === 'group' ? <Users className="w-4 h-4" /> : getRoomName(room)[0]}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{getRoomName(room)}</p>
                    {room.name === 'الغرفة العامة' && (
                      <Badge variant="secondary" className="text-xs">عامة</Badge>
                    )}
                  </div>
                  {room.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {room.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>
      <div className="p-4 border-t border-border bg-card/80">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2" data-testid="button-open-private-chat">
              <MessageSquare className="w-4 h-4" />
              بدء دردشة خاصة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>اختر مستخدم للمحادثة</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-2">
                {users
                  .filter((u) => u.id !== user?.id)
                  .map((u) => (
                    <motion.div
                      key={u.id}
                      whileHover={{ x: 4 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start hover:bg-primary/10"
                        onClick={() => {
                          startPrivateChatMutation.mutate(u.id);
                          if (isMobile) setMobileSheetOpen(false);
                        }}
                        data-testid={`button-private-chat-${u.id}`}
                      >
                        <Avatar className="h-8 w-8 ml-2">
                          <AvatarFallback>{u.fullName[0]}</AvatarFallback>
                        </Avatar>
                        {u.fullName}
                      </Button>
                    </motion.div>
                  ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );

  return (
    <MotionPageShell>
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className={cn("flex-1 h-screen flex bg-gradient-to-br from-background to-muted/20 transition-all duration-300", isCollapsed ? "md:mr-16" : "md:mr-64")}>
          {isMobile ? (
            <>
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetContent side="right" className="w-full sm:w-96 p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>الدردشات</SheetTitle>
                  </SheetHeader>
                  {chatListContent}
                </SheetContent>
              </Sheet>
              <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
                {selectedRoom ? (
                  <>
                    <MotionSection delay={0.1} className="sticky top-0 z-10 p-3 md:p-4 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setMobileSheetOpen(true)}
                          data-testid="button-mobile-menu"
                          className="shrink-0 h-9 w-9 md:hidden"
                        >
                          <Menu className="w-5 h-5" />
                        </Button>
                        <Avatar className="ring-2 ring-primary/30 shrink-0 h-9 w-9 md:h-10 md:w-10">
                          {selectedRoom.type === 'private' && getRoomAvatar(selectedRoom) && (
                            <AvatarImage src={getRoomAvatar(selectedRoom)!} alt={getRoomName(selectedRoom)} className="object-cover" />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                            {selectedRoom.type === 'group' ? <Users className="w-4 h-4" /> : getRoomName(selectedRoom)[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm md:text-base truncate">{getRoomName(selectedRoom)}</h3>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                            <p className="text-xs md:text-sm text-muted-foreground truncate">
                              {selectedRoom.members.length} أعضاء
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 shrink-0">
                        {selectedRoom.type === 'private' && (
                          <>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 md:gap-2 h-9 md:h-10"
                                onClick={handleStartAudioCall}
                                data-testid="button-audio-call"
                              >
                                <Phone className="w-4 h-4" />
                                <span className="hidden sm:inline">صوت</span>
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 md:gap-2 h-9 md:h-10"
                                onClick={handleStartVideoCall}
                                data-testid="button-video-call"
                              >
                                <Video className="w-4 h-4" />
                                <span className="hidden sm:inline">فيديو</span>
                              </Button>
                            </motion.div>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Search className="w-4 h-4 ml-2" />
                              بحث في المحادثة
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 ml-2" />
                              حذف المحادثة
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </MotionSection>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {messages.map((message, index) => {
                        const isOwnMessage = message.senderId === user?.id;
                        const replyMessage = getReplyMessage(message.replyTo);
                        
                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ 
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                              delay: index * 0.02
                            }}
                            className={cn(
                              "flex gap-3 group",
                              isOwnMessage && "flex-row-reverse"
                            )}
                            data-testid={`message-${message.id}`}
                          >
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className="flex-shrink-0"
                            >
                              <Avatar className="ring-2 ring-border" key={`avatar-${message.sender.id}`}>
                                {message.sender.profilePicture && (
                                  <AvatarImage 
                                    src={getMediaUrl(message.sender.profilePicture)} 
                                    alt={message.sender.fullName} 
                                    className="object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <AvatarFallback className={cn(
                                  "bg-gradient-to-br from-primary/20 to-accent/20",
                                  isOwnMessage && "bg-gradient-to-br from-primary to-accent text-white"
                                )}>
                                  {message.sender.fullName[0]}
                                </AvatarFallback>
                              </Avatar>                            </motion.div>
                            <div className={cn(
                              "flex-1 space-y-1",
                              isOwnMessage && "items-end flex flex-col"
                            )}>
                              <p className="text-sm font-medium text-muted-foreground">
                                {message.sender.fullName}
                              </p>
                              
                              {replyMessage && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className={cn(
                                    "text-xs p-2 rounded-lg bg-muted/50 border-l-2 border-primary mb-1",
                                    isOwnMessage && "border-r-2 border-l-0"
                                  )}
                                >
                                  <p className="font-medium">{replyMessage.sender.fullName}</p>
                                  <p className="text-muted-foreground">{replyMessage.content}</p>
                                </motion.div>
                              )}

                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className={cn(
                                  "inline-block p-3 rounded-2xl max-w-[70%] shadow-md",
                                  "transition-all duration-200",
                                  isOwnMessage
                                    ? "bg-gradient-to-r from-primary to-accent text-white rounded-br-none"
                                    : "bg-card border border-border rounded-bl-none"
                                )}
                              >
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="space-y-2 mb-2">
                                    {message.attachments.map((att, i) => (
                                      <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                      >
                                        {att.type === "image" ? (
                                          <img
                                            src={getMediaUrl(att.url)}
                                            alt={att.name}
                                            className="rounded-lg max-w-xs hover:scale-105 transition-transform cursor-pointer"
                                          />
                                        ) : att.type === "audio" ? (
                                          <div className="flex items-center gap-2 p-2 rounded-lg bg-background/10">
                                            <Mic className="w-4 h-4" />
                                            <audio controls src={getMediaUrl(att.url)} className="flex-1" />
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 p-2 rounded-lg bg-background/10 hover:bg-background/20 transition-colors cursor-pointer">
                                            <File className="w-4 h-4" />
                                            <span className="text-sm">{att.name}</span>
                                            <Download className="w-4 h-4 ml-auto" />
                                          </div>
                                        )}
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                <p className={cn(
                                  "text-xs mt-1",
                                  isOwnMessage ? "text-white/70" : "text-muted-foreground"
                                )}>
                                  {new Date(message.createdAt).toLocaleTimeString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true
                                  })}
                                </p>
                              </motion.div>

                              <div className="flex items-center gap-2">
                                {message.reactions && message.reactions.length > 0 && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex gap-1 bg-muted rounded-full px-2 py-1"
                                  >
                                    {message.reactions.slice(0, 3).map((reaction, i) => (
                                      <span key={i} className="text-sm">{reaction.emoji}</span>
                                    ))}
                                    {message.reactions.length > 3 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{message.reactions.length - 3}
                                      </span>
                                    )}
                                  </motion.div>
                                )}
                                
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <Popover open={openReactionPopover === message.id} onOpenChange={(open) => setOpenReactionPopover(open ? message.id : null)}>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                        <Smile className="w-3 h-3" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2">
                                      <div className="flex gap-1">
                                        {reactions.map((emoji) => (
                                          <Button
                                            key={emoji}
                                            variant="ghost"
                                            className="h-8 w-8 p-0 hover:scale-125 transition-transform"
                                            onClick={() => addReactionMutation.mutate({ messageId: message.id, emoji })}
                                          >
                                            {emoji}
                                          </Button>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => setReplyingTo(message)}
                                  >
                                    <Reply className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="p-4 border-t border-border bg-card/80 backdrop-blur-sm"
                >
                  {replyingTo && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Reply className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs font-medium">رد على {replyingTo.sender.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {replyingTo.content}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  )}

                  {attachments.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="mb-2 flex gap-2 flex-wrap"
                    >
                      {attachments.map((att, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="relative group"
                        >
                          {att.type === "image" ? (
                            <img
                              src={getMediaUrl(att.url)}
                              alt={att.name}
                              className="h-20 w-20 object-cover rounded-lg border-2 border-border"
                            />
                          ) : (
                            <div className="h-20 w-20 bg-muted rounded-lg border-2 border-border flex items-center justify-center">
                              <File className="w-8 h-8" />
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {recordedAudio && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mb-2 p-2 bg-muted rounded-lg flex items-center gap-2"
                    >
                      <Mic className="w-4 h-4 text-primary" />
                      <audio
                        controls
                        src={URL.createObjectURL(recordedAudio)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRecordedAudio(null)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  )}

                  <div className="flex items-end gap-2">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        multiple
                        className="hidden"
                        accept="image/*,application/pdf"
                      />
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="button-attach"
                          className="hover:bg-primary/10"
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={isRecording ? stopRecording : startRecording}
                          data-testid="button-record"
                          className={cn(
                            "hover:bg-primary/10",
                            isRecording && "bg-destructive text-white animate-pulse"
                          )}
                        >
                          <Mic className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </div>
                    <div className="flex-1 relative">
                      <Textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="اكتب رسالتك..."
                        className="min-h-[44px] max-h-32 resize-none pr-10"
                        data-testid="input-message"
                      />
                      {showMentions && filteredUsers.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-2 max-h-40 overflow-y-auto"
                        >
                          {filteredUsers.map((u) => (
                            <Button
                              key={u.id}
                              variant="ghost"
                              className="w-full justify-start hover:bg-primary/10"
                              onClick={() => insertMention(u.fullName)}
                            >
                              <AtSign className="w-4 h-4 ml-2" />
                              {u.fullName}
                            </Button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() && attachments.length === 0 && !recordedAudio}
                        data-testid="button-send-message"
                        className="gap-2 shadow-lg hover:shadow-primary/50 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        إرسال
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <MessageSquare className="w-20 h-20 mx-auto text-muted-foreground/50" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-muted-foreground">
                    اختر محادثة للبدء
                  </h3>
                  <p className="text-muted-foreground">
                    حدد دردشة من القائمة أو ابدأ محادثة جديدة
                  </p>
                  <Button
                    onClick={() => setMobileSheetOpen(true)}
                    className="gap-2 shadow-lg"
                    data-testid="button-open-chat-list"
                  >
                    <MessageSquare className="w-4 h-4" />
                    عرض الدردشات
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
              </>
          ) : (
            <>
              <MotionSection delay={0.1} className="w-full md:w-80 border-l border-border bg-card/50 backdrop-blur-sm">
                {chatListContent}
              </MotionSection>
              <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
                {selectedRoom ? (
                  <>
                    <MotionSection delay={0.1} className="p-4 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="ring-2 ring-primary/30">
                          {selectedRoom.type === 'private' && getRoomAvatar(selectedRoom) && (
                            <AvatarImage src={getRoomAvatar(selectedRoom)!} alt={getRoomName(selectedRoom)} className="object-cover" />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                            {selectedRoom.type === 'group' ? <Users className="w-4 h-4" /> : getRoomName(selectedRoom)[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-lg">{getRoomName(selectedRoom)}</h3>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-sm text-muted-foreground">
                              {selectedRoom.members.length} أعضاء
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedRoom.type === 'private' && (
                          <>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={handleStartAudioCall}
                                data-testid="button-audio-call"
                              >
                                <Phone className="w-4 h-4" />
                                <span>صوت</span>
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={handleStartVideoCall}
                                data-testid="button-video-call"
                              >
                                <Video className="w-4 h-4" />
                                <span>فيديو</span>
                              </Button>
                            </motion.div>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Search className="w-4 h-4 ml-2" />
                              بحث في المحادثة
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 ml-2" />
                              حذف المحادثة
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </MotionSection>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                          {messages.map((message, index) => {
                            const isOwnMessage = message.senderId === user?.id;
                            const replyMessage = getReplyMessage(message.replyTo);
                            
                            return (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ 
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 30,
                                  delay: index * 0.02
                                }}
                                className={cn(
                                  "flex gap-3 group",
                                  isOwnMessage && "flex-row-reverse"
                                )}
                                data-testid={`message-${message.id}`}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  className="flex-shrink-0"
                                >
                                  <Avatar className="ring-2 ring-border" key={`avatar-mobile-${message.sender.id}`}>
                                    {message.sender.profilePicture && (
                                      <AvatarImage 
                                        src={getMediaUrl(message.sender.profilePicture)} 
                                        alt={message.sender.fullName} 
                                        className="object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <AvatarFallback className={cn(
                                      "bg-gradient-to-br from-primary/20 to-accent/20",
                                      isOwnMessage && "bg-gradient-to-br from-primary to-accent text-white"
                                    )}>
                                      {message.sender.fullName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                </motion.div>
                                <div className={cn(
                                  "flex-1 space-y-1",
                                  isOwnMessage && "items-end flex flex-col"
                                )}>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    {message.sender.fullName}
                                  </p>
                                  
                                  {replyMessage && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      className={cn(
                                        "text-xs p-2 rounded-lg bg-muted/50 border-l-2 border-primary mb-1",
                                        isOwnMessage && "border-r-2 border-l-0"
                                      )}
                                    >
                                      <p className="font-medium">{replyMessage.sender.fullName}</p>
                                      <p className="text-muted-foreground">{replyMessage.content}</p>
                                    </motion.div>
                                  )}

                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className={cn(
                                      "inline-block p-3 rounded-2xl max-w-[70%] shadow-md",
                                      "transition-all duration-200",
                                      isOwnMessage
                                        ? "bg-gradient-to-r from-primary to-accent text-white rounded-br-none"
                                        : "bg-card border border-border rounded-bl-none"
                                    )}
                                  >
                                    {message.attachments && message.attachments.length > 0 && (
                                      <div className="space-y-2 mb-2">
                                        {message.attachments.map((att, i) => (
                                          <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                          >
                                            {att.type === "image" ? (
                                              <img
                                                src={getMediaUrl(att.url)}
                                                alt={att.name}
                                                className="rounded-lg max-w-xs hover:scale-105 transition-transform cursor-pointer"
                                              />
                                            ) : att.type === "audio" ? (
                                              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/10">
                                                <Mic className="w-4 h-4" />
                                                <audio controls src={getMediaUrl(att.url)} className="flex-1" />
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/10 hover:bg-background/20 transition-colors cursor-pointer">
                                                <File className="w-4 h-4" />
                                                <span className="text-sm">{att.name}</span>
                                                <Download className="w-4 h-4 ml-auto" />
                                              </div>
                                            )}
                                          </motion.div>
                                        ))}
                                      </div>
                                    )}
                                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                    <p className={cn(
                                      "text-xs mt-1",
                                      isOwnMessage ? "text-white/70" : "text-muted-foreground"
                                    )}>
                                      {new Date(message.createdAt).toLocaleTimeString("ar-SA", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true
                                      })}
                                    </p>
                                  </motion.div>

                                  <div className="flex items-center gap-2">
                                    {message.reactions && message.reactions.length > 0 && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex gap-1 bg-muted rounded-full px-2 py-1"
                                      >
                                        {message.reactions.slice(0, 3).map((reaction, i) => (
                                          <span key={i} className="text-sm">{reaction.emoji}</span>
                                        ))}
                                        {message.reactions.length > 3 && (
                                          <span className="text-xs text-muted-foreground">
                                            +{message.reactions.length - 3}
                                          </span>
                                        )}
                                      </motion.div>
                                    )}
                                    
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                      <Popover open={openReactionPopover === message.id} onOpenChange={(open) => setOpenReactionPopover(open ? message.id : null)}>
                                        <PopoverTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                            <Smile className="w-3 h-3" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2">
                                          <div className="flex gap-1">
                                            {reactions.map((emoji) => (
                                              <Button
                                                key={emoji}
                                                variant="ghost"
                                                className="h-8 w-8 p-0 hover:scale-125 transition-transform"
                                                onClick={() => addReactionMutation.mutate({ messageId: message.id, emoji })}
                                              >
                                                {emoji}
                                              </Button>
                                            ))}
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => setReplyingTo(message)}
                                      >
                                        <Reply className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="p-4 border-t border-border bg-card/80 backdrop-blur-sm"
                    >
                      {replyingTo && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Reply className="w-4 h-4 text-primary" />
                            <div>
                              <p className="text-xs font-medium">رد على {replyingTo.sender.fullName}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {replyingTo.content}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(null)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      )}

                      {attachments.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          className="mb-2 flex gap-2 flex-wrap"
                        >
                          {attachments.map((att, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="relative group"
                            >
                              {att.type === "image" ? (
                                <img
                                  src={getMediaUrl(att.url)}
                                  alt={att.name}
                                  className="h-20 w-20 object-cover rounded-lg border-2 border-border"
                                />
                              ) : (
                                <div className="h-20 w-20 bg-muted rounded-lg border-2 border-border flex items-center justify-center">
                                  <File className="w-8 h-8" />
                                </div>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}

                      {recordedAudio && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="mb-2 p-2 bg-muted rounded-lg flex items-center gap-2"
                        >
                          <Mic className="w-4 h-4 text-primary" />
                          <audio
                            controls
                            src={URL.createObjectURL(recordedAudio)}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRecordedAudio(null)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      )}

                      <div className="flex items-end gap-2">
                        <div className="flex gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            multiple
                            className="hidden"
                            accept="image/*,application/pdf"
                          />
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => fileInputRef.current?.click()}
                              data-testid="button-attach"
                              className="hover:bg-primary/10 h-11 sm:h-10 w-11 sm:w-10"
                            >
                              <Paperclip className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={isRecording ? stopRecording : startRecording}
                              data-testid="button-record"
                              className={cn(
                                "hover:bg-primary/10 h-11 sm:h-10 w-11 sm:w-10",
                                isRecording && "bg-destructive text-white animate-pulse"
                              )}
                            >
                              <Mic className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </div>
                        <div className="flex-1 relative">
                          <Textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="اكتب رسالتك..."
                            className="min-h-[44px] max-h-32 resize-none pr-10"
                            data-testid="input-message"
                          />
                          {showMentions && filteredUsers.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-2 max-h-40 overflow-y-auto"
                            >
                              {filteredUsers.map((u) => (
                                <Button
                                  key={u.id}
                                  variant="ghost"
                                  className="w-full justify-start hover:bg-primary/10"
                                  onClick={() => insertMention(u.fullName)}
                                >
                                  <AtSign className="w-4 h-4 ml-2" />
                                  {u.fullName}
                                </Button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={handleSendMessage}
                            disabled={!messageText.trim() && attachments.length === 0 && !recordedAudio}
                            data-testid="button-send-message"
                            className="gap-2 shadow-lg hover:shadow-primary/50 transition-all h-11 sm:h-10"
                          >
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">إرسال</span>
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex items-center justify-center"
                  >
                    <div className="text-center space-y-4">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <MessageSquare className="w-20 h-20 mx-auto text-muted-foreground/50" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-muted-foreground">
                        اختر محادثة للبدء
                      </h3>
                      <p className="text-muted-foreground">
                        حدد دردشة من القائمة أو ابدأ محادثة جديدة
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
      
      <CallWindow
        isOpen={callState.status !== 'idle'}
        callType={callState.callType}
        isOutgoing={callState.isOutgoing}
        otherUser={callState.otherUser || { id: '', fullName: '', profilePicture: '' }}
        callStatus={callState.status === 'ringing' ? 'ringing' : callState.status === 'connecting' ? 'connecting' : 'connected'}
        duration={callState.duration}
        isMuted={callState.isMuted}
        isVideoEnabled={callState.isVideoEnabled}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onEndCall={() => endCall(true)}
      />
      
      <IncomingCallDialog
        isOpen={!!incomingCallFrom}
        caller={incomingCallFrom || { id: '', fullName: '', profilePicture: '' }}
        callType={incomingCallType}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />
    </MotionPageShell>
  );
}
