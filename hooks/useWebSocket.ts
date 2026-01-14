"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  data: any;
}

interface UseWebSocketOptions {
  userId: string | null;
  onMessage?: (message: WebSocketMessage) => void;
  onNotification?: (notification: any) => void;
  onChatMessage?: (message: any) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    userId,
    onMessage,
    onNotification,
    onChatMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false); // Prevent multiple simultaneous connections
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");

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
      setConnectionStatus("connecting");

      ws.onopen = () => {
        console.log("WebSocket connected");
        isConnectingRef.current = false;
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Handle different message types
          if (message.type === "notification" && onNotification) {
            onNotification(message.data);
          } else if (message.type === "chat_message" && onChatMessage) {
            onChatMessage(message.data);
          } else if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        isConnectingRef.current = false;
        setConnectionStatus("error");
        onError?.(error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        isConnectingRef.current = false;
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onDisconnect?.();

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
            );
            connect();
          }, reconnectInterval);
        } else {
          console.error("Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      isConnectingRef.current = false;
      setConnectionStatus("error");
    }
  }, [
    userId,
    onMessage,
    onNotification,
    onChatMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnectInterval,
    maxReconnectAttempts,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Reset reconnect attempts to prevent auto-reconnect
    reconnectAttemptsRef.current = maxReconnectAttempts;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectingRef.current = false;
    setIsConnected(false);
    setConnectionStatus("disconnected");
  }, [maxReconnectAttempts]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn("WebSocket is not connected");
    return false;
  }, []);

  const joinRoom = useCallback(
    (roomId: string) => {
      sendMessage({ type: "join_room", data: { roomId } });
    },
    [sendMessage]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      sendMessage({ type: "leave_room", data: { roomId } });
    },
    [sendMessage]
  );

  const sendChatMessage = useCallback(
    (roomId: string, message: any) => {
      sendMessage({ type: "chat_message", data: { roomId, message } });
    },
    [sendMessage]
  );

  const sendTyping = useCallback(
    (roomId: string, isTyping: boolean) => {
      sendMessage({ type: "typing", data: { roomId, isTyping } });
    },
    [sendMessage]
  );

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // ONLY userId - don't include connect/disconnect

  return {
    isConnected,
    connectionStatus,
    sendMessage,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    sendTyping,
    disconnect,
    reconnect: connect,
  };
}
