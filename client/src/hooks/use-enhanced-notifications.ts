import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useNotificationSounds } from './use-notification-sounds';
import { useBrowserNotifications } from './use-browser-notifications';
import { Notification } from '@shared/schema';

interface EnhancedNotificationOptions {
  playSound?: boolean;
  showBrowserNotification?: boolean;
  forceSound?: boolean;
}

export function useEnhancedNotifications() {
  const [location] = useLocation();
  const { playNotificationSound, isSoundEnabled } = useNotificationSounds();
  const { showNotification: showBrowserNotification, permission, requestPermission } = useBrowserNotifications();
  const isPageVisibleRef = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const shouldShowBrowserNotification = useCallback((notification: Notification): boolean => {
    if (!isPageVisibleRef.current) {
      return true;
    }

    if (notification.category === 'message' && notification.metadata?.roomId) {
      const isOnChatPage = location.startsWith('/chat');
      const currentRoomId = new URLSearchParams(window.location.search).get('roomId');
      const notificationRoomId = notification.metadata.roomId;
      
      return !(isOnChatPage && currentRoomId === notificationRoomId);
    }

    if (notification.category === 'task' && notification.metadata?.taskId) {
      return !location.startsWith('/tasks');
    }

    if (notification.category === 'call') {
      return true;
    }

    return true;
  }, [location]);

  const handleNotification = useCallback(async (
    notification: Notification,
    options: EnhancedNotificationOptions = {}
  ) => {
    const {
      playSound = true,
      showBrowserNotification: showBrowser = true,
      forceSound = false
    } = options;

    const soundType = notification.category === 'message' ? 'message' :
                      notification.category === 'call' ? 'call' :
                      notification.category === 'task' ? 'task' : 'system';

    if ((playSound && isSoundEnabled()) || forceSound) {
      playNotificationSound(soundType);
    }

    if (showBrowser && shouldShowBrowserNotification(notification) && permission === 'granted') {
      showBrowserNotification(notification);
    }
  }, [playNotificationSound, shouldShowBrowserNotification, showBrowserNotification, permission, isSoundEnabled]);

  const handleMessageNotification = useCallback((roomId: string, message: string, sender: string) => {
    const isOnChatPage = location.startsWith('/chat');
    const currentRoomId = new URLSearchParams(window.location.search).get('roomId');
    const isCurrentRoom = isOnChatPage && currentRoomId === roomId;

    if (isSoundEnabled() && !isCurrentRoom) {
      playNotificationSound('message');
    }

    if (!isCurrentRoom && isPageVisibleRef.current && permission === 'granted') {
      const notification: Notification = {
        id: Date.now().toString(),
        userId: '',
        title: sender,
        message: message,
        type: 'info',
        category: 'message',
        isRead: false,
        metadata: { resourceId: roomId, roomId, messageId: undefined },
        createdAt: new Date(),
      };
      showBrowserNotification(notification);
    } else if (!isPageVisibleRef.current && permission === 'granted') {
      const notification: Notification = {
        id: Date.now().toString(),
        userId: '',
        title: sender,
        message: message,
        type: 'info',
        category: 'message',
        isRead: false,
        metadata: { resourceId: roomId, roomId, messageId: undefined },
        createdAt: new Date(),
      };
      showBrowserNotification(notification);
    }
  }, [location, playNotificationSound, showBrowserNotification, permission, isSoundEnabled]);

  const ensureBrowserNotificationPermission = useCallback(async () => {
    if (permission === 'default') {
      await requestPermission();
    }
  }, [permission, requestPermission]);

  return {
    handleNotification,
    handleMessageNotification,
    ensureBrowserNotificationPermission,
    permission,
    isPageVisible: isPageVisibleRef.current,
  };
}
