"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Message } from "./useChat";

interface MessagesResponse {
  success: boolean;
  data: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const endpoint = conversationId
    ? `/api/chat/messages/${conversationId}?page=1&limit=50`
    : "";

  // Fetch messages - API returns { success: true, data: Message[], pagination: {...} }
  const [apiLoading, setApiLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!endpoint) return;

    setApiLoading(true);
    try {
      // Fetch full response directly to get both data and pagination
      // API returns: { success: true, data: Message[], pagination: {...} }
      const fullResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
        }${endpoint}`
      );
      const fullData: MessagesResponse = await fullResponse.json();

      if (fullData.success && fullData.data && Array.isArray(fullData.data)) {
        setMessages(fullData.data);
        setHasMore(fullData.pagination?.hasMore ?? false);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setApiLoading(false);
    }
  }, [endpoint]);

  const refetch = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (conversationId && endpoint) {
      fetchMessages();
    }
  }, [conversationId, endpoint, fetchMessages]);

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || loading || apiLoading) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
        }/api/chat/messages/${conversationId}?before=${
          oldestMessage.createdAt
        }&limit=50`
      );
      const result: MessagesResponse = await response.json();

      if (result.success && result.data.length > 0) {
        setMessages((prev) => [...result.data, ...prev]);
        setHasMore(result.pagination.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, messages, hasMore, loading, apiLoading]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Check if message already exists
      if (prev.some((m) => m._id === message._id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const updateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, ...updates } : msg
        )
      );
    },
    []
  );

  const deleteMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
  }, []);

  const markAsRead = useCallback((messageIds: string[]) => {
    setMessages((prev) =>
      prev.map((msg) =>
        messageIds.includes(msg._id) && msg.status !== "read"
          ? {
              ...msg,
              status: "read" as const,
              readAt: new Date().toISOString(),
            }
          : msg
      )
    );
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, scrollToBottom]);

  return {
    messages,
    hasMore,
    loading: loading || apiLoading,
    error: null,
    loadMore,
    addMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    refetch,
    messagesEndRef,
    scrollToBottom,
  };
}
