import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Giver {
  id: string;
  name: string;
  icon: string;
  is_virtual?: boolean;
}

export interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  url?: string | null;
  tracking?: string | null;
  assigned_to?: string | null;
  is_placeholder?: boolean;
  recipient_id: string;
  household_id?: string;
  created_at?: string;
  updated_at?: string;
  givers?: Giver[];
}

export const useGifts = (householdId: string | null) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch gifts from Supabase with givers
  const fetchGifts = async () => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          *,
          gift_givers (
            giver_id,
            givers (
              id,
              name,
              icon,
              is_virtual
            )
          )
        `)
        .eq('household_id', householdId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform data to include givers array
      const giftsWithGivers = (data || []).map(gift => ({
        ...gift,
        givers: gift.gift_givers?.map((gg: { givers: unknown }) => gg.givers).filter(Boolean) || []
      }));

      setGifts(giftsWithGivers);
      setError(null);
    } catch (err) {
      console.error('Error fetching gifts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load gifts');
      toast({
        title: 'Error loading gifts',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifts();

    // Set up real-time subscriptions for both gifts AND gift_givers
    if (householdId) {
      const giftsChannel = supabase
        .channel('gifts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gifts',
            filter: `household_id=eq.${householdId}`,
          },
          () => {
            fetchGifts();
          }
        )
        .subscribe();

      // Also watch gift_givers for when givers are assigned/removed
      const giftGiversChannel = supabase
        .channel('gift-givers-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gift_givers',
          },
          () => {
            fetchGifts();
          }
        )
        .subscribe();

      return () => {
        // Not supabase.removeChannel(): removing the last channel closes the socket, and
        // channels the next page subscribes while it is closing never join (realtime-js 2.75).
        giftsChannel.unsubscribe();
        giftGiversChannel.unsubscribe();
      };
    }
  }, [householdId]);

  const addGift = async (
    recipientId: string,
    name: string,
    cost: number | null = null,
    options?: {
      url?: string;
      tracking?: string;
      assignedTo?: string;
      is_placeholder?: boolean;
    }
  ) => {
    if (!householdId) return;

    try {
      const { data, error } = await supabase
        .from('gifts')
        .insert([{
          household_id: householdId,
          recipient_id: recipientId,
          name,
          cost,
          purchased: false,
          wrapped: false,
          url: options?.url || null,
          tracking: options?.tracking || null,
          assigned_to: options?.assignedTo || null,
          is_placeholder: options?.is_placeholder || false,
        }])
        .select()
        .single();

      if (error) throw error;

      setGifts([...gifts, data]);
      return data;
    } catch (err) {
      console.error('Error adding gift:', err);
      toast({
        title: 'Error adding gift',
        description: err instanceof Error ? err.message : 'Failed to add gift',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateGift = async (id: string, updates: Partial<Omit<Gift, 'id' | 'household_id' | 'created_at' | 'updated_at'>>) => {
    try {
      // `givers` is a derived relation, not a column on the gifts table
      const { givers: _givers, ...columnUpdates } = updates;

      const { error } = await supabase
        .from('gifts')
        .update(columnUpdates)
        .eq('id', id);

      if (error) throw error;

      setGifts(gifts.map(g => (g.id === id ? { ...g, ...updates } : g)));
    } catch (err) {
      console.error('Error updating gift:', err);
      toast({
        title: 'Error updating gift',
        description: err instanceof Error ? err.message : 'Failed to update gift',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateGiftStatus = async (id: string, field: 'purchased' | 'wrapped', value: boolean) => {
    return updateGift(id, { [field]: value });
  };

  const deleteGift = async (id: string) => {
    try {
      const { error } = await supabase.from('gifts').delete().eq('id', id);

      if (error) throw error;

      setGifts(gifts.filter(g => g.id !== id));
    } catch (err) {
      console.error('Error deleting gift:', err);
      toast({
        title: 'Error deleting gift',
        description: err instanceof Error ? err.message : 'Failed to delete gift',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const duplicateGift = async (id: string) => {
    const gift = gifts.find(g => g.id === id);
    if (!gift || !householdId) return;

    try {
      const { data, error } = await supabase
        .from('gifts')
        .insert([{
          household_id: householdId,
          recipient_id: gift.recipient_id,
          name: `${gift.name} (Copy)`,
          cost: gift.cost,
          purchased: false,
          wrapped: false,
          url: gift.url,
          tracking: gift.tracking,
          assigned_to: gift.assigned_to,
        }])
        .select()
        .single();

      if (error) throw error;

      setGifts([...gifts, data]);
      return data;
    } catch (err) {
      console.error('Error duplicating gift:', err);
      toast({
        title: 'Error duplicating gift',
        description: err instanceof Error ? err.message : 'Failed to duplicate gift',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const batchUpdateGifts = async (recipientId: string, updates: Partial<Pick<Gift, 'purchased' | 'wrapped'>>) => {
    try {
      const { error } = await supabase
        .from('gifts')
        .update(updates)
        .eq('recipient_id', recipientId);

      if (error) throw error;

      setGifts(
        gifts.map(g => (g.recipient_id === recipientId ? { ...g, ...updates } : g))
      );
    } catch (err) {
      console.error('Error batch updating gifts:', err);
      toast({
        title: 'Error updating gifts',
        description: err instanceof Error ? err.message : 'Failed to update gifts',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    gifts,
    loading,
    error,
    addGift,
    updateGift,
    updateGiftStatus,
    deleteGift,
    duplicateGift,
    batchUpdateGifts,
    refetch: fetchGifts,
  };
};
