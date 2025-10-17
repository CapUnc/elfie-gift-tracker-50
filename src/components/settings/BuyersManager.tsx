import React, { useState } from 'react';
import { ArrowLeft, Users, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { useBuyers } from '@/hooks/useBuyers';
import { useRecipients } from '@/hooks/useRecipients';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const BuyersManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const { householdId } = useHousehold(session?.user?.id);
  const { buyers, loading, addBuyer, updateBuyer, deleteBuyer } = useBuyers(householdId);
  const { recipients, updateRecipient } = useRecipients(householdId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newBuyer, setNewBuyer] = useState('');
  const [newBuyerEmoji, setNewBuyerEmoji] = useState('👤');
  const [editingBuyer, setEditingBuyer] = useState<string | null>(null);
  const [editBuyerName, setEditBuyerName] = useState('');
  const [editBuyerEmoji, setEditBuyerEmoji] = useState('');
  const [buyerToDelete, setBuyerToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleAddBuyer = async () => {
    if (!newBuyer.trim() || buyers.some(buyer => buyer.name === newBuyer.trim())) {
      toast({
        title: "Cannot add buyer",
        description: newBuyer.trim() ? "A buyer with this name already exists." : "Please enter a buyer name.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addBuyer(newBuyer.trim(), newBuyerEmoji);
      setNewBuyer('');
      setNewBuyerEmoji('👤');
      setShowAddForm(false);
      toast({
        title: "Buyer added",
        description: `${newBuyer.trim()} has been added as a buyer.`,
      });
    } catch (error) {
      // Error toast is shown by the hook
    }
  };

  const confirmRemoveBuyer = async () => {
    if (!buyerToDelete) return;

    try {
      // Clear assignments for recipients assigned to the deleted buyer
      const assignedRecipients = recipients.filter(r => r.assigned_to === buyerToDelete.id);
      await Promise.all(
        assignedRecipients.map(r => updateRecipient(r.id, { assigned_to: null }))
      );

      // Delete the buyer
      await deleteBuyer(buyerToDelete.id);

      toast({
        title: "Buyer removed",
        description: `${buyerToDelete.name} has been removed. Their assignments have been cleared.`,
      });
    } catch (error) {
      // Error toast is shown by the hook
    } finally {
      setBuyerToDelete(null);
    }
  };

  const startEditBuyer = (buyer: { id: string; name: string; emoji: string }) => {
    setEditingBuyer(buyer.id);
    setEditBuyerName(buyer.name);
    setEditBuyerEmoji(buyer.emoji);
  };

  const saveEditBuyer = async (buyerId: string) => {
    if (!editBuyerName.trim()) return;

    try {
      await updateBuyer(buyerId, { name: editBuyerName.trim(), emoji: editBuyerEmoji });
      cancelEditBuyer();
    } catch (error) {
      // Error toast is shown by the hook
    }
  };

  const cancelEditBuyer = () => {
    setEditingBuyer(null);
    setEditBuyerName('');
    setEditBuyerEmoji('');
  };

  const emojiOptions = ['👤', '👨', '👩', '🧑', '👦', '👧', '🎅', '🤶', '👑', '⭐', '💝', '🎁'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading buyers...</p>
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
            <h1 className="text-3xl font-bold text-primary">Manage Buyers</h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Current Buyers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Current Buyers ({buyers.length})
                </div>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="min-h-[44px] touch-target focus-ring"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Buyer
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {buyers.map((buyer) => (
                  <div key={buyer.id} className="flex items-center gap-2">
                    {editingBuyer === buyer.id ? (
                      <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background flex-1">
                        <div className="flex flex-wrap gap-1">
                          {emojiOptions.map((emoji) => (
                            <Button
                              key={emoji}
                              variant={editBuyerEmoji === emoji ? "default" : "ghost"}
                              size="sm"
                              className="h-6 w-6 p-0 text-sm"
                              onClick={() => setEditBuyerEmoji(emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                        <Input
                          value={editBuyerName}
                          onChange={(e) => setEditBuyerName(e.target.value)}
                          className="h-8 flex-1 min-w-0"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEditBuyer(buyer.id)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditBuyer}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-2 text-sm flex-1 justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{buyer.emoji}</span>
                          <span className="truncate">{buyer.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditBuyer(buyer)}
                            className="h-auto p-1 hover:bg-transparent min-h-[44px] touch-target focus-ring"
                            aria-label={`Edit ${buyer.name}`}
                          >
                            <Edit2 className="w-3 h-3 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBuyerToDelete({ id: buyer.id, name: buyer.name })}
                            className="h-auto p-1 hover:bg-transparent min-h-[44px] touch-target focus-ring"
                            aria-label={`Delete ${buyer.name}`}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add New Buyer Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Buyer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Choose an emoji
                  </label>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {emojiOptions.map((emoji) => (
                      <Button
                        key={emoji}
                        variant={newBuyerEmoji === emoji ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setNewBuyerEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Buyer name
                  </label>
                  <Input
                    placeholder="Enter buyer name"
                    value={newBuyer}
                    onChange={(e) => setNewBuyer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddBuyer();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddBuyer} className="flex-1 min-h-[44px] touch-target focus-ring">
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewBuyer('');
                      setNewBuyerEmoji('👤');
                    }}
                    className="min-h-[44px] touch-target focus-ring"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!buyerToDelete} onOpenChange={() => setBuyerToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Buyer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{buyerToDelete?.name}"? This will clear their assignments from all recipients. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemoveBuyer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Buyer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default BuyersManager;
