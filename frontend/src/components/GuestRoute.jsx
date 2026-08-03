import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Login/signup pages — redirect to dashboard if already signed in. */
export default function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-white/50">Loading…</div>
    );
  }
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}
