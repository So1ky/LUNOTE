import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/lib/auth-context';

export default function TabsLayout() {
  const { loading, token, profile } = useAuth();

  // 게스트는 탭 구경 가능. 로그인한 미인증 사용자만 인증 화면으로 잠금.
  if (!loading && token && profile && !profile.emailVerifiedAt) {
    return <Redirect href="/verify-email" />;
  }

  return <AppTabs />;
}
