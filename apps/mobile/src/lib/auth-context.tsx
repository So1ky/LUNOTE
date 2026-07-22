
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from './api';
import { tokenStorage } from './token-storage';

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  emailVerifiedAt: string | null;
};

type AuthState = {
  /** SecureStore에서 토큰 복원이 끝나기 전에는 true */
  loading: boolean;
  token: string | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** 인증 상태 변경(이메일 인증 등) 후 프로필 갱신 */
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // 앱 시작 시 저장된 토큰 복원 → 유효성 확인
  useEffect(() => {
    void (async () => {
      try {
        const stored = await tokenStorage.get();
        if (stored) {
          const me = await api<Profile>('/auth/me', { token: stored });
          setToken(stored);
          setProfile(me);
        }
      } catch {
        await tokenStorage.delete(); // 만료/무효 토큰 폐기
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applyToken = useCallback(async (accessToken: string) => {
    await tokenStorage.set(accessToken);
    const me = await api<Profile>('/auth/me', { token: accessToken });
    setToken(accessToken);
    setProfile(me);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { accessToken } = await api<{ accessToken: string }>(
        '/auth/login',
        { method: 'POST', body: { email, password } },
      );
      await applyToken(accessToken);
    },
    [applyToken],
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      const { accessToken } = await api<{ accessToken: string }>(
        '/auth/signup',
        { method: 'POST', body: { email, password, name } },
      );
      await applyToken(accessToken);
    },
    [applyToken],
  );

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    setProfile(await api<Profile>('/auth/me', { token }));
  }, [token]);

  const signOut = useCallback(async () => {
    await tokenStorage.delete();
    setToken(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ loading, token, profile, signIn, signUp, signOut, refreshProfile }),
    [loading, token, profile, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
