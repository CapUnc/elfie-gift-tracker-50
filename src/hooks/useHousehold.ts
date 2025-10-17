import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useHousehold = (userId: string | undefined) => {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const { toast } = useToast();

  const fetchHousehold = async () => {
    if (!userId) {
      setHouseholdId(null);
      setLoading(false);
      setInitialFetchDone(true);
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
      setInitialFetchDone(true);
    } catch (err) {
      console.error('Error fetching household:', err);
      toast({
        title: 'Error loading household',
        description: 'Please try again later',
        variant: 'destructive',
      });
      setInitialFetchDone(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setInitialFetchDone(false);
    fetchHousehold();
  }, [userId]);

  const refetch = async () => {
    setLoading(true);
    await fetchHousehold();
  };

  return { householdId, loading, refetch };
};
