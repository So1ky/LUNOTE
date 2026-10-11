import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '../lib/auth';

/** 공통 셸 — 상단 바(브랜드 + 계정/로그아웃) + 콘텐츠 영역 */
export function Layout() {
  const { profile, signOut } = useAuth();

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 28px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>
          LUNOTE <span style={{ color: 'var(--purple)' }}>Admin</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            {profile?.email}
          </span>
          <button className="ghost" onClick={signOut} style={{ padding: '6px 14px' }}>
            Log out
          </button>
        </div>
      </header>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px' }}>
        <Outlet />
      </main>
    </div>
  );
}
