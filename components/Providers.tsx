'use client';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import '@/lib/i18n'; // Initialize i18n

function WebSocketWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <WebSocketProvider userId={user?.id || null}>{children}</WebSocketProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WebSocketWrapper>{children}</WebSocketWrapper>
    </AuthProvider>
  );
}
