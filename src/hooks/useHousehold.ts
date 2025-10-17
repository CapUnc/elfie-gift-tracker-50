import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useHousehold = (userId: string | undefined) => {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHousehold = async () => {
    if (!userId) {
      setLoading(false);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHousehold();
  }, [userId, toast]);

  const refetch = async () => {
    setLoading(true);
    await fetchHousehold();
  };

  return { householdId, loading, refetch };
};
