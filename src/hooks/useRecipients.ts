import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Recipient {
  id: string;
  name: string;
  notes: string;
  assigned_to: string | null;
  completed: boolean;
  manual_complete: boolean;
  household_id?: string;
  created_at?: string;
}

export const useRecipients = (householdId: string | null) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch recipients from Supabase
  const fetchRecipients = async () => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .eq('household_id', householdId)
        .order('name', { ascending: true });

      if (error) throw error;

      setRecipients(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching recipients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recipients');
      toast({
        title: 'Error loading recipients',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();

    // Set up real-time subscription
    if (householdId) {
      const channel = supabase
        .channel('recipients-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'recipients',
            filter: `household_id=eq.${householdId}`,
          },
          () => {
            fetchRecipients();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [householdId]);

  const addRecipient = async (name: string, assignedTo: string | null = null) => {
    if (!householdId) return;

    try {
      const { data, error } = await supabase
        .from('recipients')
        .insert([{
          household_id: householdId,
          name,
          notes: '',
          assigned_to: assignedTo,
          completed: false,
          manual_complete: false,
        }])
        .select()
        .single();

      if (error) throw error;

      setRecipients([...recipients, data]);
      return data;
    } catch (err) {
      console.error('Error adding recipient:', err);
      toast({
        title: 'Error adding recipient',
        description: err instanceof Error ? err.message : 'Failed to add recipient',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const bulkAddRecipients = async (names: string[]) => {
    if (!householdId || names.length === 0) return;

    try {
      const newRecipients = names.map(name => ({
        household_id: householdId,
        name,
        notes: '',
        assigned_to: null,
        completed: false,
        manual_complete: false,
      }));

      const { data, error } = await supabase
        .from('recipients')
        .insert(newRecipients)
        .select();

      if (error) throw error;

      setRecipients([...recipients, ...(data || [])]);
      return data;
    } catch (err) {
      console.error('Error bulk adding recipients:', err);
      toast({
        title: 'Error adding recipients',
        description: err instanceof Error ? err.message : 'Failed to add recipients',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateRecipient = async (
    id: string,
    updates: Partial<Omit<Recipient, 'id' | 'household_id' | 'created_at'>>
  ) => {
    try {
      const { error } = await supabase
        .from('recipients')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setRecipients(recipients.map(r => (r.id === id ? { ...r, ...updates } : r)));
    } catch (err) {
      console.error('Error updating recipient:', err);
      toast({
        title: 'Error updating recipient',
        description: err instanceof Error ? err.message : 'Failed to update recipient',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteRecipient = async (id: string) => {
    try {
      const { error } = await supabase.from('recipients').delete().eq('id', id);

      if (error) throw error;

      setRecipients(recipients.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting recipient:', err);
      toast({
        title: 'Error deleting recipient',
        description: err instanceof Error ? err.message : 'Failed to delete recipient',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const bulkDeleteRecipients = async (ids: string[]) => {
    try {
      const { error } = await supabase.from('recipients').delete().in('id', ids);

      if (error) throw error;

      setRecipients(recipients.filter(r => !ids.includes(r.id)));
    } catch (err) {
      console.error('Error bulk deleting recipients:', err);
      toast({
        title: 'Error deleting recipients',
        description: err instanceof Error ? err.message : 'Failed to delete recipients',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    recipients,
    loading,
    error,
    addRecipient,
    bulkAddRecipients,
    updateRecipient,
    deleteRecipient,
    bulkDeleteRecipients,
    refetch: fetchRecipients,
  };
};
