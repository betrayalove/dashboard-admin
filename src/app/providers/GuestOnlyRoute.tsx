import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth-store';

export function GuestOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
