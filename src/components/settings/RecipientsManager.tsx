import React, { useState } from 'react';
import { ArrowLeft, Users, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { useBuyers } from '@/hooks/useBuyers';
import { useRecipients } from '@/hooks/useRecipients';
import { useGifts } from '@/hooks/useGifts';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { z } from 'zod';

const recipientNameSchema = z.string().trim().min(1, 'Name cannot be empty').max(100, 'Name must be less than 100 characters');

const RecipientsManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const { householdId } = useHousehold(session?.user?.id);
  const { buyers } = useBuyers(householdId);
  const { recipients, loading, bulkAddRecipients, deleteRecipient } = useRecipients(householdId);
  const { gifts } = useGifts(householdId);
  const [bulkNames, setBulkNames] = useState('');
  const [deletingRecipient, setDeletingRecipient] = useState<{ id: string; name: string } | null>(null);

  const handleBulkAdd = async () => {
    if (!bulkNames.trim()) return;

    const names = bulkNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) return;

    // Validate each name
    const validNames: string[] = [];
    const invalidNames: string[] = [];
    
    names.forEach(name => {
      const validation = recipientNameSchema.safeParse(name);
      if (validation.success) {
        validNames.push(validation.data);
      } else {
        invalidNames.push(name);
      }
    });

    if (invalidNames.length > 0) {
      toast({
        title: "Invalid names detected",
        description: `Some names are invalid: ${invalidNames.join(', ')}. Names must be 1-100 characters.`,
        variant: "destructive",
      });
      return;
    }

    // Filter out duplicates
    const existingNames = recipients.map(person => person.name.toLowerCase());
    const newNames = validNames.filter(name => !existingNames.includes(name.toLowerCase()));

    if (newNames.length === 0) {
      toast({
        title: "No new recipients",
        description: "All names already exist in your list!",
        variant: "destructive",
      });
      return;
    }

    try {
      await bulkAddRecipients(newNames);
      setBulkNames('');
      toast({
        title: "Recipients added",
        description: `Added ${newNames.length} new recipient${newNames.length !== 1 ? 's' : ''}: ${newNames.join(', ')}`,
      });
    } catch (error) {
      // Error toast is shown by the hook
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading recipients...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 min-h-[44px] touch-target focus-ring"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Button>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Manage Recipients</h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Add Multiple Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Multiple Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Enter recipient names (comma-separated)
                </label>
                <Textarea
                  placeholder="John Doe, Jane Smith, Bob Johnson, etc..."
                  value={bulkNames}
                  onChange={(e) => setBulkNames(e.target.value)}
                  className="resize-none"
                  rows={4}
                />
              </div>
              <Button
                onClick={handleBulkAdd}
                className="w-full min-h-[44px] touch-target focus-ring"
                disabled={!bulkNames.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Recipients
              </Button>
              <p className="text-xs text-muted-foreground">
                Names will be added as unassigned. You can assign them to buyers later.
              </p>
            </CardContent>
          </Card>

          {/* Current Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Current Recipients ({recipients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recipients.length > 0 ? (
                <div className="space-y-2">
                  {recipients.map((recipient) => {
                    const recipientGifts = gifts.filter(g => g.recipient_id === recipient.id);
                    return (
                      <div key={recipient.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{recipient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {recipientGifts.length} gift{recipientGifts.length !== 1 ? 's' : ''} •
                            {recipient.assigned_to ? ` Assigned to ${buyers.find(b => b.id === recipient.assigned_to)?.name || 'Unknown'}` : ' Unassigned'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingRecipient({ id: recipient.id, name: recipient.name })}
                          className="ml-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic p-6 text-center bg-muted/30 rounded-md">
                  No recipients added yet. Use "Add Multiple Recipients" above to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Single Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingRecipient} onOpenChange={(open) => !open && setDeletingRecipient(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deletingRecipient?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this recipient and all their gifts. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (deletingRecipient) {
                    try {
                      await deleteRecipient(deletingRecipient.id);
                      toast({
                        title: "Recipient deleted",
                        description: `${deletingRecipient.name} has been permanently deleted.`,
                      });
                      setDeletingRecipient(null);
                    } catch (error) {
                      // Error toast shown by hook
                    }
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default RecipientsManager;
