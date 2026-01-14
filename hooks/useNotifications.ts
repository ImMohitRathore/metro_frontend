"use client";

import { useState, useEffect } from "react";
import { useApi } from "./useApi";
import { useWebSocket } from "./useWebSocket";

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  status: "unread" | "read" | "archived";
  metadata?: any;
  link?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

export function useNotifications(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notification stats to get unread count
  const { data: statsData, execute: refetchStats } = useApi<{
    success: boolean;
    data: { unread: number };
  }>(userId ? `/api/notifications/stats/${userId}` : null, {
    immediate: !!userId,
  });

  // Setup WebSocket to listen for new notifications
  useWebSocket({
    userId,
    onNotification: (notification) => {
      // Refresh stats when new notification arrives
      if (userId) {
        refetchStats();
      }
    },
  });

  useEffect(() => {
    if (statsData?.data?.unread !== undefined) {
      setUnreadCount(statsData.data.unread);
    }
  }, [statsData]);

  return { unreadCount, refetch: refetchStats };
}
