import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { api, ApiError, tokenStore } from './api';
import type { Profile } from './types';

type AuthContextValue = {
  /** null = 미로그인, undefined = 복원 중 */
  profile: Profile | null | undefined;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  // 저장된 토큰으로 세션 복원
  useEffect(() => {
    if (!tokenStore.get()) {
      setProfile(null);
      return;
    }
    api<Profile>('/auth/me')
      .then((me) => setProfile(me.role === 'ADMIN' ? me : null))
      .catch(() => {
        tokenStore.clear();
        setProfile(null);
      });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const pair = await api<{ accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: { email, password },
        anonymous: true,
      },
    );
    tokenStore.setPair(pair.accessToken, pair.refreshToken);
    const me = await api<Profile>('/auth/me');
    // 일반 사용자 계정 차단 — 대시보드는 ADMIN 전용
    if (me.role !== 'ADMIN') {
      tokenStore.clear();
      throw new ApiError(403, 'This account is not an admin');
    }
    setProfile(me);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ profile, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
