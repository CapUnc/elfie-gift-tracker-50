import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useHouseholdContext } from '@/contexts/HouseholdContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuthContext();
  const { householdId, loading: householdLoading } = useHouseholdContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkBuyerAndRedirect = async () => {
      if (authLoading) return;

      if (!user) {
        navigate('/auth');
        return;
      }

      if (householdLoading) return;

      if (location.pathname === '/welcome' || location.pathname === '/join-household') {
        if (householdId) {
          const { data: giver } = await supabase
            .from('givers')
            .select('id')
            .eq('profile_id', user.id)
            .maybeSingle();

          if (giver) {
            navigate('/');
            return;
          }
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('Profile error:', profileError);
        navigate('/welcome');
        return;
      }

      if (!householdId) {
        navigate('/welcome');
        return;
      }

      const { data: giver } = await supabase
        .from('givers')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (!giver) {
        navigate('/welcome');
        return;
      }
    };

    checkBuyerAndRedirect();
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
