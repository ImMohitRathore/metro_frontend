"use client";

import { useState, useEffect } from "react";
import { useApi } from "./useApi";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

interface UnreadMessagesResponse {
  success: boolean;
  data: {
    totalUnread: number;
  };
}

export function useUnreadMessages(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread message count
  const { data: unreadData, execute: refetchUnread } = useApi<UnreadMessagesResponse>(
    userId ? `/api/chat/unread/${userId}` : null,
    {
      immediate: !!userId,
    }
  );

  // Subscribe to WebSocket messages via centralized context
  const { subscribe } = useWebSocketContext();

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribe((message) => {
      // When unread count is updated, refresh from server
      if (message.type === "unread_count_updated") {
        // Refresh count to get accurate total across all conversations
        refetchUnread();
      }
      // When a new message arrives, increment count
      else if (message.type === "new_message") {
        const msgData = message.data;
        const receiverId = typeof msgData.message?.receiverId === 'object' 
          ? msgData.message.receiverId._id 
          : msgData.message?.receiverId;
        
        // Only increment if message is for current user
        if (receiverId === userId) {
          setUnreadCount((prev) => prev + 1);
        }
      }
      // When messages are read, refresh count
      else if (message.type === "messages_read") {
        // Refresh count when messages are read (could be by current user or other user)
        refetchUnread();
      }
    });

    return unsubscribe;
  }, [userId, subscribe, refetchUnread]);

  // Update count when API data changes
  useEffect(() => {
    if (unreadData?.data?.totalUnread !== undefined) {
      setUnreadCount(unreadData.data.totalUnread);
    }
  }, [unreadData]);

  return { unreadCount, refetch: refetchUnread };
}
