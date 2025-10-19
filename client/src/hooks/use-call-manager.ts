import { useState, useRef, useCallback, useEffect } from "react";
import { useWebSocket } from "@/lib/websocket";
import { useCallSounds } from "./use-call-sounds";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

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
  const { user } = useAuth();
  const { sendMessage, lastMessage } = useWebSocket({ userId: user?.id });
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
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logCallEvent = useCallback((event: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const callId = callState.callLogId || 'unknown';
    console.log(`[CALL ${callId}] [${timestamp}] ${event}`, data || '');
  }, [callState.callLogId]);

  const endCall = useCallback((sendSignal: boolean = true, reason: string = 'manual') => {
    const callId = callState.callLogId;
    const timestamp = new Date().toISOString();
    console.log(`[CALL ${callId}] [${timestamp}] Ending call - Reason: ${reason}, SendSignal: ${sendSignal}`);

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (peerConnectionRef.current) {
      console.log(`[CALL ${callId}] [${timestamp}] Closing peer connection`);
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      console.log(`[CALL ${callId}] [${timestamp}] Stopping local media tracks`);
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    stopRingtone();
    playCallEnd();

    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
      callDurationIntervalRef.current = null;
    }

    if (sendSignal && callState.roomId && callState.callLogId && callState.otherUser) {
      console.log(`[CALL ${callId}] [${timestamp}] Sending call_end signal to ${callState.otherUser.id}`);
      sendMessage({
        type: 'call_end',
        roomId: callState.roomId,
        callLogId: callState.callLogId,
        to: callState.otherUser.id,
        receiverId: callState.otherUser.id
      });

      if (callState.callLogId) {
        apiRequest('PATCH', `/api/calls/${callState.callLogId}/status`, {
          status: reason === 'timeout' ? 'missed' : 'ended',
          duration: callState.duration
        }).catch(error => console.error(`[CALL ${callId}] Error updating call status:`, error));
      }
    }

    console.log(`[CALL ${callId}] [${timestamp}] Call cleanup complete - Resetting state`);
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

  useEffect(() => {
    if (!lastMessage || !user) return;

    const callId = callState.callLogId || 'unknown';
    const timestamp = new Date().toISOString();

    if (lastMessage.type === 'call_answer') {
      console.log(`[CALL ${callId}] [${timestamp}] Received call_answer - Current status: ${callState.status}`);
      
      if (peerConnectionRef.current && lastMessage.answer && callState.status === 'ringing') {
        console.log(`[CALL ${callId}] [${timestamp}] Setting remote description from answer`);
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(lastMessage.answer))
          .then(() => {
            console.log(`[CALL ${callId}] [${timestamp}] Remote description set successfully - Transitioning to connecting`);
            setCallState(prev => ({ ...prev, status: 'connecting' }));
            
            if (callTimeoutRef.current) {
              clearTimeout(callTimeoutRef.current);
              callTimeoutRef.current = null;
              console.log(`[CALL ${callId}] [${timestamp}] Call timeout cleared - Call answered`);
            }
          })
          .catch(error => {
            console.error(`[CALL ${callId}] [${timestamp}] Error setting remote description:`, error);
            endCall(true, 'signaling_error');
          });
      } else {
        console.warn(`[CALL ${callId}] [${timestamp}] Ignoring call_answer - Invalid state or missing peer connection`);
      }
    }

    if (lastMessage.type === 'ice_candidate') {
      if (peerConnectionRef.current && lastMessage.candidate && callState.status !== 'idle') {
        console.log(`[CALL ${callId}] [${timestamp}] Adding ICE candidate`);
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(lastMessage.candidate))
          .then(() => console.log(`[CALL ${callId}] [${timestamp}] ICE candidate added successfully`))
          .catch(error => console.error(`[CALL ${callId}] [${timestamp}] Error adding ICE candidate:`, error));
      }
    }

    if (lastMessage.type === 'call_decline') {
      console.log(`[CALL ${callId}] [${timestamp}] Received call_decline - Current status: ${callState.status}`);
      if (callState.status !== 'idle') {
        stopRingtone();
        playCallEnd();
        endCall(false, 'declined');
      }
    }

    if (lastMessage.type === 'call_end') {
      console.log(`[CALL ${callId}] [${timestamp}] Received call_end - Current status: ${callState.status}`);
      if (callState.status !== 'idle') {
        endCall(false, 'remote_hangup');
      }
    }
  }, [lastMessage, user, callState.status, callState.callLogId, endCall, stopRingtone, playCallEnd]);

  const startCall = useCallback(async (
    roomId: string,
    receiverId: string,
    otherUser: { id: string; fullName: string; profilePicture?: string },
    callType: CallType = 'audio'
  ) => {
    const timestamp = new Date().toISOString();
    console.log(`[CALL] [${timestamp}] Starting ${callType} call to ${otherUser.fullName} (${receiverId})`);
    
    try {
      const response = await apiRequest('POST', `/api/calls/start`, { roomId, receiverId, callType });
      const callLog = await response.json();
      const callId = callLog.id;
      
      console.log(`[CALL ${callId}] [${timestamp}] Call log created - Room: ${roomId}`);

      setCallState({
        callLogId: callId,
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

      console.log(`[CALL ${callId}] [${timestamp}] Requesting media permissions:`, constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      console.log(`[CALL ${callId}] [${timestamp}] Media stream acquired - Tracks: ${stream.getTracks().length}`);

      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;
      console.log(`[CALL ${callId}] [${timestamp}] RTCPeerConnection created`);

      pc.onconnectionstatechange = () => {
        console.log(`[CALL ${callId}] [${new Date().toISOString()}] Connection state: ${pc.connectionState}`);
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          console.error(`[CALL ${callId}] Connection ${pc.connectionState} - Ending call`);
          endCall(true, 'connection_failed');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[CALL ${callId}] [${new Date().toISOString()}] ICE connection state: ${pc.iceConnectionState}`);
      };

      stream.getTracks().forEach(track => {
        console.log(`[CALL ${callId}] [${timestamp}] Adding track: ${track.kind}`);
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`[CALL ${callId}] [${new Date().toISOString()}] Sending ICE candidate`);
          sendMessage({
            type: 'ice_candidate',
            roomId,
            callLogId: callId,
            candidate: event.candidate,
            to: receiverId,
            receiverId: receiverId
          });
        } else {
          console.log(`[CALL ${callId}] [${new Date().toISOString()}] ICE candidate gathering complete`);
        }
      };

      pc.ontrack = (event) => {
        console.log(`[CALL ${callId}] [${new Date().toISOString()}] Remote track received - Transitioning to connected`);
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
        
        console.log(`[CALL ${callId}] [${new Date().toISOString()}] Call connected - Duration timer started`);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log(`[CALL ${callId}] [${timestamp}] WebRTC offer created and set as local description`);

      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log(`[CALL ${callId}] [${timestamp}] Sending call_offer to ${receiverId}`);
      sendMessage({
        type: 'call_offer',
        roomId,
        callLogId: callId,
        callType,
        offer,
        from: {
          id: user.id,
          fullName: user.fullName,
          profilePicture: user.profilePicture
        },
        to: receiverId,
        receiverId: receiverId
      });

      playRingtone();
      setCallState(prev => ({ ...prev, status: 'ringing' }));
      console.log(`[CALL ${callId}] [${timestamp}] Call state: ringing - Ringtone started`);

      callTimeoutRef.current = setTimeout(() => {
        console.warn(`[CALL ${callId}] [${new Date().toISOString()}] Call timeout - No answer after 60 seconds`);
        endCall(true, 'timeout');
      }, 60000);
      console.log(`[CALL ${callId}] [${timestamp}] Call timeout set - 60 seconds`);
      
    } catch (error) {
      console.error(`[CALL] [${timestamp}] Error starting call:`, error);
      endCall(true, 'error');
    }
  }, [sendMessage, playRingtone, stopRingtone, playCallConnect, user, endCall]);

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
