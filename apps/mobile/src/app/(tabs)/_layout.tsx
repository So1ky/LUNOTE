import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/lib/auth-context';

export default function TabsLayout() {
  const { loading, token, profile } = useAuth();

  if (!loading && !token) {
    return <Redirect href="/login" />;
  }
  // 이메일 인증 강제 잠금 — 딥링크 등으로 탭에 직접 진입하는 우회도 차단
  if (!loading && token && profile && !profile.emailVerifiedAt) {
    return <Redirect href="/verify-email" />;
  }

  return <AppTabs />;
}
