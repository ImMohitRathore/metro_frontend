"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";

interface WebSocketMessage {
  type: string;
  data: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => boolean;
  sendTypingIndicator: (targetUserId: string, conversationId: string, isTyping: boolean) => void;
  subscribe: (callback: (message: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ 
  children, 
  userId 
}: { 
  children: ReactNode; 
  userId: string | null;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const subscribersRef = useRef<Set<(message: WebSocketMessage) => void>>(new Set());
  const [isConnected, setIsConnected] = useState(false);

  const subscribe = useCallback((callback: (message: WebSocketMessage) => void) => {
    subscribersRef.current.add(callback);
    // Return unsubscribe function
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  const notifySubscribers = useCallback((message: WebSocketMessage) => {
    console.log("Notifying subscribers, count:", subscribersRef.current.size);
    subscribersRef.current.forEach((callback, index) => {
      try {
        console.log(`Calling subscriber ${index}`);
        callback(message);
      } catch (error) {
        console.error("Error in WebSocket subscriber callback:", error);
      }
    });
  }, []);

  const connect = useCallback(() => {
    if (
      !userId ||
      isConnectingRef.current ||
      (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      `ws://localhost:5001/ws?userId=${userId}`;

    try {
      isConnectingRef.current = true;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected (centralized)");
        isConnectingRef.current = false;
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const rawData = event.data;
          console.log("WebSocketContext RAW message received:", rawData);
          const message: WebSocketMessage = JSON.parse(rawData);
          console.log("WebSocketContext parsed message:", message);
          console.log("Message type:", message.type);
          console.log("Number of subscribers:", subscribersRef.current.size);
          // Notify all subscribers
          notifySubscribers(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          console.error("Raw message data:", event.data);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        isConnectingRef.current = false;
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected (centralized)");
        isConnectingRef.current = false;
        setIsConnected(false);

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < 5 && userId) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `Attempting to reconnect (${reconnectAttemptsRef.current}/5)...`
            );
            connect();
          }, 3000);
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      isConnectingRef.current = false;
    }
  }, [userId, notifySubscribers]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 5; // Prevent auto-reconnect

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectingRef.current = false;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn("WebSocket is not connected");
    return false;
  }, []);

  const sendTypingIndicator = useCallback(
    (targetUserId: string, conversationId: string, isTyping: boolean) => {
      sendMessage({
        type: isTyping ? "typing_start" : "typing_stop",
        data: { targetUserId, conversationId },
      });
    },
    [sendMessage]
  );

  useEffect(() => {
    if (userId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        sendTypingIndicator,
        subscribe,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
}
