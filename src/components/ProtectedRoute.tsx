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

    // Allow access to setup pages without requiring profile check
    // These pages will handle profile creation themselves
    if (location.pathname === '/welcome' || location.pathname === '/join-household') {
      if (householdId) {
        const { data: giver } = await supabase
          .from('givers')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (giver) {
          // Setup complete, redirect to main app
          navigate('/');
          return;
        }
      }
      // Let them stay on welcome/join to complete setup (even without profile)
      return;
    }

    // For all other routes, check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, household_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      // User authenticated but has no profile - send to welcome to create one
      if (profileError) console.error('Profile error:', profileError);
      navigate('/welcome');
      return;
    }

    // Ensure both household and buyer exist. Use the profile just fetched: the hook's
    // householdId can be stale right after setup or while a page is first loading.
    if (!profile.household_id) {
      navigate('/welcome');
      return;
    }

      // User has household, now check for giver
      const { data: giver } = await supabase
        .from('givers')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (!giver) {
        // Has household but no giver - send to welcome to fix
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
