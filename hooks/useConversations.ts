"use client";

import { useState, useEffect, useCallback } from "react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { Conversation, Message } from "./useChat";

interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  const endpoint = userId
    ? `/api/chat/conversations/user/${userId}?page=1&limit=50`
    : "";

  // Fetch conversations with full response (data + pagination)
  const [responseData, setResponseData] =
    useState<ConversationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchConversations = useCallback(async () => {
    if (!endpoint) return;

    setLoading(true);
    setError(null);

    try {
      const { api } = await import("@/lib/api");
      const response = await api.get<ConversationsResponse>(endpoint);
      if (response.success) {
        setResponseData(response);
      } else {
        throw new Error(response.message || "Failed to fetch conversations");
      }
    } catch (err) {
      setError(err);
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const refetch = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (userId && endpoint) {
      fetchConversations();
    }
  }, [userId, endpoint, fetchConversations]);

  const updateConversation = useCallback(
    (conversationId: string, updates: Partial<Conversation>) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === conversationId ? { ...conv, ...updates } : conv
        )
      );
    },
    []
  );

  const addOrUpdateConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const existingIndex = prev.findIndex((c) => c._id === conversation._id);
      if (existingIndex >= 0) {
        // Update existing and move to top
        const updated = [...prev];
        updated[existingIndex] = conversation;
        // Move to top
        return [conversation, ...updated.filter((_, i) => i !== existingIndex)];
      } else {
        // Add new at top
        return [conversation, ...prev];
      }
    });
  }, []);

  const incrementUnread = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === conversationId
          ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
          : conv
      )
    );
  }, []);

  const resetUnread = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  }, []);

  useEffect(() => {
    if (responseData) {
      // responseData is the full ConversationsResponse: { success, data: Conversation[], pagination }
      if (
        responseData.success &&
        responseData.data &&
        Array.isArray(responseData.data)
      ) {
        setConversations(responseData.data);
        setPagination(responseData.pagination);
      }
    }
  }, [responseData]);

  // Subscribe to WebSocket messages via centralized context
  const { subscribe } = useWebSocketContext();

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribe((message) => {
      if (message.type === "new_message" || message.type === "message_sent") {
        const msgData = message.data;
        const msg = msgData.message as Message;
        const convId = msgData.conversationId || msg?.conversationId;

        if (!convId || !msg) return;

        // Update conversation with new last message
        updateConversation(convId, {
          lastMessage: msg,
          lastMessageAt: msg.createdAt,
        });

        // Increment unread if message is for current user
        if (message.type === "new_message") {
          const receiverId =
            typeof msg.receiverId === "object"
              ? msg.receiverId._id
              : msg.receiverId;
          if (receiverId === userId) {
            incrementUnread(convId);
          }
        }
      }
    });

    return unsubscribe;
  }, [userId, subscribe, updateConversation, incrementUnread]);

  return {
    conversations,
    pagination,
    loading,
    error,
    refetch,
    updateConversation,
    addOrUpdateConversation,
    incrementUnread,
    resetUnread,
  };
}
