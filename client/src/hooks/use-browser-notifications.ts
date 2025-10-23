import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useServiceWorker } from './use-service-worker';
import type { Notification } from '@shared/schema';

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [, setLocation] = useLocation();
  const { registration, isSupported: isServiceWorkerSupported } = useServiceWorker();

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

  const showNotification = async (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      if (isServiceWorkerSupported && registration) {
        try {
          await registration.showNotification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.category === 'call',
            data: notification,
            vibrate: notification.category === 'call' ? [200, 100, 200, 100, 200] : [200, 100, 200],
          });
          return;
        } catch (error) {
          console.error('Service Worker notification failed, falling back to regular notification:', error);
        }
      }

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
          const metadata = notification.metadata as any;
          const messageId = metadata?.messageId || '';
          setLocation(`/chat?roomId=${metadata.roomId}${messageId ? `&messageId=${messageId}` : ''}`);
        } else if (notification.category === 'task' && notification.metadata?.taskId) {
          const metadata = notification.metadata as any;
          setLocation(`/tasks?taskId=${metadata.taskId}`);
        } else if (notification.category === 'call') {
          setLocation(`/call-history`);
        } else if (notification.category === 'leave_request') {
          setLocation(`/hr`);
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
