import { useRef, useCallback } from 'react';

type NotificationSoundType = 'message' | 'call' | 'task' | 'system';

export function useNotificationSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(true);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback((frequency: number, duration: number, volume: number = 0.3) => {
    if (!soundEnabledRef.current) return;

    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [getAudioContext]);

  const playMessageSound = useCallback(() => {
    playBeep(800, 0.1);
    setTimeout(() => playBeep(1000, 0.1), 100);
  }, [playBeep]);

  const playCallSound = useCallback(() => {
    const playRing = () => {
      playBeep(480, 0.4);
      setTimeout(() => playBeep(400, 0.4), 450);
    };
    playRing();
  }, [playBeep]);

  const playTaskSound = useCallback(() => {
    playBeep(600, 0.15);
    setTimeout(() => playBeep(800, 0.15), 150);
    setTimeout(() => playBeep(1000, 0.15), 300);
  }, [playBeep]);

  const playSystemSound = useCallback(() => {
    playBeep(700, 0.2);
  }, [playBeep]);

  const playNotificationSound = useCallback((type: NotificationSoundType) => {
    switch (type) {
      case 'message':
        playMessageSound();
        break;
      case 'call':
        playCallSound();
        break;
      case 'task':
        playTaskSound();
        break;
      case 'system':
        playSystemSound();
        break;
      default:
        playSystemSound();
    }
  }, [playMessageSound, playCallSound, playTaskSound, playSystemSound]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabledRef.current = enabled;
    localStorage.setItem('notificationSoundsEnabled', enabled.toString());
  }, []);

  const isSoundEnabled = useCallback(() => {
    const stored = localStorage.getItem('notificationSoundsEnabled');
    return stored !== 'false';
  }, []);

  return {
    playNotificationSound,
    playMessageSound,
    playCallSound,
    playTaskSound,
    playSystemSound,
    setSoundEnabled,
    isSoundEnabled,
  };
}
