import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from '../components/Loading';

export function RequireAuth() {
  const { initializing, isAuthenticated } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function RequireAdmin() {
  const { initializing, isAdmin } = useAuth();
  if (initializing) return <FullPageLoader />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
