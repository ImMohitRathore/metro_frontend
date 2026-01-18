'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useChat } from '@/hooks/useChat';
import { useConversations } from '@/hooks/useConversations';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Message } from '@/hooks/useChat';

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const conversationId = params.id as string;
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { messages, hasMore, loading, loadMore, addMessage, updateMessage, deleteMessage, markAsRead, messagesEndRef } = useMessages(conversationId);
  const { sendMessage, markAsRead: markConversationAsRead } = useChat();
  const { conversations, updateConversation, resetUnread } = useConversations(user?.id || null);

  // Find current conversation
  const conversation = conversations.find((c) => c._id === conversationId);
  const otherParticipant = conversation?.otherParticipant;

  // Use centralized WebSocket context
  const { isConnected, sendTypingIndicator, subscribe } = useWebSocketContext();

  // Subscribe to WebSocket messages
  useEffect(() => {
    console.log("tesitngggggg:::::::::");
    
    if (!conversationId) {
      console.log("Chat page: No conversationId, skipping subscription");
      return;
    }

    console.log("Chat page: Subscribing to messages for conversation:", conversationId);
    const unsubscribe = subscribe((message: { type: string; data: any }) => {
      console.log("Chat page received message:", message, "for conversation:", conversationId);
      console.log("Message type:", message.type);
      
      if (message.type === 'new_message') {
        const msgData = message.data;
        const msgConversationId = msgData.conversationId || msgData.message?.conversationId;
        
        console.log("new_message received - msgConversationId:", msgConversationId, "current conversationId:", conversationId);
        
        if (msgConversationId === conversationId) {
          console.log("Conversation IDs match! Processing message...");
          const newMsg = msgData.message as Message;
          // Ensure conversationId is set on the message
          if (newMsg && !newMsg.conversationId) {
            newMsg.conversationId = conversationId;
          }
          if (newMsg) {
            console.log("Adding message to UI:", newMsg);
            addMessage(newMsg);
            // Mark as delivered if it's for current user
            const receiverId = typeof newMsg.receiverId === 'object' ? newMsg.receiverId._id : newMsg.receiverId;
            if (receiverId === user?.id) {
              updateMessage(newMsg._id, { status: 'delivered', deliveredAt: new Date().toISOString() });
            }
          }
        } else {
          console.log("Conversation IDs don't match, ignoring message");
        }
      } else if (message.type === 'message_sent') {
        const msgData = message.data;
        const msgConversationId = msgData.conversationId || msgData.message?.conversationId;
        
        if (msgConversationId === conversationId) {
          const sentMsg = msgData.message as Message;
          if (sentMsg && !sentMsg.conversationId) {
            sentMsg.conversationId = conversationId;
          }
          if (sentMsg) {
            addMessage(sentMsg);
          }
        }
      } else if (message.type === 'messages_read') {
        if (message.data.conversationId === conversationId) {
          const readMessageIds = messages
            .filter((m) => {
              const senderId = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
              return senderId === user?.id && m.status !== 'read';
            })
            .map((m) => m._id);
          if (readMessageIds.length > 0) {
            markAsRead(readMessageIds);
          }
        }
      } else if (message.type === 'message_deleted') {
        if (message.data.conversationId === conversationId) {
          deleteMessage(message.data.messageId);
        }
      } else if (message.type === 'typing_start' || message.type === 'typing_stop') {
        console.log("Typing indicator received:", message.type, "conversationId:", message.data.conversationId, "current:", conversationId);
        if (message.data.conversationId === conversationId) {
          console.log("Setting typing indicator:", message.type === 'typing_start');
          setOtherUserTyping(message.type === 'typing_start');
        }
      }
    });

    return unsubscribe;
  }, [conversationId, subscribe, addMessage, updateMessage, deleteMessage, markAsRead, messages, user?.id]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId && user?.id && messages.length > 0) {
      const unreadMessages = messages.filter(
        (m) => m.receiverId._id === user.id && m.status !== 'read'
      );
      if (unreadMessages.length > 0) {
        markConversationAsRead(conversationId, user.id);
        resetUnread(conversationId);
      }
    }
  }, [conversationId, user?.id, messages, markConversationAsRead, resetUnread]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!otherParticipant || !isConnected) return;

    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(otherParticipant._id, conversationId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(otherParticipant._id, conversationId, false);
    }, 3000);
  }, [isTyping, otherParticipant, conversationId, sendTypingIndicator, isConnected]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user?.id || !otherParticipant) return;

    const content = messageText.trim();
    setMessageText('');

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping && otherParticipant) {
      setIsTyping(false);
      sendTypingIndicator(otherParticipant._id, conversationId, false);
    }

    try {
      await sendMessage({
        senderId: user.id,
        receiverId: otherParticipant._id,
        content,
        type: 'text',
        conversationId,
      });
      // Message will be added via WebSocket 'message_sent' event
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return '✓✓';
      case 'delivered':
        return '✓✓';
      case 'sent':
        return '✓';
      default:
        return '';
    }
  };

  if (!conversation) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">Conversation not found</p>
              <Link
                href="/chat"
                className="mt-4 inline-block text-rose-600 hover:text-rose-700"
              >
                Back to Messages
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Link
              href="/chat"
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            {otherParticipant.photo ? (
              <img
                src={otherParticipant.photo}
                alt={otherParticipant.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <span className="text-rose-600 font-semibold">
                  {otherParticipant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{otherParticipant.name}</h2>
              {otherUserTyping && (
                <p className="text-xs text-gray-500">typing...</p>
              )}
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          <div className="max-w-4xl mx-auto">
            {hasMore && (
              <div className="text-center mb-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm text-rose-600 hover:text-rose-700 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load older messages'}
                </button>
              </div>
            )}

            {messages.map((message, index) => {
              const isOwnMessage = message.senderId._id === user?.id;
              const showDate =
                index === 0 ||
                new Date(message.createdAt).toDateString() !==
                  new Date(messages[index - 1].createdAt).toDateString();

              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-rose-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                      }`}
                    >
                      {message.replyTo && (
                        <div
                          className={`mb-2 pl-3 border-l-2 ${
                            isOwnMessage ? 'border-white/50' : 'border-gray-300'
                          }`}
                        >
                          <p className={`text-xs ${isOwnMessage ? 'text-white/80' : 'text-gray-500'}`}>
                            {message.replyTo.senderId.name}
                          </p>
                          <p className={`text-sm ${isOwnMessage ? 'text-white/90' : 'text-gray-600'}`}>
                            {message.replyTo.content}
                          </p>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.isDeleted ? (
                          <span className="italic opacity-70">This message was deleted</span>
                        ) : (
                          message.content
                        )}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-xs opacity-70">
                          {formatTime(message.createdAt)}
                        </span>
                        {isOwnMessage && (
                          <span className="text-xs opacity-70">
                            {getMessageStatusIcon(message.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="bg-rose-600 text-white px-6 py-2 rounded-full hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
