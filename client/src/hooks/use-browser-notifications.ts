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
        requireInteraction: false,
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        // Navigate to chat if it's a chat notification
        if (notification.metadata && typeof notification.metadata === 'object' && 'roomId' in notification.metadata) {
          setLocation(`/chat?roomId=${notification.metadata.roomId}`);
        } else {
          // Otherwise go to notifications
          setLocation('/notifications');
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
