import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import type { Notification } from '@shared/schema';

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [, setLocation] = useLocation();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return Notification.permission;
  };

  const showNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.category === 'call',
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        if (notification.category === 'message' && notification.metadata?.roomId) {
          const messageId = notification.metadata?.messageId || '';
          setLocation(`/chat?roomId=${notification.metadata.roomId}${messageId ? `&messageId=${messageId}` : ''}`);
        } else if (notification.category === 'task' && notification.metadata?.taskId) {
          setLocation(`/tasks`);
        } else if (notification.category === 'call' && notification.metadata?.roomId) {
          setLocation(`/chat?roomId=${notification.metadata.roomId}`);
        } else {
          setLocation('/dashboard');
        }
      };
    }
  };

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
  };
}
