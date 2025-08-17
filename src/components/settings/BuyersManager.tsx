import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
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

interface Buyer {
  id: string;
  name: string;
  emoji: string;
}

interface Person {
  id: string;
  name: string;
  gifts: any[];
  notes: string;
  assignedTo: string | null;
}

const BuyersManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [buyers, setBuyers] = useState<Buyer[]>([
    { id: '1', name: 'Matt', emoji: '👨' },
    { id: '2', name: 'Maddie', emoji: '👩' }
  ]);
  const [people, setPeople] = useState<Person[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBuyer, setNewBuyer] = useState('');
  const [newBuyerEmoji, setNewBuyerEmoji] = useState('👤');
  const [editingBuyer, setEditingBuyer] = useState<string | null>(null);
  const [editBuyerName, setEditBuyerName] = useState('');
  const [editBuyerEmoji, setEditBuyerEmoji] = useState('');
  const [buyerToDelete, setBuyerToDelete] = useState<Buyer | null>(null);

  // Load buyers from localStorage
  useEffect(() => {
    const savedBuyers = localStorage.getItem('christmas-gifts-buyers');
    if (savedBuyers) {
      const parsed = JSON.parse(savedBuyers);
      // Handle migration from old string array format
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        const migratedBuyers = parsed.map((name: string, index: number) => ({
          id: (index + 1).toString(),
          name,
          emoji: index === 0 ? '👨' : '👩'
        }));
        setBuyers(migratedBuyers);
        localStorage.setItem('christmas-gifts-buyers', JSON.stringify(migratedBuyers));
      } else {
        setBuyers(parsed);
      }
    }
  }, []);

  // Load recipients from localStorage
  useEffect(() => {
    const savedPeople = localStorage.getItem('christmas-gifts-2025');
    if (savedPeople) {
      setPeople(JSON.parse(savedPeople));
    }
  }, []);

  // Save buyers to localStorage
  useEffect(() => {
    localStorage.setItem('christmas-gifts-buyers', JSON.stringify(buyers));
  }, [buyers]);

  const addBuyer = () => {
    if (!newBuyer.trim() || buyers.some(buyer => buyer.name === newBuyer.trim())) {
      toast({
        title: "Cannot add buyer",
        description: newBuyer.trim() ? "A buyer with this name already exists." : "Please enter a buyer name.",
        variant: "destructive",
      });
      return;
    }
    const newBuyerObj: Buyer = {
      id: crypto.randomUUID(),
      name: newBuyer.trim(),
      emoji: newBuyerEmoji
    };
    setBuyers([...buyers, newBuyerObj]);
    setNewBuyer('');
    setNewBuyerEmoji('👤');
    setShowAddForm(false);
    toast({
      title: "Buyer added",
      description: `${newBuyerObj.name} has been added as a buyer.`,
    });
  };

  const confirmRemoveBuyer = () => {
    if (!buyerToDelete) return;
    
    setBuyers(buyers.filter(buyer => buyer.id !== buyerToDelete.id));
    
    // Clean up assignments for recipients assigned to the deleted buyer
    const updatedPeople = people.map(person => 
      person.assignedTo === buyerToDelete.name 
        ? { ...person, assignedTo: null }
        : person
    );
    setPeople(updatedPeople);
    localStorage.setItem('christmas-gifts-2025', JSON.stringify(updatedPeople));
    
    toast({
      title: "Buyer removed",
      description: `${buyerToDelete.name} has been removed. Their assignments have been cleared.`,
    });
    
    setBuyerToDelete(null);
  };

  const startEditBuyer = (buyer: Buyer) => {
    setEditingBuyer(buyer.id);
    setEditBuyerName(buyer.name);
    setEditBuyerEmoji(buyer.emoji);
  };

  const saveEditBuyer = (buyerId: string) => {
    if (!editBuyerName.trim()) return;
    
    const oldBuyer = buyers.find(b => b.id === buyerId);
    const updatedBuyers = buyers.map(buyer => 
      buyer.id === buyerId 
        ? { ...buyer, name: editBuyerName.trim(), emoji: editBuyerEmoji }
        : buyer
    );
    setBuyers(updatedBuyers);
    
    // Update assignments if buyer name changed
    if (oldBuyer && oldBuyer.name !== editBuyerName.trim()) {
      const updatedPeople = people.map(person => 
        person.assignedTo === oldBuyer.name 
          ? { ...person, assignedTo: editBuyerName.trim() }
          : person
      );
      setPeople(updatedPeople);
      localStorage.setItem('christmas-gifts-2025', JSON.stringify(updatedPeople));
    }
    
    cancelEditBuyer();
  };

  const cancelEditBuyer = () => {
    setEditingBuyer(null);
    setEditBuyerName('');
    setEditBuyerEmoji('');
  };

  const emojiOptions = ['👤', '👨', '👩', '🧑', '👦', '👧', '🎅', '🤶', '👑', '⭐', '💝', '🎁'];

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
                            onClick={() => setBuyerToDelete(buyer)}
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
                        addBuyer();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addBuyer} className="flex-1 min-h-[44px] touch-target focus-ring">
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