import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  data: any;
}

interface UseWebSocketProps {
  userId?: string;
}

export function useWebSocket(props?: UseWebSocketProps) {
  const { userId } = props || {};
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Initialize Socket.IO client
    socket.current = io({
      path: '/socket.io/',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });
    
    // Handle connection
    socket.current.on('connect', () => {
      setIsConnected(true);
      console.log('Socket.IO connected:', socket.current?.id);
      
      if (userId && socket.current) {
        socket.current.emit('subscribe', { userId });
        console.log(`Socket.IO subscribed for user: ${userId}`);
      }
    });
    
    // Handle disconnection
    socket.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket.IO disconnected');
    });
    
    // Handle connection errors
    socket.current.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
    
    // Handle incoming messages
    socket.current.on('message', (message: WebSocketMessage) => {
      setLastMessage(message);
    });

    // Also listen for specific event types that might be emitted directly
    const eventTypes = [
      'new_notification',
      'new_message',
      'message_deleted',
      'reaction_removed',
      'aux_status_update',
      'employee_status_update',
      'new_meeting',
      'call_offer',
      'call_answer',
      'ice_candidate',
      'call_end',
      'call_decline'
    ];

    eventTypes.forEach(eventType => {
      socket.current?.on(eventType, (data: any) => {
        setLastMessage({ type: eventType, data });
      });
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [userId]);

  const sendMessage = (message: WebSocketMessage) => {
    if (socket.current && socket.current.connected) {
      // For specific message types, emit them as separate events
      if (message.type) {
        socket.current.emit(message.type, message);
      } else {
        socket.current.emit('message', message);
      }
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
