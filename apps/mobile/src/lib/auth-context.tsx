
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, setAuthEventHandlers } from './api';
import { getAppleCredential, getGoogleIdToken } from './social-auth';
import { tokenStorage } from './token-storage';

type TokenPair = { accessToken: string; refreshToken: string };

export type Profile = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  emailVerifiedAt: string | null;
  language: string | null;
  avatarUrl: string | null;
  provider: 'EMAIL' | 'GOOGLE' | 'APPLE';
};

/** 표시 이름 — 실명이 없으면 이메일 앞부분 */
export const displayName = (profile: Profile | null) =>
  [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
  profile?.email.split('@')[0] ||
  'Guest';

type AuthState = {
  /** SecureStore에서 토큰 복원이 끝나기 전에는 true */
  loading: boolean;
  token: string | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) => Promise<void>;
  /** 소셜 로그인/가입 — 사용자가 취소하면 false */
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  signOut: () => Promise<void>;
  /** 계정 삭제 — 성공하면 로컬 세션도 정리 (서버가 리프레시 토큰까지 지운다) */
  deleteAccount: (proof: DeleteProof) => Promise<void>;
  /** 인증 상태 변경(이메일 인증 등) 후 프로필 갱신 */
  refreshProfile: () => Promise<void>;
  /** 프로필 수정 (이름/언어/아바타/알림 설정) — 서버 응답으로 상태 갱신 */
  updateProfile: (patch: UpdateProfilePatch) => Promise<void>;
};

/** 탈퇴 재인증 — 계정 provider에 맞는 증명 하나 */
export type DeleteProof =
  | { password: string }
  | { idToken: string }
  | { identityToken: string; authorizationCode: string };

export type UpdateProfilePatch = {
  firstName?: string;
  lastName?: string;
  language?: string;
  avatarS3Key?: string;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // 액세스 만료 시 api()가 자동 갱신한다 — 새 토큰을 상태에 반영하고,
  // 갱신 불가(세션 폐기/만료)면 로컬 세션을 정리해 로그인 화면으로 보낸다
  useEffect(() => {
    setAuthEventHandlers({
      onTokensRefreshed: (accessToken) => setToken(accessToken),
      onSessionExpired: () => {
        void tokenStorage.clear();
        setToken(null);
        setProfile(null);
      },
    });
  }, []);

  // 앱 시작 시 저장된 토큰 복원 → 유효성 확인 (만료면 api()가 자동 갱신 시도)
  useEffect(() => {
    void (async () => {
      try {
        const stored = await tokenStorage.get();
        if (stored) {
          const me = await api<Profile>('/auth/me', { token: stored });
          // 자동 갱신이 일어났으면 onTokensRefreshed가 최신 토큰을 이미 반영했다
          setToken((current) => current ?? stored);
          setProfile(me);
        }
      } catch {
        await tokenStorage.clear(); // 만료/무효 토큰 폐기
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applyTokens = useCallback(async (pair: TokenPair) => {
    await tokenStorage.setPair(pair.accessToken, pair.refreshToken);
    const me = await api<Profile>('/auth/me', { token: pair.accessToken });
    setToken(pair.accessToken);
    setProfile(me);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const pair = await api<TokenPair>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      await applyTokens(pair);
    },
    [applyTokens],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string,
    ) => {
      const pair = await api<TokenPair>('/auth/signup', {
        method: 'POST',
        body: { email, password, firstName, lastName },
      });
      await applyTokens(pair);
    },
    [applyTokens],
  );

  const signInWithGoogle = useCallback(async () => {
    const idToken = await getGoogleIdToken();
    if (!idToken) return false;
    const pair = await api<TokenPair>('/auth/google', {
      method: 'POST',
      body: { idToken },
    });
    await applyTokens(pair);
    return true;
  }, [applyTokens]);

  const signInWithApple = useCallback(async () => {
    const credential = await getAppleCredential();
    if (!credential) return false;
    // authorizationCode는 로그인에 쓰지 않는다 — 탈퇴 재인증 때만 서버로 보낸다
    const pair = await api<TokenPair>('/auth/apple', {
      method: 'POST',
      body: {
        identityToken: credential.identityToken,
        firstName: credential.firstName,
        lastName: credential.lastName,
      },
    });
    await applyTokens(pair);
    return true;
  }, [applyTokens]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    setProfile(await api<Profile>('/auth/me', { token }));
  }, [token]);

  const updateProfile = useCallback(
    async (patch: UpdateProfilePatch) => {
      if (!token) return;
      setProfile(
        await api<Profile>('/users/me', { method: 'PATCH', body: patch, token }),
      );
    },
    [token],
  );

  const signOut = useCallback(async () => {
    // 서버의 리프레시 세션 폐기 — 실패해도 로컬 로그아웃은 진행 (fire-and-forget)
    const refreshToken = await tokenStorage.getRefresh();
    if (refreshToken) {
      void api('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      }).catch(() => {});
    }
    await tokenStorage.clear();
    setToken(null);
    setProfile(null);
  }, []);

  const deleteAccount = useCallback(
    async (proof: DeleteProof) => {
      await api<{ deleted: true }>('/users/me', {
        method: 'DELETE',
        body: proof,
        token,
      });
      // 서버 세션은 이미 없다 — /auth/logout 없이 로컬만 정리
      await tokenStorage.clear();
      setToken(null);
      setProfile(null);
    },
    [token],
  );

  const value = useMemo(
    () => ({
      loading,
      token,
      profile,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signOut,
      deleteAccount,
      refreshProfile,
      updateProfile,
    }),
    [loading, token, profile, signIn, signUp, signInWithGoogle, signInWithApple, signOut, deleteAccount, refreshProfile, updateProfile],
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
