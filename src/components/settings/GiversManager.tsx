import { useState } from 'react';
import { useGivers } from '@/hooks/useGivers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit, GripVertical } from 'lucide-react';

interface GiversManagerProps {
  householdId: string | null;
}

const COMMON_EMOJIS = ['🎁', '👩', '👨', '🎅', '🙋', '👶', '👧', '👦', '🧑', '👴', '👵', '🎄', '⭐', '❤️', '🎉'];

const GiversManager = ({ householdId }: GiversManagerProps) => {
  const { givers, loading, addGiver, updateGiver, deleteGiver, reorderGivers } = useGivers(householdId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGiver, setEditingGiver] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [deletingGiverId, setDeletingGiverId] = useState<string | null>(null);
  const [newGiverName, setNewGiverName] = useState('');
  const [newGiverIcon, setNewGiverIcon] = useState('🎁');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddGiver = async () => {
    if (!newGiverName.trim()) return;
    
    try {
      await addGiver(newGiverName.trim(), newGiverIcon);
      setNewGiverName('');
      setNewGiverIcon('🎁');
      setIsAddDialogOpen(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleUpdateGiver = async () => {
    if (!editingGiver || !editingGiver.name.trim()) return;
    
    try {
      await updateGiver(editingGiver.id, {
        name: editingGiver.name.trim(),
        icon: editingGiver.icon,
      });
      setEditingGiver(null);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDeleteGiver = async () => {
    if (!deletingGiverId) return;
    
    try {
      const success = await deleteGiver(deletingGiverId);
      if (success) {
        setDeletingGiverId(null);
      }
    } catch (err) {
      setDeletingGiverId(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newGivers = [...givers];
    const draggedItem = newGivers[draggedIndex];
    newGivers.splice(draggedIndex, 1);
    newGivers.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    reorderGivers(newGivers);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newGivers = [...givers];
    [newGivers[index - 1], newGivers[index]] = [newGivers[index], newGivers[index - 1]];
    reorderGivers(newGivers);
  };

  const moveDown = (index: number) => {
    if (index === givers.length - 1) return;
    const newGivers = [...givers];
    [newGivers[index], newGivers[index + 1]] = [newGivers[index + 1], newGivers[index]];
    reorderGivers(newGivers);
  };

  if (loading) {
    return <div className="p-6">Loading givers...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gift Givers</CardTitle>
              <CardDescription>Manage people who can give gifts (Mom, Dad, Santa, etc.)</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Giver
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Giver</DialogTitle>
                  <DialogDescription>Add someone who can give gifts</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="giver-name">Name</Label>
                    <Input
                      id="giver-name"
                      value={newGiverName}
                      onChange={(e) => setNewGiverName(e.target.value)}
                      placeholder="e.g., Mom, Santa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewGiverIcon(emoji)}
                          className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                            newGiverIcon === emoji ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddGiver}>Add Giver</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {givers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No givers yet. Add your first giver to get started.</p>
          ) : (
            <div className="space-y-2">
              {givers.map((giver, index) => (
                <div
                  key={giver.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-move"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl">{giver.icon}</span>
                  <span className="flex-1 font-medium">{giver.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(() => {
                      const { data: giftGivers = [] } = useQuery({
                        queryKey: ['gift-givers-for-giver', giver.id, householdId],
                        queryFn: async () => {
                          if (!householdId) return [];
                          const { data } = await supabase
                            .from('gift_givers')
                            .select('id, gift_id')
                            .eq('giver_id', giver.id);
                          return data || [];
                        },
                        enabled: !!householdId,
                      });
                      return giftGivers.length;
                    })()} {(() => {
                      const { data: giftGivers = [] } = useQuery({
                        queryKey: ['gift-givers-for-giver', giver.id, householdId],
                        queryFn: async () => {
                          if (!householdId) return [];
                          const { data } = await supabase
                            .from('gift_givers')
                            .select('id')
                            .eq('giver_id', giver.id);
                          return data || [];
                        },
                        enabled: !!householdId,
                      });
                      return giftGivers.length === 1 ? 'gift' : 'gifts';
                    })()}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingGiver({ id: giver.id, name: giver.name, icon: giver.icon })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingGiverId(giver.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingGiver} onOpenChange={(open) => !open && setEditingGiver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Giver</DialogTitle>
            <DialogDescription>Update giver name and icon</DialogDescription>
          </DialogHeader>
          {editingGiver && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-giver-name">Name</Label>
                <Input
                  id="edit-giver-name"
                  value={editingGiver.name}
                  onChange={(e) => setEditingGiver({ ...editingGiver, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditingGiver({ ...editingGiver, icon: emoji })}
                      className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                        editingGiver.icon === emoji ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGiver(null)}>Cancel</Button>
            <Button onClick={handleUpdateGiver}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingGiverId} onOpenChange={(open) => !open && setDeletingGiverId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Giver?</AlertDialogTitle>
            <AlertDialogDescription>
              This giver will be removed. If they are assigned to any gifts, the deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGiver}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GiversManager;
