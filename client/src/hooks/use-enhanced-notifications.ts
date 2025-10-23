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
  const processedNotificationIds = useRef(new Set<string>());
  const notificationTimestamps = useRef(new Map<string, number>());

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expirationTime = 5 * 60 * 1000;
      
      for (const [id, timestamp] of notificationTimestamps.current.entries()) {
        if (now - timestamp > expirationTime) {
          processedNotificationIds.current.delete(id);
          notificationTimestamps.current.delete(id);
        }
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(cleanupInterval);
    };
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
    if (processedNotificationIds.current.has(notification.id)) {
      return;
    }

    processedNotificationIds.current.add(notification.id);
    notificationTimestamps.current.set(notification.id, Date.now());

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

  const handleMessageNotification = useCallback((roomId: string, message: string, sender: string, messageId?: string) => {
    const isOnChatPage = location.startsWith('/chat');
    const currentRoomId = new URLSearchParams(window.location.search).get('roomId');
    const isCurrentRoom = isOnChatPage && currentRoomId === roomId;

    const notificationId = messageId || `msg-${roomId}-${Date.now()}`;
    
    if (processedNotificationIds.current.has(notificationId)) {
      return;
    }

    processedNotificationIds.current.add(notificationId);
    notificationTimestamps.current.set(notificationId, Date.now());

    if (isSoundEnabled() && !isCurrentRoom) {
      playNotificationSound('message');
    }

    if (!isCurrentRoom && permission === 'granted') {
      const notification: Notification = {
        id: notificationId,
        userId: '',
        title: sender,
        message: message,
        type: 'info',
        category: 'message',
        isRead: false,
        metadata: { resourceId: roomId, roomId, messageId: messageId },
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
