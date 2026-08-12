'use client';

import { createContext, type ReactNode, useContext } from 'react';
import { useWifiSession } from '@/hooks/useWifiSession';
import type { SessionActions, SessionState } from '@/types';

interface SessionContextValue {
  state: SessionState;
  actions: SessionActions;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Provides the WiFi portal session state and actions to the component tree. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const value = useWifiSession();

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** Access the session state and actions. Must be used within a SessionProvider. */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}
