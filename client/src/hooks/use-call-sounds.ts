import { useRef, useEffect } from 'react';

export function useCallSounds() {
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const callEndRef = useRef<HTMLAudioElement | null>(null);
  const callConnectRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    callEndRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3');
    callConnectRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    if (ringtoneRef.current) {
      ringtoneRef.current.loop = true;
      ringtoneRef.current.volume = 0.7;
    }
    if (callEndRef.current) {
      callEndRef.current.volume = 0.5;
    }
    if (callConnectRef.current) {
      callConnectRef.current.volume = 0.5;
    }

    return () => {
      ringtoneRef.current?.pause();
      callEndRef.current?.pause();
      callConnectRef.current?.pause();
    };
  }, []);

  const playRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.play().catch(console.error);
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  const playCallEnd = () => {
    if (callEndRef.current) {
      callEndRef.current.currentTime = 0;
      callEndRef.current.play().catch(console.error);
    }
  };

  const playCallConnect = () => {
    if (callConnectRef.current) {
      callConnectRef.current.currentTime = 0;
      callConnectRef.current.play().catch(console.error);
    }
  };

  return {
    playRingtone,
    stopRingtone,
    playCallEnd,
    playCallConnect,
  };
}
