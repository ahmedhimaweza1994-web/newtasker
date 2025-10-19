import { useState, useRef, useCallback } from "react";
import { useWebSocket } from "@/lib/websocket";
import { useCallSounds } from "./use-call-sounds";
import { apiRequest } from "@/lib/queryClient";

export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'initiating' | 'ringing' | 'connecting' | 'connected' | 'ended';

interface CallState {
  callLogId: string | null;
  roomId: string | null;
  callType: CallType;
  isOutgoing: boolean;
  otherUser: {
    id: string;
    fullName: string;
    profilePicture?: string;
  } | null;
  status: CallStatus;
  duration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
}

export function useCallManager() {
  const { sendMessage, lastMessage } = useWebSocket();
  const { playRingtone, stopRingtone, playCallEnd, playCallConnect } = useCallSounds();
  
  const [callState, setCallState] = useState<CallState>({
    callLogId: null,
    roomId: null,
    callType: 'audio',
    isOutgoing: false,
    otherUser: null,
    status: 'idle',
    duration: 0,
    isMuted: false,
    isVideoEnabled: false,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCall = useCallback(async (
    roomId: string,
    receiverId: string,
    otherUser: { id: string; fullName: string; profilePicture?: string },
    callType: CallType = 'audio'
  ) => {
    try {
      const response = await apiRequest('POST', `/api/calls/start`, { roomId, receiverId, callType });
      const callLog = await response.json();

      setCallState({
        callLogId: callLog.id,
        roomId,
        callType,
        isOutgoing: true,
        otherUser,
        status: 'initiating',
        duration: 0,
        isMuted: false,
        isVideoEnabled: callType === 'video',
      });

      const constraints = callType === 'video'
        ? { audio: true, video: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendMessage({
            type: 'ice_candidate',
            roomId,
            callLogId: callLog.id,
            candidate: event.candidate
          });
        }
      };

      pc.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        
        stopRingtone();
        playCallConnect();
        
        setCallState(prev => ({ ...prev, status: 'connected' }));
        callStartTimeRef.current = Date.now();
        
        callDurationIntervalRef.current = setInterval(() => {
          if (callStartTimeRef.current) {
            setCallState(prev => ({
              ...prev,
              duration: Math.floor((Date.now() - callStartTimeRef.current!) / 1000)
            }));
          }
        }, 1000);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendMessage({
        type: 'call_offer',
        roomId,
        callLogId: callLog.id,
        callType,
        offer,
        from: otherUser
      });

      playRingtone();
      setCallState(prev => ({ ...prev, status: 'ringing' }));
    } catch (error) {
      console.error("Error starting call:", error);
      endCall(true);
    }
  }, [sendMessage, playRingtone, stopRingtone, playCallConnect]);

  const endCall = useCallback((sendSignal: boolean = true) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    stopRingtone();
    playCallEnd();

    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
      callDurationIntervalRef.current = null;
    }

    if (sendSignal && callState.roomId && callState.callLogId) {
      sendMessage({
        type: 'call_end',
        roomId: callState.roomId,
        callLogId: callState.callLogId
      });

      if (callState.callLogId) {
        apiRequest('PATCH', `/api/calls/${callState.callLogId}/status`, {
          status: 'ended',
          duration: callState.duration
        }).catch(console.error);
      }
    }

    setCallState({
      callLogId: null,
      roomId: null,
      callType: 'audio',
      isOutgoing: false,
      otherUser: null,
      status: 'idle',
      duration: 0,
      isMuted: false,
      isVideoEnabled: false,
    });
    callStartTimeRef.current = null;
  }, [callState, sendMessage, stopRingtone, playCallEnd]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  }, []);

  return {
    callState,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    localVideoRef,
    remoteVideoRef,
  };
}
