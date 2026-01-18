'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount: notificationCount } = useNotifications(user?.id || null);
  const { unreadCount: messageCount } = useUnreadMessages(user?.id || null);
  const { t } = useTranslation();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-rose-600">
              Matrimony
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-rose-600 transition-colors"
            >
              {t('navbar.home')}
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/profiles"
                  className="text-gray-700 hover:text-rose-600 transition-colors"
                >
                  {t('navbar.browseProfiles')}
                </Link>
                <Link
                  href="/chat"
                  className="relative text-gray-700 hover:text-rose-600 transition-colors"
                >
                  {t('navbar.messages')}
                  {messageCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {messageCount > 9 ? '9+' : messageCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/notifications"
                  className="relative text-gray-700 hover:text-rose-600 transition-colors"
                >
                  {t('navbar.notifications')}
                  {notificationCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            <Link
              href="/about"
              className="text-gray-700 hover:text-rose-600 transition-colors"
            >
              {t('navbar.about')}
            </Link>
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/notifications"
                  className="relative p-2 text-gray-700 hover:text-rose-600 transition-colors"
                  title="Notifications"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 bg-rose-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Link>
                {user?.photo && (
                  <img
                    src={user.photo}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <span className="text-gray-700">{user?.name}</span>
                <button
                  onClick={logout}
                  className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
                >
                  {t('common.logout')}
                </button>
              </div>
            ) : (
              <>
            <Link
              href="/login"
              className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
            >
              {t('common.login')}
            </Link>
            <Link
              href="/register"
              className="border border-rose-600 text-rose-600 px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors"
            >
              {t('common.register')}
            </Link>
              </>
            )}
          </div>
          <div className="md:hidden">
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="bg-rose-600 text-white px-3 py-2 rounded-lg text-sm"
              >
                {t('common.logout')}
              </button>
            ) : (
            <Link
              href="/login"
              className="bg-rose-600 text-white px-3 py-2 rounded-lg text-sm"
            >
              {t('common.login')}
            </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
