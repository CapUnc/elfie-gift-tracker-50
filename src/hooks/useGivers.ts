import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Giver {
  id: string;
  household_id: string;
  name: string;
  icon: string;
  display_order: number;
  created_at: string;
}

export const useGivers = (householdId: string | null) => {
  const [givers, setGivers] = useState<Giver[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
        .order('display_order', { ascending: true });

      if (error) throw error;
      setGivers(data || []);
    } catch (err) {
      console.error('Error fetching givers:', err);
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

  const addGiver = async (name: string, icon: string = '🎁') => {
    if (!householdId) return;

    try {
      const maxOrder = givers.length > 0 
        ? Math.max(...givers.map(g => g.display_order)) 
        : -1;

      const { data, error } = await supabase
        .from('givers')
        .insert([{
          household_id: householdId,
          name,
          icon,
          display_order: maxOrder + 1,
        }])
        .select()
        .single();

      if (error) throw error;
      toast({
        title: 'Giver added',
        description: `${icon} ${name} has been added`,
      });
      return data;
    } catch (err: any) {
      console.error('Error adding giver:', err);
      toast({
        title: 'Error adding giver',
        description: err.message || 'Failed to add giver',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateGiver = async (id: string, updates: Partial<Pick<Giver, 'name' | 'icon' | 'display_order'>>) => {
    try {
      const { error } = await supabase
        .from('givers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'Giver updated',
        description: 'Changes saved successfully',
      });
    } catch (err: any) {
      console.error('Error updating giver:', err);
      toast({
        title: 'Error updating giver',
        description: err.message || 'Failed to update giver',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteGiver = async (id: string) => {
    try {
      // Check if giver is used in any gifts
      const { data: giftGivers, error: checkError } = await supabase
        .from('gift_givers')
        .select('id')
        .eq('giver_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (giftGivers && giftGivers.length > 0) {
        toast({
          title: 'Cannot delete giver',
          description: 'This giver is assigned to one or more gifts',
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase.from('givers').delete().eq('id', id);
      if (error) throw error;
      
      toast({
        title: 'Giver deleted',
        description: 'Giver removed successfully',
      });
      return true;
    } catch (err: any) {
      console.error('Error deleting giver:', err);
      toast({
        title: 'Error deleting giver',
        description: err.message || 'Failed to delete giver',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const reorderGivers = async (reorderedGivers: Giver[]) => {
    const oldGivers = [...givers];
    setGivers(reorderedGivers);

    try {
      const updates = reorderedGivers.map((giver, index) => ({
        id: giver.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('givers')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (err) {
      console.error('Error reordering givers:', err);
      setGivers(oldGivers);
      toast({
        title: 'Error reordering givers',
        description: 'Failed to save new order',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    givers,
    loading,
    addGiver,
    updateGiver,
    deleteGiver,
    reorderGivers,
    refetch: fetchGivers,
  };
};
