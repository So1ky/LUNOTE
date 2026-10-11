import { api } from './api';

export type AppNotification = {
  id: string;
  type: 'REQUEST_CREATED' | 'QUOTE_SENT' | string;
  title: string;
  body: string;
  requestId: number | null;
  readAt: string | null;
  createdAt: string;
};

export function listNotifications(token: string) {
  return api<{ items: AppNotification[]; unreadCount: number }>(
    '/notifications',
    { token },
  );
}

export function markNotificationRead(token: string, id: string) {
  return api<{ ok: boolean }>(`/notifications/${id}/read`, {
    method: 'PATCH',
    token,
  });
}

export function markAllNotificationsRead(token: string) {
  return api<{ ok: boolean }>('/notifications/read-all', {
    method: 'PATCH',
    token,
  });
}
