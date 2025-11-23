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
import { Plus, Trash2, Edit, Users, Sparkles, Lock, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GiversManagerProps {
  householdId: string | null;
}

const COMMON_EMOJIS = ['🎁', '👩', '👨', '🎅', '🙋', '👶', '👧', '👦', '🧑', '👴', '👵', '🎄', '⭐', '❤️', '🎉'];

// Component to show gift count
const GiftCount = ({ giverId }: { giverId: string }) => {
  const { data: giftGivers = [] } = useQuery({
    queryKey: ['gift-givers-for-giver', giverId],
    queryFn: async () => {
      const { data } = await supabase
        .from('gift_givers')
        .select('id')
        .eq('giver_id', giverId);
      return data || [];
    },
  });
  
  return (
    <span className="text-xs text-muted-foreground">
      {giftGivers.length} {giftGivers.length === 1 ? 'gift' : 'gifts'}
    </span>
  );
};

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
      setDeletingGiverInfo(null);
    }
  };

  const handleStartEdit = (giver: any) => {
    setEditingGiver({
      id: giver.id,
      name: giver.name,
      icon: giver.icon,
      isVirtual: giver.is_virtual,
    });
  };

  const moveUp = (index: number, isVirtual: boolean) => {
    if (index === 0) return;
    const list = isVirtual ? virtualGivers : profileLinkedGivers;
    const newList = [...list];
    [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
    const allGivers = isVirtual 
      ? [...profileLinkedGivers, ...newList]
      : [...newList, ...virtualGivers];
    reorderGivers(allGivers);
  };

  const moveDown = (index: number, isVirtual: boolean) => {
    const list = isVirtual ? virtualGivers : profileLinkedGivers;
    if (index === list.length - 1) return;
    const newList = [...list];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    const allGivers = isVirtual 
      ? [...profileLinkedGivers, ...newList]
      : [...newList, ...virtualGivers];
    reorderGivers(allGivers);
  };

  if (loading) {
    return <div className="p-6">Loading givers...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Gift Givers</CardTitle>
          <CardDescription>Household members automatically become gift givers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Household Members Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Household Members</h3>
              <Badge variant="secondary" className="ml-2">Auto-managed</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Everyone in your household is automatically a gift giver. Names sync with their profile.
            </p>

            {profileLinkedGivers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No household members yet
              </div>
            ) : (
              <div className="space-y-2">
                {profileLinkedGivers.map((giver, index) => (
                  <div
                    key={giver.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveUp(index, false)}
                          disabled={index === 0}
                          className="h-4 w-6 p-0"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveDown(index, false)}
                          disabled={index === profileLinkedGivers.length - 1}
                          className="h-4 w-6 p-0"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-2xl">{giver.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{giver.name}</p>
                        <GiftCount giverId={giver.id} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(giver)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled
                              >
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Linked to profile - cannot be deleted</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Additional Gift Givers Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Additional Gift Givers</h3>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
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
                        placeholder="e.g., Santa, Grandma"
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
            <p className="text-sm text-muted-foreground mb-4">
              Add extra gift givers like Santa, family pets, or anyone else who gives gifts.
            </p>

            {virtualGivers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No additional givers yet
              </div>
            ) : (
              <div className="space-y-2">
                {virtualGivers.map((giver, index) => (
                  <div
                    key={giver.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveUp(index, true)}
                          disabled={index === 0}
                          className="h-4 w-6 p-0"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveDown(index, true)}
                          disabled={index === virtualGivers.length - 1}
                          className="h-4 w-6 p-0"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-2xl">{giver.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{giver.name}</p>
                        <GiftCount giverId={giver.id} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(giver)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(giver)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  Name is managed through the user's profile and syncs automatically
                </div>
              )}
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