import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GiftTemplate {
  id: string;
  household_id: string;
  name: string;
  default_cost: number | null;
  default_giver_ids: string[];
  tag_color: string;
  tag_icon: string;
  display_order: number;
  created_at: string;
}

export const useGiftTemplates = (householdId: string | null) => {
  const [templates, setTemplates] = useState<GiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gift_templates')
        .select('*')
        .eq('household_id', householdId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      toast({
        title: 'Error loading templates',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();

    if (householdId) {
      const channel = supabase
        .channel('gift-templates-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gift_templates',
            filter: `household_id=eq.${householdId}`,
          },
          () => {
            fetchTemplates();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [householdId]);

  const addTemplate = async (template: Omit<GiftTemplate, 'id' | 'household_id' | 'created_at' | 'display_order'>) => {
    if (!householdId) return;

    try {
      const maxOrder = templates.length > 0 
        ? Math.max(...templates.map(t => t.display_order)) 
        : -1;

      const { data, error } = await supabase
        .from('gift_templates')
        .insert([{
          household_id: householdId,
          ...template,
          display_order: maxOrder + 1,
        }])
        .select()
        .single();

      if (error) throw error;
      toast({
        title: 'Template added',
        description: `${template.tag_icon} ${template.name} template created`,
      });
      return data;
    } catch (err: any) {
      console.error('Error adding template:', err);
      toast({
        title: 'Error adding template',
        description: err.message || 'Failed to add template',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<Omit<GiftTemplate, 'id' | 'household_id' | 'created_at'>>) => {
    try {
      const { error } = await supabase
        .from('gift_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'Template updated',
        description: 'Changes saved successfully',
      });
    } catch (err: any) {
      console.error('Error updating template:', err);
      toast({
        title: 'Error updating template',
        description: err.message || 'Failed to update template',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from('gift_templates').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: 'Template deleted',
        description: 'Template removed successfully',
      });
    } catch (err: any) {
      console.error('Error deleting template:', err);
      toast({
        title: 'Error deleting template',
        description: err.message || 'Failed to delete template',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
};
