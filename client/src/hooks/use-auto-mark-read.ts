import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Notification } from '@shared/schema';

export function useAutoMarkRead(notifications: Notification[] = []) {
  const [location] = useLocation();

  const markMultipleAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      if (notificationIds.length === 0) return;
      
      if (notificationIds.length === 1) {
        await apiRequest("PUT", `/api/notifications/${notificationIds[0]}/read`);
      } else {
        try {
          await apiRequest("PUT", "/api/notifications/batch-read", {
            notificationIds
          });
        } catch (error) {
          console.warn('[Auto-mark-read] Batch endpoint not available, falling back to individual requests');
          await Promise.all(
            notificationIds.map(id => 
              apiRequest("PUT", `/api/notifications/${id}/read`)
            )
          );
        }
      }
    },
    onSuccess: () => {
      queryClient.resetQueries({ queryKey: ["/api/notifications"] });
    },
  });

  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    const notificationsToMark: string[] = [];

    if (location.startsWith('/chat')) {
      const params = new URLSearchParams(window.location.search);
      const currentRoomId = params.get('roomId');

      unreadNotifications.forEach(notification => {
        if (notification.category === 'message' && notification.metadata?.roomId) {
          const notificationRoomId = notification.metadata.roomId;
          if (currentRoomId === notificationRoomId) {
            notificationsToMark.push(notification.id);
          }
        }
      });
    }

    if (location.startsWith('/tasks')) {
      const params = new URLSearchParams(window.location.search);
      const currentTaskId = params.get('taskId');

      unreadNotifications.forEach(notification => {
        if (notification.category === 'task') {
          if (currentTaskId && notification.metadata?.taskId === currentTaskId) {
            notificationsToMark.push(notification.id);
          } else if (!currentTaskId) {
            notificationsToMark.push(notification.id);
          }
        }
      });
    }

    if (location.startsWith('/call-history')) {
      unreadNotifications.forEach(notification => {
        if (notification.category === 'call') {
          notificationsToMark.push(notification.id);
        }
      });
    }

    if (location.startsWith('/hr')) {
      unreadNotifications.forEach(notification => {
        if (notification.category === 'leave_request') {
          notificationsToMark.push(notification.id);
        }
      });
    }

    if (notificationsToMark.length > 0) {
      markMultipleAsReadMutation.mutate(notificationsToMark);
    }
  }, [location, notifications]);

  return {
    markMultipleAsRead: markMultipleAsReadMutation.mutate,
  };
}
