import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { householdId, loading: householdLoading } = useHousehold(user?.id);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Redirect to auth if not authenticated
    if (!user) {
      navigate('/auth');
      return;
    }

    // Wait for household to finish loading before making decisions
    if (householdLoading) return;

    // If user has a household but is on welcome/join pages, redirect to home
    if (
      householdId &&
      (location.pathname === '/welcome' || location.pathname === '/join-household')
    ) {
      navigate('/');
      return;
    }

    // If user has no household and is not on welcome/join pages, redirect to welcome
    if (
      !householdId &&
      location.pathname !== '/welcome' &&
      location.pathname !== '/join-household'
    ) {
      navigate('/welcome');
    }
  }, [user, authLoading, householdId, householdLoading, navigate, location.pathname]);

  if (authLoading || householdLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
