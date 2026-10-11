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
      // 서버는 숫자로 보내지만 OS·SDK를 거치며 문자열이 될 수 있다 — 정수만 받는다
      const requestId = Number(response?.notification.request.content.data?.requestId);
      if (!Number.isInteger(requestId) || requestId <= 0) return;
      // 로그인 전이면 아직 이동하지 않는다 — 로그인하면 token이 바뀌어 다시 돌고,
      // getLastNotificationResponseAsync가 같은 응답을 돌려주므로 그때 한 번 이동한다
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
