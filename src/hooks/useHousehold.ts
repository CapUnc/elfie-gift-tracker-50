import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useHousehold = (userId: string | undefined) => {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // The userId householdId was fetched for. When userId changes (e.g. auth
  // resolving on a cold load) there is one render before the effect below sets
  // loading=true; this keeps loading true in that render too, so callers never
  // see the previous (signed-out) result as if it were final.
  const [fetchedForUserId, setFetchedForUserId] = useState<string | undefined>();
  const { toast } = useToast();

  const fetchHousehold = async () => {
    if (!userId) {
      setHouseholdId(null);
      setLoading(false);
      setFetchedForUserId(userId);
      return;
    }

    try {
      // Check if user has a household_id in their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      setHouseholdId(profile?.household_id || null);
    } catch (err) {
      console.error('Error fetching household:', err);
      toast({
        title: 'Error loading household',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setFetchedForUserId(userId);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchHousehold();
  }, [userId]);

  const refetch = async () => {
    setLoading(true);
    await fetchHousehold();
  };

  return { householdId, loading: loading || fetchedForUserId !== userId, refetch };
};
