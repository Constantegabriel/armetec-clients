import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { LoginPage } from '@/auth/LoginPage';
import { isCloud } from '@/lib/supabase';
import { EditorPage } from '@/pages/EditorPage';
import { ProjectsPage } from '@/pages/ProjectsPage';

function Routed() {
  const { loading, session } = useAuth();
  if (loading) return <div className="center-screen muted">Carregando…</div>;
  if (isCloud && !session) return <LoginPage />;

  return (
    <Routes>
      <Route path="/" element={<ProjectsPage />} />
      <Route path="/p/:id" element={<EditorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routed />
      </BrowserRouter>
    </AuthProvider>
  );
}
