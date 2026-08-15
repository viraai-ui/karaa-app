import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import { apiBaseUrl } from './api';
import type { Role, Session } from './session';

export type RealtimeEventName = 'message.created' | 'notification.created' | 'progress_update.created' | 'project.progress_changed';

export type RealtimeSession = Pick<Session, 'token'> & { user: Pick<Session['user'], 'role'> };

export type RealtimeSubscriber = (options: {
  token: string;
  role: Role;
  projectIds: readonly string[];
  onEvent: () => void;
}) => () => void;

const notificationEventNames: readonly RealtimeEventName[] = [
  'message.created',
  'notification.created',
  'progress_update.created',
  'project.progress_changed',
];

/**
 * Opens one authenticated Socket.IO notification channel. Event payloads are deliberately
 * discarded: each consumer re-reads its authorized REST resource before changing UI state.
 */
export const subscribeToRealtime: RealtimeSubscriber = ({ token, role, projectIds, onEvent }) => {
  const socket = io(apiBaseUrl, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    if (role !== 'customer' && role !== 'management') return;
    for (const projectId of new Set(projectIds)) {
      socket.emit('project.subscribe', { projectId });
    }
  });

  for (const eventName of notificationEventNames) {
    socket.on(eventName, () => onEvent());
  }

  return () => socket.close();
};

export function useRealtimeRefresh({
  enabled = true,
  loadSession,
  onEvent,
  projectIds,
  subscribe = subscribeToRealtime,
}: {
  enabled?: boolean;
  loadSession: () => Promise<RealtimeSession | undefined>;
  onEvent: () => void;
  projectIds: readonly string[];
  subscribe?: RealtimeSubscriber;
}): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const projectKey = projectIds.join(',');

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let unsubscribe: () => void = () => undefined;

    void loadSession().then((session) => {
      if (!active || !session) return;
      unsubscribe = subscribe({
        token: session.token,
        role: session.user.role,
        projectIds,
        onEvent: () => {
          if (active) onEventRef.current();
        },
      });
    }).catch(() => undefined);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled, loadSession, projectKey, subscribe]);
}
