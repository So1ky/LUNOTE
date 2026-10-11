import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/layout';
import { AuthProvider, useAuth } from './lib/auth';
import { LoginPage } from './pages/login-page';
import { RequestDetailPage } from './pages/request-detail-page';
import { RequestsPage } from './pages/requests-page';

/** ADMIN 세션이 없으면 로그인으로 보낸다 (복원 중에는 빈 화면 유지) */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile === undefined) return null;
  if (profile === null) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAdmin>
                <Layout />
              </RequireAdmin>
            }>
            <Route path="/" element={<RequestsPage />} />
            <Route path="/requests/:id" element={<RequestDetailPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
