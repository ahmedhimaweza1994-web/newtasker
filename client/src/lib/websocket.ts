import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  data: any;
}

interface UseWebSocketProps {
  userId?: string;
}

type MessageCallback = (message: WebSocketMessage) => void;
type ConnectionStateCallback = (isConnected: boolean) => void;

let globalSocket: Socket | null = null;
let globalUserId: string | null = null;
let connectionCount = 0;
let messageCallbacks = new Set<MessageCallback>();
let connectionStateCallbacks = new Set<ConnectionStateCallback>();
let globalIsConnected = false;
let isSocketInitialized = false;

const EVENT_TYPES = [
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

function dispatchToAllCallbacks(message: WebSocketMessage) {
  messageCallbacks.forEach(callback => {
    try {
      callback(message);
    } catch (error) {
      console.error('[WebSocket] Error in message callback:', error);
    }
  });
}

function notifyConnectionStateChange(isConnected: boolean) {
  globalIsConnected = isConnected;
  connectionStateCallbacks.forEach(callback => {
    try {
      callback(isConnected);
    } catch (error) {
      console.error('[WebSocket] Error in connection state callback:', error);
    }
  });
}

function initializeSocketHandlers(socket: Socket, userId: string) {
  if (isSocketInitialized) {
    return;
  }

  isSocketInitialized = true;

  socket.on('connect', () => {
    console.log(`[WebSocket] Connected: ${socket.id} for user: ${userId}`);
    socket.emit('subscribe', { userId });
    notifyConnectionStateChange(true);
  });

  socket.on('disconnect', () => {
    console.log('[WebSocket] Disconnected');
    notifyConnectionStateChange(false);
  });

  socket.on('connect_error', (error: Error) => {
    console.error('[WebSocket] Connection error:', error);
  });

  socket.on('message', (message: WebSocketMessage) => {
    dispatchToAllCallbacks(message);
  });

  EVENT_TYPES.forEach(eventType => {
    socket.on(eventType, (data: any) => {
      dispatchToAllCallbacks({ type: eventType, data });
    });
  });
}

export function useWebSocket(props?: UseWebSocketProps) {
  const { userId } = props || {};
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const messageCallbackRef = useRef<MessageCallback | null>(null);
  const connectionStateCallbackRef = useRef<ConnectionStateCallback | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    connectionCount++;

    if (globalSocket && globalUserId !== userId) {
      console.log('[WebSocket] User changed, disconnecting old socket');
      globalSocket.disconnect();
      globalSocket = null;
      globalUserId = null;
      isSocketInitialized = false;
      messageCallbacks.clear();
      connectionStateCallbacks.clear();
    }

    if (!globalSocket) {
      console.log('[WebSocket] Creating new global socket');
      globalSocket = io('https://hub.greenweb-tech.com', {
        path: '/socket.io/',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        transports: ['polling'] // Force HTTP polling only, ignore WebSocket
      });
      globalUserId = userId;
      initializeSocketHandlers(globalSocket, userId);
    }
    
    socket.current = globalSocket;
    setIsConnected(globalIsConnected);

    const messageCallback: MessageCallback = (message) => {
      setLastMessage(message);
    };
    
    const connectionStateCallback: ConnectionStateCallback = (connected) => {
      setIsConnected(connected);
    };
    
    messageCallbackRef.current = messageCallback;
    connectionStateCallbackRef.current = connectionStateCallback;
    
    messageCallbacks.add(messageCallback);
    connectionStateCallbacks.add(connectionStateCallback);

    if (globalSocket.connected && userId) {
      globalSocket.emit('subscribe', { userId });
    }

    return () => {
      connectionCount--;
      
      if (messageCallbackRef.current) {
        messageCallbacks.delete(messageCallbackRef.current);
      }
      
      if (connectionStateCallbackRef.current) {
        connectionStateCallbacks.delete(connectionStateCallbackRef.current);
      }

      if (connectionCount === 0 && globalSocket) {
        console.log('[WebSocket] Last connection closed, disconnecting socket');
        globalSocket.disconnect();
        globalSocket = null;
        globalUserId = null;
        isSocketInitialized = false;
        messageCallbacks.clear();
        connectionStateCallbacks.clear();
      }
    };
  }, [userId]);

  const sendMessage = (message: WebSocketMessage) => {
    const activeSocket = socket.current || globalSocket;
    if (activeSocket && activeSocket.connected) {
      if (message.type) {
        activeSocket.emit(message.type, message);
      } else {
        activeSocket.emit('message', message);
      }
    } else {
      console.warn('[WebSocket] Cannot send message - socket not connected');
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
