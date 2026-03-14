import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
