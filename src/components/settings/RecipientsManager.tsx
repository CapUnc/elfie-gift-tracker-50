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
import { DeleteRecipientsDialog } from './DeleteRecipientsDialog';

const RecipientsManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const { householdId } = useHousehold(session?.user?.id);
  const { buyers } = useBuyers(householdId);
  const { recipients, loading, bulkAddRecipients, bulkDeleteRecipients } = useRecipients(householdId);
  const { gifts } = useGifts(householdId);
  const [bulkNames, setBulkNames] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleBulkAdd = async () => {
    if (!bulkNames.trim()) return;

    const names = bulkNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) return;

    // Filter out duplicates
    const existingNames = recipients.map(person => person.name.toLowerCase());
    const newNames = names.filter(name => !existingNames.includes(name.toLowerCase()));

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

  // Convert recipients data to match the Person interface expected by DeleteRecipientsDialog
  const peopleData = recipients.map(recipient => ({
    id: recipient.id,
    name: recipient.name,
    gifts: gifts.filter(g => g.recipient_id === recipient.id),
    notes: recipient.notes,
    assignedTo: recipient.assigned_to,
  }));

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
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Current Recipients ({recipients.length})
                </div>
                {recipients.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="min-h-[44px] touch-target focus-ring"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recipients.length > 0 ? (
                <div className="space-y-2">
                  {peopleData.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{person.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {person.gifts.length} gift{person.gifts.length !== 1 ? 's' : ''} •
                          {person.assignedTo ? ` Assigned to ${buyers.find(b => b.id === person.assignedTo)?.name || 'Unknown'}` : ' Unassigned'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic p-6 text-center bg-muted/30 rounded-md">
                  No recipients added yet. Use "Add Multiple Recipients" above to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delete Recipients Dialog */}
        <DeleteRecipientsDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          people={peopleData}
          onDeletePeople={async (peopleIds: string[]) => {
            try {
              await bulkDeleteRecipients(peopleIds);
              toast({
                title: "Recipients deleted",
                description: `${peopleIds.length} recipient${peopleIds.length !== 1 ? 's' : ''} ${peopleIds.length !== 1 ? 'have' : 'has'} been permanently deleted.`,
              });
            } catch (error) {
              // Error toast shown by hook
            }
          }}
        />
      </div>
    </div>
  );
};

export default RecipientsManager;
