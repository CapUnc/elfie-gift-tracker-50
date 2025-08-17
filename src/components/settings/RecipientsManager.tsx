import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { DeleteRecipientsDialog } from './DeleteRecipientsDialog';

interface Person {
  id: string;
  name: string;
  gifts: any[];
  notes: string;
  assignedTo: string | null;
}

const RecipientsManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [bulkNames, setBulkNames] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load recipients from localStorage
  useEffect(() => {
    const savedPeople = localStorage.getItem('christmas-gifts-2025');
    if (savedPeople) {
      setPeople(JSON.parse(savedPeople));
    }
  }, []);

  const handleBulkAdd = () => {
    if (!bulkNames.trim()) return;

    const names = bulkNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) return;

    // Filter out duplicates
    const existingNames = people.map(person => person.name.toLowerCase());
    const newNames = names.filter(name => !existingNames.includes(name.toLowerCase()));

    if (newNames.length === 0) {
      toast({
        title: "No new recipients",
        description: "All names already exist in your list!",
        variant: "destructive",
      });
      return;
    }

    // Create new recipients objects
    const newPeople = newNames.map((name, index) => ({
      id: (Date.now() + index).toString(),
      name: name,
      gifts: [],
      notes: '',
      assignedTo: null
    }));

    // Add to existing recipients and update state
    const updatedPeople = [...people, ...newPeople];
    setPeople(updatedPeople);
    localStorage.setItem('christmas-gifts-2025', JSON.stringify(updatedPeople));

    setBulkNames('');
    toast({
      title: "Recipients added",
      description: `Added ${newNames.length} new recipient${newNames.length !== 1 ? 's' : ''}: ${newNames.join(', ')}`,
    });
  };

  const handleDeletePeople = (peopleIds: string[]) => {
    const deletedCount = peopleIds.length;
    const updatedPeople = people.filter(person => !peopleIds.includes(person.id));
    setPeople(updatedPeople);
    localStorage.setItem('christmas-gifts-2025', JSON.stringify(updatedPeople));
    
    toast({
      title: "Recipients deleted",
      description: `${deletedCount} recipient${deletedCount !== 1 ? 's' : ''} ${deletedCount !== 1 ? 'have' : 'has'} been permanently deleted.`,
    });
  };

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
                  Current Recipients ({people.length})
                </div>
                {people.length > 0 && (
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
              {people.length > 0 ? (
                <div className="space-y-2">
                  {people.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{person.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {person.gifts.length} gift{person.gifts.length !== 1 ? 's' : ''} • 
                          {person.assignedTo ? ` Assigned to ${person.assignedTo}` : ' Unassigned'}
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
          people={people}
          onDeletePeople={handleDeletePeople}
        />
      </div>
    </div>
  );
};

export default RecipientsManager;