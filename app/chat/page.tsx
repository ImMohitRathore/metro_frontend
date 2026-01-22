'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import CustomFormField from '@/components/CustomFormField';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { Conversation } from '@/hooks/useChat';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { conversations, loading } = useConversations(user?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const filteredConversations = conversations.filter((conv) =>
    conv.otherParticipant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  console.log("conversations", conversations , filteredConversations);
  

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';
    if (conversation.lastMessage.isDeleted) return 'This message was deleted';
    if (conversation.lastMessage.type !== 'text') {
      const typeMap: { [key: string]: string } = {
        image: '📷 Photo',
        video: '🎥 Video',
        audio: '🎵 Audio',
        file: '📎 File',
        location: '📍 Location',
      };
      return typeMap[conversation.lastMessage.type] || 'Media';
    }
    return conversation.lastMessage.content;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <h1 className="text-2xl font-bold text-gray-900">{t('chat.messages')}</h1>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-gray-200">
              <CustomFormField
                id="search"
                name="search"
                type="text"
                value={searchQuery}
                placeholder={t('chat.searchConversations')}
                onChange={(name, value) => setSearchQuery(value as string)}
                onTextChange={(e) => setSearchQuery(e.target.value)}
                className="mb-0"
              />
            </div>

            {/* Conversations List */}
            <div className="divide-y divide-gray-200">
              {loading && (
                <div className="px-6 py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                  <p className="mt-2 text-gray-500">{t('common.loading')}</p>
                </div>
              )}

              {!loading && filteredConversations.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-gray-500 text-lg">
                    {searchQuery ? t('chat.noConversations') : t('chat.noConversations')}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchQuery
                      ? t('common.search')
                      : t('chat.startConversation')}
                  </p>
                </div>
              )}

              {!loading &&
                filteredConversations.map((conversation) => (
                  <Link
                    key={conversation._id}
                    href={`/chat/${conversation._id}`}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {conversation.otherParticipant.photo ? (
                          <img
                            src={conversation.otherParticipant.photo}
                            alt={conversation.otherParticipant.name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
                            <span className="text-rose-600 text-xl font-semibold">
                              {conversation.otherParticipant.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.otherParticipant.name}
                          </h3>
                          {conversation.lastMessageAt && (
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate">
                            {getLastMessagePreview(conversation)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-rose-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
