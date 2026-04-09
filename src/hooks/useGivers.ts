import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Giver {
  id: string;
  name: string;
  icon: string;
  household_id?: string;
  profile_id?: string;
}

export const useGivers = (householdId: string | null) => {
  const [givers, setGivers] = useState<Giver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch givers from Supabase
  const fetchGivers = async () => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('givers')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setGivers(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching givers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load givers');
      toast({
        title: 'Error loading givers',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGivers();

    // Set up real-time subscription
    if (householdId) {
      const channel = supabase
        .channel('givers-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'givers',
            filter: `household_id=eq.${householdId}`,
          },
          () => {
            fetchGivers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [householdId]);

  // Internal use only - for onboarding/joining flows
  const addGiver = async (name: string, icon: string, profileId: string) => {
    if (!householdId) return;

    try {
      const { data, error } = await supabase
        .from('givers')
        .insert([{ household_id: householdId, name, icon, profile_id: profileId }])
        .select()
        .single();

      if (error) throw error;

      setGivers([...givers, data]);
      return data;
    } catch (err) {
      console.error('Error adding giver:', err);
      toast({
        title: 'Error adding giver',
        description: err instanceof Error ? err.message : 'Failed to add giver',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateOwnGiver = async (userId: string, updates: { name?: string; icon?: string }) => {
    const ownGiver = givers.find(g => g.profile_id === userId);
    if (!ownGiver) return;

    try {
      const { error } = await supabase
        .from('givers')
        .update(updates)
        .eq('id', ownGiver.id);

      if (error) throw error;

      setGivers(givers.map(g => (g.id === ownGiver.id ? { ...g, ...updates } : g)));
    } catch (err) {
      console.error('Error updating own giver:', err);
      toast({
        title: 'Error updating profile',
        description: err instanceof Error ? err.message : 'Failed to update profile',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const getOwnGiver = (userId: string) => {
    return givers.find(g => g.profile_id === userId);
  };

  const updateGiver = async (id: string, updates: { name?: string; icon?: string }) => {
    try {
      const { error } = await supabase
        .from('givers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setGivers(givers.map(g => (g.id === id ? { ...g, ...updates } : g)));
    } catch (err) {
      console.error('Error updating giver:', err);
      toast({
        title: 'Error updating giver',
        description: err instanceof Error ? err.message : 'Failed to update giver',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteGiver = async (id: string) => {
    try {
      const { error } = await supabase.from('givers').delete().eq('id', id);

      if (error) throw error;

      setGivers(givers.filter(g => g.id !== id));
    } catch (err) {
      console.error('Error deleting giver:', err);
      toast({
        title: 'Error deleting giver',
        description: err instanceof Error ? err.message : 'Failed to delete giver',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    givers,
    loading,
    error,
    addGiver,
    updateGiver,
    updateOwnGiver,
    getOwnGiver,
    deleteGiver,
    refetch: fetchGivers,
  };
};
