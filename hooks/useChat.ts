"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

export interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    photo?: string;
  };
  receiverId: {
    _id: string;
    name: string;
    photo?: string;
  };
  type: "text" | "image" | "video" | "audio" | "file" | "location";
  content: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status: "sent" | "delivered" | "read";
  readAt?: string;
  deliveredAt?: string;
  replyTo?: {
    _id: string;
    content: string;
    senderId: {
      _id: string;
      name: string;
    };
  };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  otherParticipant: {
    _id: string;
    name: string;
    photo?: string;
    emailAddress: string;
  };
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOrCreateConversation = useCallback(
    async (userId1: string, userId2: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post<{
          success: boolean;
          data: any;
          message?: string;
        }>("/api/chat/conversation", {
          userId1,
          userId2,
        });
        // api.post returns { success, data, message } structure
        if (response.success) {
          return response;
        } else {
          throw new Error(
            response.message || "Failed to get/create conversation"
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to get/create conversation";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (messageData: {
      senderId: string;
      receiverId: string;
      content: string;
      type?: string;
      conversationId?: string;
      replyTo?: string;
    }): Promise<Message> => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post<{ success: boolean; data: Message }>(
          "/api/chat/message",
          messageData
        );
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error("Failed to send message");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const markAsRead = useCallback(
    async (conversationId: string, userId: string) => {
      try {
        await api.patch(`/api/chat/messages/${conversationId}/read`, {
          userId,
        });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    },
    []
  );

  const deleteMessage = useCallback(
    async (messageId: string, userId: string) => {
      try {
        await api.delete(`/api/chat/message/${messageId}`, {
          body: JSON.stringify({ userId }),
        } as any);
      } catch (err) {
        console.error("Error deleting message:", err);
        throw err;
      }
    },
    []
  );

  return {
    getOrCreateConversation,
    sendMessage,
    markAsRead,
    deleteMessage,
    loading,
    error,
  };
}
