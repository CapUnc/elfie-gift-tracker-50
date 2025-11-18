import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecipientNote {
  id: string;
  recipient_id: string;
  household_id: string;
  content: string;
  link_url: string | null;
  link_label: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface AddNoteData {
  content: string;
  link_url?: string;
  link_label?: string;
  household_id: string;
}

interface UpdateNoteData {
  id: string;
  content: string;
  link_url?: string | null;
  link_label?: string | null;
}

export const useRecipientNotes = (recipientId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['recipient-notes', recipientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipient_notes')
        .select('*')
        .eq('recipient_id', recipientId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as RecipientNote[];
    },
    enabled: !!recipientId,
  });

  const addNote = useMutation({
    mutationFn: async (noteData: AddNoteData) => {
      const { data, error } = await supabase
        .from('recipient_notes')
        .insert({
          recipient_id: recipientId,
          content: noteData.content,
          link_url: noteData.link_url || null,
          link_label: noteData.link_label || null,
          household_id: noteData.household_id,
          display_order: notes.length,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipient-notes', recipientId] });
      queryClient.invalidateQueries({ queryKey: ['all-recipient-notes'] });
      toast({
        title: "Note added",
        description: "Your note has been saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add note.",
      });
      console.error('Add note error:', error);
    },
  });

  const updateNote = useMutation({
    mutationFn: async (noteData: UpdateNoteData) => {
      const { data, error } = await supabase
        .from('recipient_notes')
        .update({
          content: noteData.content,
          link_url: noteData.link_url,
          link_label: noteData.link_label,
        })
        .eq('id', noteData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipient-notes', recipientId] });
      queryClient.invalidateQueries({ queryKey: ['all-recipient-notes'] });
      toast({
        title: "Note updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update note.",
      });
      console.error('Update note error:', error);
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('recipient_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipient-notes', recipientId] });
      queryClient.invalidateQueries({ queryKey: ['all-recipient-notes'] });
      toast({
        title: "Note deleted",
        description: "The note has been removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete note.",
      });
      console.error('Delete note error:', error);
    },
  });

  return {
    notes,
    isLoading,
    addNote: addNote.mutate,
    updateNote: updateNote.mutate,
    deleteNote: deleteNote.mutate,
    isAddingNote: addNote.isPending,
    isUpdatingNote: updateNote.isPending,
    isDeletingNote: deleteNote.isPending,
    hasNotes: notes.length > 0,
  };
};
