'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useChat, Message } from '@/hooks/useChat';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
}

export default function ChatModal({
  isOpen,
  onClose,
  otherUserId,
  otherUserName,
  otherUserPhoto,
}: ChatModalProps) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { getOrCreateConversation, sendMessage, markAsRead: markConversationAsRead } = useChat();

  // Get or create conversation when modal opens
  useEffect(() => {
    if (isOpen && user?.id && !conversationId && !loading) {
      setLoading(true);
      getOrCreateConversation(user.id, otherUserId)
        .then((response) => {
          console.log('Conversation response:', response);
          // The response contains { success: boolean, data: Conversation }
          if (response && response.success && response.data) {
            const conv = response.data;
            console.log('Conversation data:', conv);
            // Handle both cases: response.data might be the conversation object directly
            let convId: string | null = null;
            
            if (typeof conv === 'string') {
              convId = conv;
            } else if (typeof conv === 'object' && conv !== null) {
              // Check if it has _id property (could be string or ObjectId)
              if ('_id' in conv) {
                // Handle both string and ObjectId cases
                const idValue = conv._id;
                if (typeof idValue === 'string') {
                  convId = idValue;
                } else if (idValue && typeof idValue === 'object' && 'toString' in idValue) {
                  // It's an ObjectId-like object, convert to string
                  convId = idValue.toString();
                } else if (idValue) {
                  // Try to convert to string
                  convId = String(idValue);
                }
              } else if ('id' in conv && typeof conv.id === 'string') {
                convId = conv.id;
              }
            }
            
            if (convId) {
              console.log('Setting conversation ID:', convId);
              setConversationId(convId);
              setLoading(false);
            } else {
              console.error('Invalid conversation response - no ID found:', conv);
              throw new Error('Invalid conversation response: No conversation ID found');
            }
          } else {
            console.error('Failed to create conversation:', response);
            throw new Error(response?.message || 'Failed to create conversation');
          }
        })
        .catch((error) => {
          console.error('Error creating conversation:', error);
          console.error('Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          const errorMessage = error instanceof Error ? error.message : 'Failed to start chat. Please try again.';
          // alert(errorMessage);
          setLoading(false);
          // Don't close modal on error, let user retry
        });
    }
  }, [isOpen, user?.id, otherUserId, conversationId, getOrCreateConversation, loading]);

  const { messages, hasMore, loading: messagesLoading, loadMore, addMessage, updateMessage, deleteMessage, markAsRead, messagesEndRef } = useMessages(conversationId);

  // Use centralized WebSocket context
  const { isConnected, sendTypingIndicator, subscribe } = useWebSocketContext();

  // Subscribe to WebSocket messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribe((message) => {
      console.log("ChatModal received message:", message);
      
      if (message.type === 'new_message') {
        const msgData = message.data;
        const msgConversationId = msgData.conversationId || msgData.message?.conversationId;
        
        if (msgConversationId === conversationId) {
          const newMsg = msgData.message as Message;
          // Ensure conversationId is set on the message
          if (newMsg && !newMsg.conversationId) {
            newMsg.conversationId = conversationId;
          }
          if (newMsg) {
            addMessage(newMsg);
            // Mark as delivered if it's for current user
            const receiverId = typeof newMsg.receiverId === 'object' ? newMsg.receiverId._id : newMsg.receiverId;
            if (receiverId === user?.id) {
              updateMessage(newMsg._id, { status: 'delivered', deliveredAt: new Date().toISOString() });
            }
          }
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
      } else if (message.type === 'typing_start') {
        if (message.data.conversationId === conversationId) {
          setOtherUserTyping(true);
        }
      } else if (message.type === 'typing_stop') {
        if (message.data.conversationId === conversationId) {
          setOtherUserTyping(false);
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
      }
    }
  }, [conversationId, user?.id, messages, markConversationAsRead]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!otherUserId || !isConnected || !conversationId) return;

    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(otherUserId, conversationId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(otherUserId, conversationId, false);
    }, 3000);
  }, [isTyping, otherUserId, conversationId, sendTypingIndicator, isConnected]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user?.id || !conversationId) return;

    const content = messageText.trim();
    setMessageText('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(otherUserId, conversationId, false);
    }

    try {
      await sendMessage({
        senderId: user.id,
        receiverId: otherUserId,
        content,
        type: 'text',
        conversationId,
      });
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

  // Reset conversation ID when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConversationId(null);
      setMessageText('');
      setOtherUserTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {otherUserPhoto ? (
              <img
                src={otherUserPhoto}
                alt={otherUserName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <span className="text-rose-600 font-semibold">
                  {otherUserName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900">{otherUserName}</h2>
              {otherUserTyping && (
                <p className="text-xs text-gray-500">typing...</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50"
        >
          {loading || messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mb-4"></div>
                <p className="text-gray-500">Loading conversation...</p>
              </div>
            </div>
          ) : (
            <div>
              {hasMore && (
                <div className="text-center mb-4">
                  <button
                    onClick={loadMore}
                    disabled={messagesLoading}
                    className="text-sm text-rose-600 hover:text-rose-700 disabled:opacity-50"
                  >
                    {messagesLoading ? 'Loading...' : 'Load older messages'}
                  </button>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => {
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
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-3">
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
              disabled={!conversationId || loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || !conversationId || loading}
              className="bg-rose-600 text-white px-6 py-2 rounded-full hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
