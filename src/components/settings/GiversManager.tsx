import { useState } from 'react';
import { useGivers } from '@/hooks/useGivers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Users, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GiverSection } from './GiverSection';
import { COMMON_GIVER_ICONS } from '@/types/givers';

interface GiversManagerProps {
  householdId: string | null;
}

const GiversManager = ({ householdId }: GiversManagerProps) => {
  const { profileLinkedGivers, virtualGivers, loading, addGiver, updateGiver, deleteGiver, confirmDeleteGiver, reorderGivers } = useGivers(householdId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGiver, setEditingGiver] = useState<{ id: string; name: string; icon: string; isVirtual: boolean } | null>(null);
  const [deletingGiverInfo, setDeletingGiverInfo] = useState<{ 
    id: string; 
    name: string;
    giftCount: number;
  } | null>(null);
  const [newGiverName, setNewGiverName] = useState('');
  const [newGiverIcon, setNewGiverIcon] = useState('🎁');

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

  const handleDeleteClick = async (giver: any) => {
    try {
      const result = await deleteGiver(giver.id);
      if (result && result.canDelete) {
        setDeletingGiverInfo({
          id: giver.id,
          name: giver.name,
          giftCount: result.giftCount,
        });
      }
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDeleteGiver = async () => {
    if (!deletingGiverInfo) return;
    
    try {
      const success = await confirmDeleteGiver(deletingGiverInfo.id);
      if (success) {
        setDeletingGiverInfo(null);
      }
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleStartEdit = (giver: any) => {
    setEditingGiver({
      id: giver.id,
      name: giver.name,
      icon: giver.icon || '🎁',
      isVirtual: giver.is_virtual,
    });
  };

  const moveUp = (index: number, isVirtual: boolean) => {
    const giverList = isVirtual ? virtualGivers : profileLinkedGivers;
    if (index === 0) return;

    const newList = [...giverList];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    reorderGivers(newList);
  };

  const moveDown = (index: number, isVirtual: boolean) => {
    const giverList = isVirtual ? virtualGivers : profileLinkedGivers;
    if (index === giverList.length - 1) return;

    const newList = [...giverList];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    reorderGivers(newList);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/3"></div>
          <div className="h-64 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gift Givers</CardTitle>
          <CardDescription>
            Manage who gives gifts in your household. Assign givers to gifts to track who's responsible for buying them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Household Members Section */}
          <GiverSection
            title="Household Members"
            description="Everyone in your household is automatically a gift giver. Names sync with their profile."
            icon={<Users className="h-5 w-5 text-primary" />}
            badge={<Badge variant="secondary">Auto-managed</Badge>}
            givers={profileLinkedGivers}
            emptyMessage="No household members yet"
            onMoveUp={(index) => moveUp(index, false)}
            onMoveDown={(index) => moveDown(index, false)}
            onEdit={handleStartEdit}
          />

          <Separator />

          {/* Additional Gift Givers Section */}
          <GiverSection
            title="Additional Gift Givers"
            description="Add extra gift givers like Santa, family pets, or anyone else who gives gifts."
            icon={<Sparkles className="h-5 w-5 text-primary" />}
            givers={virtualGivers}
            emptyMessage="No additional givers yet"
            headerAction={
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Giver
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Gift Giver</DialogTitle>
                    <DialogDescription>
                      Add someone who gives gifts but isn't part of your household account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="giver-name">Name</Label>
                      <Input
                        id="giver-name"
                        placeholder="e.g., Santa, Grandma, Family Dog"
                        value={newGiverName}
                        onChange={(e) => setNewGiverName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <div className="grid grid-cols-8 gap-2">
                        {COMMON_GIVER_ICONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => setNewGiverIcon(emoji)}
                            className={`text-2xl p-2 rounded-lg transition-all flex items-center justify-center ${
                              newGiverIcon === emoji
                                ? 'bg-primary/20 ring-2 ring-primary scale-110'
                                : 'bg-secondary hover:bg-secondary/80'
                            }`}
                            type="button"
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
            }
            onMoveUp={(index) => moveUp(index, true)}
            onMoveDown={(index) => moveDown(index, true)}
            onEdit={handleStartEdit}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingGiver} onOpenChange={(open) => !open && setEditingGiver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Giver</DialogTitle>
            <DialogDescription>
              {editingGiver?.isVirtual 
                ? 'Update giver name and icon' 
                : 'Update icon (name syncs with profile)'}
            </DialogDescription>
          </DialogHeader>
          {editingGiver && (
            <div className="space-y-4 py-4">
              {editingGiver.isVirtual && (
                <div className="space-y-2">
                  <Label htmlFor="edit-giver-name">Name</Label>
                  <Input
                    id="edit-giver-name"
                    value={editingGiver.name}
                    onChange={(e) => setEditingGiver({ ...editingGiver, name: e.target.value })}
                  />
                </div>
              )}
              {!editingGiver.isVirtual && (
                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                  Profile-linked names cannot be changed here. Update the display name in profile settings.
                </div>
              )}
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-8 gap-2">
                  {COMMON_GIVER_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setEditingGiver({ ...editingGiver, icon: emoji })}
                      className={`text-2xl p-2 rounded-lg transition-all flex items-center justify-center ${
                        editingGiver.icon === emoji
                          ? 'bg-primary/20 ring-2 ring-primary scale-110'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                      type="button"
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
      <AlertDialog open={!!deletingGiverInfo} onOpenChange={(open) => !open && setDeletingGiverInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingGiverInfo?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingGiverInfo?.giftCount === 0 ? (
                "This giver will be permanently removed."
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    This giver is assigned to {deletingGiverInfo?.giftCount} {deletingGiverInfo?.giftCount === 1 ? 'gift' : 'gifts'}.
                  </span>
                  <br />
                  They will be unassigned from all gifts and the giver will be deleted.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteGiver}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingGiverInfo?.giftCount === 0 ? 'Delete' : 'Unassign & Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GiversManager;
