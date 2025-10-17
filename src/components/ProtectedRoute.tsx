import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { supabase } from '@/integrations/supabase/client';
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
    const checkBuyerAndRedirect = async () => {
      // Wait for auth to finish loading
      if (authLoading) return;

      // Redirect to auth if not authenticated
      if (!user) {
        navigate('/auth');
        return;
      }

      // Wait for household to finish loading before making decisions
      if (householdLoading) return;

      // Check if profile exists for authenticated user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        // User authenticated but has no profile - send to welcome to create one
        console.error('Profile error:', profileError);
        navigate('/welcome');
        return;
      }

      // If on welcome/join pages, check if setup is complete
      if (location.pathname === '/welcome' || location.pathname === '/join-household') {
        if (householdId) {
          const { data: buyer } = await supabase
            .from('buyers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (buyer) {
            // Setup complete, redirect to main app
            navigate('/');
            return;
          }
        }
        // Let them stay on welcome/join to complete setup
        return;
      }

      // For ALL other routes, ensure both household and buyer exist
      if (!householdId) {
        navigate('/welcome');
        return;
      }

      // User has household, now check for buyer
      const { data: buyer } = await supabase
        .from('buyers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!buyer) {
        // Has household but no buyer - send to welcome to fix
        navigate('/welcome');
        return;
      }

      // All checks passed, allow access
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
