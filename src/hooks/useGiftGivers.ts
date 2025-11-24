import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GiftGiver {
  id: string;
  gift_id: string;
  giver_id: string;
  created_at: string;
}

export interface GiverDetails {
  id: string;
  name: string;
  icon: string;
  is_virtual: boolean;
}

export const useGiftGivers = (householdId: string | null) => {
  const [giftGivers, setGiftGivers] = useState<GiftGiver[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGiftGivers = async () => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gift_givers')
        .select(`
          *,
          gifts!inner(household_id)
        `)
        .eq('gifts.household_id', householdId);

      if (error) throw error;
      setGiftGivers(data || []);
    } catch (err) {
      console.error('Error fetching gift givers:', err);
      toast({
        title: 'Error loading gift assignments',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftGivers();

    if (householdId) {
      const channel = supabase
        .channel('gift-givers-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gift_givers',
          },
          () => {
            fetchGiftGivers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [householdId]);

  const updateGiftGivers = async (giftId: string, giverIds: string[]) => {
    try {
      // Delete existing assignments
      await supabase
        .from('gift_givers')
        .delete()
        .eq('gift_id', giftId);

      // Insert new assignments
      if (giverIds.length > 0) {
        const { error } = await supabase
          .from('gift_givers')
          .insert(giverIds.map(giverId => ({
            gift_id: giftId,
            giver_id: giverId,
          })));

        if (error) throw error;
      }

      fetchGiftGivers();
    } catch (err) {
      console.error('Error setting gift givers:', err);
      toast({
        title: 'Error updating gift assignment',
        description: err instanceof Error ? err.message : 'Failed to update assignment',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const addGiftGiver = async (giftId: string, giverId: string) => {
    try {
      const { error } = await supabase
        .from('gift_givers')
        .insert([{ gift_id: giftId, giver_id: giverId }]);

      if (error) throw error;
      fetchGiftGivers();
    } catch (err) {
      console.error('Error adding gift giver:', err);
      toast({
        title: 'Error adding assignment',
        description: err instanceof Error ? err.message : 'Failed to add assignment',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const removeGiftGiver = async (giftId: string, giverId: string) => {
    try {
      const { error } = await supabase
        .from('gift_givers')
        .delete()
        .eq('gift_id', giftId)
        .eq('giver_id', giverId);

      if (error) throw error;
      fetchGiftGivers();
    } catch (err) {
      console.error('Error removing gift giver:', err);
      toast({
        title: 'Error removing assignment',
        description: err instanceof Error ? err.message : 'Failed to remove assignment',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    giftGivers,
    loading,
    updateGiftGivers,
    addGiftGiver,
    removeGiftGiver,
    refetch: fetchGiftGivers,
  };
};
