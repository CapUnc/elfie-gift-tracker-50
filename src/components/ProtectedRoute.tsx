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
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    // If user is authenticated but has no household, redirect to welcome
    // Exception: if already on welcome or join-household page, don't redirect
    if (
      !authLoading &&
      !householdLoading &&
      user &&
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
