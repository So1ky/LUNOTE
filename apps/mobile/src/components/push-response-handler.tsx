import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/lib/auth-context';

/** 알림 탭(백그라운드·콜드 스타트) → 해당 문의 상세. 렌더 없음 */
export function PushResponseHandler() {
  const router = useRouter();
  const { token, loading } = useAuth();
  // 이미 이동한 알림 — getLastNotificationResponseAsync는 세션 내내 같은 응답을 돌려주므로 토큰 갱신마다 재이동을 막는다
  const handledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (loading) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const requestId = response?.notification.request.content.data?.requestId;
      if (typeof requestId !== 'number') return;
      // 로그인 전이면 홈으로 두고 끝 — 로그인 후 재진입은 단순화를 위해 처리하지 않는다 (스펙 §4-3)
      if (!token) return;
      const id = response?.notification.request.identifier;
      if (id) {
        if (handledRef.current.has(id)) return;
        handledRef.current.add(id);
      }
      router.push(`/request/${requestId}`);
    };
    void Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
    // 로그인 상태가 바뀔 때 한 번만 다시 구독
  }, [loading, token, router]);

  return null;
}
