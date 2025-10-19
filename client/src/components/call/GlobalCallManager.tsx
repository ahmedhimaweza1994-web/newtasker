import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/hooks/use-auth';
import { IncomingCallDialog } from './IncomingCallDialog';
import { CallWindow } from './CallWindow';
import { useCallSounds } from '@/hooks/use-call-sounds';
import { apiRequest } from '@/lib/queryClient';

export function GlobalCallManager() {
  const { user } = useAuth();
  const { lastMessage, sendMessage } = useWebSocket();
  const { playRingtone, stopRingtone, playCallEnd, playCallConnect } = useCallSounds();

  const [incomingCall, setIncomingCall] = useState<{
    from: {
      id: string;
      fullName: string;
      profilePicture?: string;
    };
    roomId: string;
    callLogId: string;
    callType: 'audio' | 'video';
    offer: any;
  } | null>(null);

  const [activeCall, setActiveCall] = useState<{
    roomId: string;
    callLogId: string;
    callType: 'audio' | 'video';
    otherUser: {
      id: string;
      fullName: string;
      profilePicture?: string;
    };
    isOutgoing: boolean;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
  } | null>(null);

  useEffect(() => {
    if (!lastMessage || !user) return;

    if (lastMessage.type === 'call_offer') {
      if (lastMessage.from && lastMessage.from.id !== user.id) {
        setIncomingCall({
          from: lastMessage.from,
          roomId: lastMessage.roomId,
          callLogId: lastMessage.callLogId,
          callType: lastMessage.callType || 'audio',
          offer: lastMessage.offer,
        });
        playRingtone();
      }
    }

    if (lastMessage.type === 'call_end' || lastMessage.type === 'call_decline') {
      setIncomingCall(null);
      setActiveCall(null);
      stopRingtone();
      playCallEnd();
    }
  }, [lastMessage, user, playRingtone, stopRingtone, playCallEnd]);

  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    stopRingtone();
    playCallConnect();

    try {
      const constraints = incomingCall.callType === 'video'
        ? { audio: true, video: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      setActiveCall({
        roomId: incomingCall.roomId,
        callLogId: incomingCall.callLogId,
        callType: incomingCall.callType,
        otherUser: incomingCall.from,
        isOutgoing: false,
        localStream: stream,
        remoteStream: null,
      });

      sendMessage({
        type: 'call_answer',
        roomId: incomingCall.roomId,
        callLogId: incomingCall.callLogId,
      });

      await apiRequest('PATCH', `/api/calls/${incomingCall.callLogId}/status`, {
        status: 'answered',
      }).catch(console.error);

      setIncomingCall(null);
    } catch (error) {
      console.error('Error accepting call:', error);
      handleDeclineCall();
    }
  }, [incomingCall, sendMessage, stopRingtone, playCallConnect]);

  const handleDeclineCall = useCallback(async () => {
    if (!incomingCall) return;

    stopRingtone();

    sendMessage({
      type: 'call_decline',
      roomId: incomingCall.roomId,
      callLogId: incomingCall.callLogId,
    });

    await apiRequest('PATCH', `/api/calls/${incomingCall.callLogId}/status`, {
      status: 'declined',
    }).catch(console.error);

    setIncomingCall(null);
  }, [incomingCall, sendMessage, stopRingtone]);

  const handleEndCall = useCallback(async () => {
    if (!activeCall) return;

    if (activeCall.localStream) {
      activeCall.localStream.getTracks().forEach(track => track.stop());
    }

    sendMessage({
      type: 'call_end',
      roomId: activeCall.roomId,
      callLogId: activeCall.callLogId,
    });

    await apiRequest('PATCH', `/api/calls/${activeCall.callLogId}/status`, {
      status: 'ended',
    }).catch(console.error);

    playCallEnd();
    setActiveCall(null);
  }, [activeCall, sendMessage, playCallEnd]);

  if (!user) return null;

  return (
    <>
      <IncomingCallDialog
        isOpen={!!incomingCall}
        caller={incomingCall?.from || { id: '', fullName: '', profilePicture: '' }}
        callType={incomingCall?.callType || 'audio'}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />

      {activeCall && (
        <CallWindow
          isOpen={true}
          callType={activeCall.callType}
          otherUser={activeCall.otherUser}
          duration={0}
          isMuted={false}
          isVideoEnabled={activeCall.callType === 'video'}
          onToggleMute={() => {}}
          onToggleVideo={() => {}}
          onEndCall={handleEndCall}
        />
      )}
    </>
  );
}
