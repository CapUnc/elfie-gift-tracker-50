import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Buyer {
  id: string;
  name: string;
  emoji: string;
  household_id?: string;
}

export const useBuyers = (householdId: string | null) => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch buyers from Supabase
  const fetchBuyers = async () => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setBuyers(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching buyers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load buyers');
      toast({
        title: 'Error loading buyers',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();

    // Set up real-time subscription
    if (householdId) {
      const channel = supabase
        .channel('buyers-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'buyers',
            filter: `household_id=eq.${householdId}`,
          },
          () => {
            fetchBuyers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [householdId]);

  const addBuyer = async (name: string, emoji: string) => {
    if (!householdId) return;

    try {
      const { data, error } = await supabase
        .from('buyers')
        .insert([{ household_id: householdId, name, emoji }])
        .select()
        .single();

      if (error) throw error;

      setBuyers([...buyers, data]);
      return data;
    } catch (err) {
      console.error('Error adding buyer:', err);
      toast({
        title: 'Error adding buyer',
        description: err instanceof Error ? err.message : 'Failed to add buyer',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateBuyer = async (id: string, updates: { name?: string; emoji?: string }) => {
    try {
      const { error } = await supabase
        .from('buyers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setBuyers(buyers.map(b => (b.id === id ? { ...b, ...updates } : b)));
    } catch (err) {
      console.error('Error updating buyer:', err);
      toast({
        title: 'Error updating buyer',
        description: err instanceof Error ? err.message : 'Failed to update buyer',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteBuyer = async (id: string) => {
    try {
      const { error } = await supabase.from('buyers').delete().eq('id', id);

      if (error) throw error;

      setBuyers(buyers.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error deleting buyer:', err);
      toast({
        title: 'Error deleting buyer',
        description: err instanceof Error ? err.message : 'Failed to delete buyer',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    buyers,
    loading,
    error,
    addBuyer,
    updateBuyer,
    deleteBuyer,
    refetch: fetchBuyers,
  };
};
