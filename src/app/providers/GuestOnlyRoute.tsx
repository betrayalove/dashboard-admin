import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';

export function GuestOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const initializing = useAuthStore((s) => s.initializing);
  if (initializing) return <p role="status">Проверка сессии…</p>;
  const from = location.state?.from;
  if (user) return <Navigate to={from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/'} replace />;
  return <>{children}</>;
}
