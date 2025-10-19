import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/hooks/use-auth';
import { IncomingCallDialog } from './IncomingCallDialog';
import { CallWindow } from './CallWindow';
import { useCallSounds } from '@/hooks/use-call-sounds';
import { apiRequest } from '@/lib/queryClient';

export function GlobalCallManager() {
  const { user } = useAuth();
  const { lastMessage, sendMessage } = useWebSocket({ userId: user?.id });
  const { playRingtone, stopRingtone, playCallEnd, playCallConnect } = useCallSounds();
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

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
    callStatus: 'ringing' | 'connecting' | 'connected';
    duration: number;
    isMuted: boolean;
    isVideoEnabled: boolean;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
  } | null>(null);

  const [callDuration, setCallDuration] = useState(0);

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

    if (lastMessage.type === 'call_answer') {
      if (peerConnectionRef.current && lastMessage.answer) {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(lastMessage.answer))
          .then(() => {
            setActiveCall(prev => prev ? { ...prev, callStatus: 'connected' } : null);
            playCallConnect();
          })
          .catch(error => console.error('Error setting remote description:', error));
      }
    }

    if (lastMessage.type === 'ice_candidate') {
      if (peerConnectionRef.current && lastMessage.candidate) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(lastMessage.candidate))
          .catch(error => console.error('Error adding ICE candidate:', error));
      }
    }

    if (lastMessage.type === 'call_end' || lastMessage.type === 'call_decline') {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setIncomingCall(null);
      setActiveCall(null);
      stopRingtone();
      playCallEnd();
    }
  }, [lastMessage, user, playRingtone, stopRingtone, playCallEnd, playCallConnect]);

  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall || !user) return;
    
    stopRingtone();

    try {
      const constraints = incomingCall.callType === 'video'
        ? { audio: true, video: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({
            type: 'ice_candidate',
            roomId: incomingCall.roomId,
            callLogId: incomingCall.callLogId,
            candidate: event.candidate,
            to: incomingCall.from.id,
            receiverId: incomingCall.from.id
          });
        }
      };

      pc.ontrack = (event) => {
        setActiveCall(prev => prev ? { ...prev, remoteStream: event.streams[0] } : null);
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setActiveCall({
        roomId: incomingCall.roomId,
        callLogId: incomingCall.callLogId,
        callType: incomingCall.callType,
        otherUser: incomingCall.from,
        isOutgoing: false,
        callStatus: 'connecting',
        duration: 0,
        isMuted: false,
        isVideoEnabled: incomingCall.callType === 'video',
        localStream: stream,
        remoteStream: null,
      });

      sendMessage({
        type: 'call_answer',
        roomId: incomingCall.roomId,
        callLogId: incomingCall.callLogId,
        answer: answer,
        from: {
          id: user.id,
          fullName: user.fullName,
          profilePicture: user.profilePicture
        },
        to: incomingCall.from.id,
        receiverId: incomingCall.from.id,
      });

      playCallConnect();

      await apiRequest('PATCH', `/api/calls/${incomingCall.callLogId}/status`, {
        status: 'connected',
      }).catch(console.error);
      
      setActiveCall(prev => prev ? { ...prev, callStatus: 'connected' } : null);

      setIncomingCall(null);
    } catch (error) {
      console.error('Error accepting call:', error);
      handleDeclineCall();
    }
  }, [incomingCall, user, sendMessage, stopRingtone, playCallConnect]);

  const handleDeclineCall = useCallback(async () => {
    if (!incomingCall) return;

    stopRingtone();

    sendMessage({
      type: 'call_decline',
      roomId: incomingCall.roomId,
      callLogId: incomingCall.callLogId,
      to: incomingCall.from.id,
      receiverId: incomingCall.from.id,
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

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    sendMessage({
      type: 'call_end',
      roomId: activeCall.roomId,
      callLogId: activeCall.callLogId,
      to: activeCall.otherUser.id,
      receiverId: activeCall.otherUser.id,
    });

    await apiRequest('PATCH', `/api/calls/${activeCall.callLogId}/status`, {
      status: 'ended',
      duration: activeCall.duration,
    }).catch(console.error);

    playCallEnd();
    setActiveCall(null);
    setCallDuration(0);
  }, [activeCall, sendMessage, playCallEnd]);

  const handleToggleMute = useCallback(() => {
    if (!activeCall || !activeCall.localStream) return;
    
    const audioTrack = activeCall.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setActiveCall(prev => prev ? { ...prev, isMuted: !audioTrack.enabled } : null);
    }
  }, [activeCall]);

  const handleToggleVideo = useCallback(() => {
    if (!activeCall || !activeCall.localStream) return;
    
    const videoTrack = activeCall.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setActiveCall(prev => prev ? { ...prev, isVideoEnabled: videoTrack.enabled } : null);
    }
  }, [activeCall]);

  useEffect(() => {
    if (!activeCall || activeCall.callStatus !== 'connected') return;

    const interval = setInterval(() => {
      setActiveCall(prev => {
        if (!prev) return null;
        const newDuration = prev.duration + 1;
        setCallDuration(newDuration);
        return { ...prev, duration: newDuration };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCall?.callStatus]);

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
          isOutgoing={activeCall.isOutgoing}
          otherUser={activeCall.otherUser}
          callStatus={activeCall.callStatus}
          duration={activeCall.duration}
          isMuted={activeCall.isMuted}
          isVideoEnabled={activeCall.isVideoEnabled}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onEndCall={handleEndCall}
        />
      )}
    </>
  );
}
