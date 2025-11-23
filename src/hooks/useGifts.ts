import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  url?: string | null;
  tracking?: string | null;
  assigned_to?: string | null;
  recipient_id: string;
  household_id?: string;
  created_at?: string;
  updated_at?: string;
  is_placeholder?: boolean;
  template_id?: string | null;
  givers?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

export const useGifts = (householdId: string | null) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch gifts from Supabase
  const fetchGifts = async () => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    try {
      const { data: giftsData, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch givers for all gifts
      const giftIds = giftsData?.map(g => g.id) || [];
      let giversMap: Record<string, Array<{ id: string; name: string; icon: string }>> = {};
      
      if (giftIds.length > 0) {
        const { data: giftGiversData } = await supabase
          .from('gift_givers')
          .select(`
            gift_id,
            giver:givers(id, name, icon)
          `)
          .in('gift_id', giftIds);

        if (giftGiversData) {
          giftGiversData.forEach((gg: any) => {
            if (!giversMap[gg.gift_id]) {
              giversMap[gg.gift_id] = [];
            }
            if (gg.giver) {
              giversMap[gg.gift_id].push(gg.giver);
            }
          });
        }
      }

      // Attach givers to gifts
      const giftsWithGivers = giftsData?.map(gift => ({
        ...gift,
        givers: giversMap[gift.id] || [],
      })) || [];

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

    // Set up real-time subscription
    if (householdId) {
      const channel = supabase
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

      return () => {
        supabase.removeChannel(channel);
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
      isPlaceholder?: boolean;
      templateId?: string;
      giverIds?: string[];
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
          is_placeholder: options?.isPlaceholder || false,
          template_id: options?.templateId || null,
        }])
        .select()
        .single();

      if (error) throw error;

      // Add givers if provided
      if (options?.giverIds && options.giverIds.length > 0) {
        const giftGiverInserts = options.giverIds.map(giverId => ({
          gift_id: data.id,
          giver_id: giverId,
        }));

        const { error: giversError } = await supabase
          .from('gift_givers')
          .insert(giftGiverInserts);

        if (giversError) {
          console.error('Error adding gift givers:', giversError);
        }
      }

      // Refetch to get full data with givers
      await fetchGifts();
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

  const updateGift = async (
    id: string, 
    updates: Partial<Omit<Gift, 'id' | 'household_id' | 'created_at' | 'updated_at' | 'givers'>>,
    giverIds?: string[]
  ) => {
    try {
      const { error } = await supabase
        .from('gifts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Update givers if provided
      if (giverIds !== undefined) {
        // Delete existing givers
        await supabase
          .from('gift_givers')
          .delete()
          .eq('gift_id', id);

        // Add new givers
        if (giverIds.length > 0) {
          const giftGiverInserts = giverIds.map(giverId => ({
            gift_id: id,
            giver_id: giverId,
          }));

          const { error: giversError } = await supabase
            .from('gift_givers')
            .insert(giftGiverInserts);

          if (giversError) {
            console.error('Error updating gift givers:', giversError);
          }
        }
      }

      // Refetch to get updated data with givers
      await fetchGifts();
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
