'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useApi, useMutation } from '@/hooks/useApi';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
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

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch notifications
  const endpoint = user?.id
    ? `/api/notifications/user/${user.id}?status=${filter === 'all' ? '' : filter}&page=${page}&limit=${limit}`
    : '';
  
  const { data, loading, error, execute: refetch } = useApi<NotificationResponse>(
    endpoint,
    { immediate: !!user?.id }
  );

  // Refetch when filter or page changes
  useEffect(() => {
    if (user?.id) {
      refetch();
    }
  }, [filter, page, user?.id, refetch]);

  // Setup WebSocket for real-time notifications
  useWebSocket({
    userId: user?.id || null,
    onNotification: (notification) => {
      // Refresh notifications when new one arrives
      refetch();
    },
  });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { api } = await import('@/lib/api');
      await api.patch(`/api/notifications/${notificationId}/read`, {});
      await refetch();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (user?.id) {
      try {
        const { api } = await import('@/lib/api');
        await api.patch(`/api/notifications/user/${user.id}/read-all`, {});
        await refetch();
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        const { api } = await import('@/lib/api');
        await api.delete(`/api/notifications/${notificationId}`);
        await refetch();
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (notification.status === 'unread') {
      handleMarkAsRead(notification._id);
    }

    // Navigate to link if available
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interest':
        return '💝';
      case 'payment':
        return '💳';
      case 'welcome':
        return '👋';
      case 'message':
        return '💬';
      case 'match':
        return '✨';
      case 'request':
        return '📩';
      case 'profile_view':
        return '👁️';
      case 'reminder':
        return '⏰';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  };


  console.log("notifications:::" ,data);
  
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'interest':
        return 'bg-rose-100 text-rose-700';
      case 'payment':
        return 'bg-green-100 text-green-700';
      case 'welcome':
        return 'bg-blue-100 text-blue-700';
      case 'message':
        return 'bg-purple-100 text-purple-700';
      case 'match':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
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

  const notifications = data || [];
  const unreadCount = data?.unreadCount || 0;
  const pagination = data?.pagination;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="border-b border-gray-200 px-6 py-3 flex gap-4">
              <button
                onClick={() => {
                  setFilter('all');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setFilter('unread');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
              <button
                onClick={() => {
                  setFilter('read');
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'read'
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Read
              </button>
            </div>

            {/* Notifications List */}
            <div className="divide-y divide-gray-200">
              {loading && (
                <div className="px-6 py-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                  <p className="mt-2 text-gray-500">Loading notifications...</p>
                </div>
              )}

              {error && (
                <div className="px-6 py-12 text-center">
                  <p className="text-red-600">Error loading notifications. Please try again.</p>
                  <button
                    onClick={() => refetch()}
                    className="mt-2 text-rose-600 hover:text-rose-700"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && notifications.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <div className="text-6xl mb-4">🔔</div>
                  <p className="text-gray-500 text-lg">No notifications yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {filter === 'unread'
                      ? "You're all caught up!"
                      : 'You will see notifications here when you receive them.'}
                  </p>
                </div>
              )}

              {!loading &&
                !error &&
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                      notification.status === 'unread' ? 'bg-rose-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3
                              className={`font-semibold ${
                                notification.status === 'unread'
                                  ? 'text-gray-900'
                                  : 'text-gray-700'
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {notification.message}
                            </p>
                            <p className="text-gray-400 text-xs mt-2">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                          {notification.status === 'unread' && (
                            <div className="w-2 h-2 bg-rose-600 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-2">
                        {notification.status === 'unread' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}
                            className="text-gray-400 hover:text-gray-600 text-sm"
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification._id);
                          }}
                          className="text-gray-400 hover:text-red-600 text-sm"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} notifications
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
