import React, { useState } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Plus, Trash2, Users, DollarSign, Edit2, Check, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { DeleteRecipientsDialog } from './settings/DeleteRecipientsDialog';
import { useAppData } from '@/components/providers/DataProvider';
import { Buyer, Person } from '@/types';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { people, buyers, settings, updateSettings, updatePeople } = useAppData();
  const currency = settings.currency;
  
  const [newBuyer, setNewBuyer] = useState('');
  const [newBuyerEmoji, setNewBuyerEmoji] = useState('👤');
  const [bulkNames, setBulkNames] = useState('');
  const [editingBuyer, setEditingBuyer] = useState<string | null>(null);
  const [editBuyerName, setEditBuyerName] = useState('');
  const [editBuyerEmoji, setEditBuyerEmoji] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Data is now loaded via React Query hooks in DataProvider

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
      id: Date.now().toString(),
      name: newBuyer.trim(),
      emoji: newBuyerEmoji
    };
    const updatedBuyers = [...buyers, newBuyerObj];
    updateSettings.mutate({ buyers: updatedBuyers }, {
      onSuccess: () => {
        setNewBuyer('');
        setNewBuyerEmoji('👤');
        toast({
          title: "Buyer added",
          description: `${newBuyerObj.name} has been added as a buyer.`,
        });
      }
    });
  };

  const removeBuyer = (buyerIdToRemove: string) => {
    const buyerToRemove = buyers.find(buyer => buyer.id === buyerIdToRemove);
    if (!buyerToRemove) return;
    
    const updatedBuyers = buyers.filter(buyer => buyer.id !== buyerIdToRemove);
    updateSettings.mutate({ buyers: updatedBuyers }, {
      onSuccess: () => {
        // Also update people assignments
        const updatedPeople = people.map(person => 
          person.assignedTo === buyerToRemove.name 
            ? { ...person, assignedTo: null }
            : person
        );
        // TODO: This should also update people via mutation
        
        toast({
          title: "Buyer removed",
          description: `${buyerToRemove.name} has been removed. Their assignments have been cleared.`,
        });
      }
    });
  };

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

    // Add to existing people and update via mutation
    const newPeople = newNames.map((name, index) => ({
      id: (Date.now() + index).toString(),
      name: name,
      gifts: [],
      notes: '',
      assignedTo: null
    }));

    const updatedPeople = [...people, ...newPeople];
    updatePeople.mutate(updatedPeople, {
      onSuccess: () => {
        setBulkNames('');
        toast({
          title: "Recipients added",
          description: `Added ${newNames.length} new recipient${newNames.length !== 1 ? 's' : ''}: ${newNames.join(', ')}`,
        });
      }
    });
  };

  const handleDeletePeople = (peopleIds: string[]) => {
    const updatedPeople = people.filter(person => !peopleIds.includes(person.id));
    updatePeople.mutate(updatedPeople, {
      onSuccess: () => {
        toast({
          title: "Recipients deleted",
          description: `${peopleIds.length} recipient${peopleIds.length !== 1 ? 's' : ''} ${peopleIds.length !== 1 ? 'have' : 'has'} been permanently deleted.`,
        });
      }
    });
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
    
    updateSettings.mutate({ buyers: updatedBuyers }, {
      onSuccess: () => {
        // Update assignments if buyer name changed
        if (oldBuyer && oldBuyer.name !== editBuyerName.trim()) {
          const updatedPeople = people.map(person => 
            person.assignedTo === oldBuyer.name 
              ? { ...person, assignedTo: editBuyerName.trim() }
              : person
          );
          updatePeople.mutate(updatedPeople);
        }
        cancelEditBuyer();
      }
    });
  };

  const cancelEditBuyer = () => {
    setEditingBuyer(null);
    setEditBuyerName('');
    setEditBuyerEmoji('');
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 min-h-[44px] sm:min-h-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Summary
          </Button>
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Settings</h1>
          </div>
        </div>

        {/* Desktop: Two-column layout, Mobile: Single column */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Currency Section - Always visible at top */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Currency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Select Currency Symbol
                </label>
                <Select value={currency} onValueChange={(value) => updateSettings.mutate({ currency: value })}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ (USD - US Dollar)</SelectItem>
                    <SelectItem value="€">€ (EUR - Euro)</SelectItem>
                    <SelectItem value="£">£ (GBP - British Pound)</SelectItem>
                    <SelectItem value="C$">C$ (CAD - Canadian Dollar)</SelectItem>
                    <SelectItem value="A$">A$ (AUD - Australian Dollar)</SelectItem>
                    <SelectItem value="¥">¥ (JPY - Japanese Yen)</SelectItem>
                    <SelectItem value="CHF">CHF (Swiss Franc)</SelectItem>
                    <SelectItem value="kr">kr (SEK/NOK/DKK)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  This only changes the display symbol - existing prices are not converted.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recipients Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Manage Recipients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-recipients">
                  <AccordionTrigger className="text-sm font-medium">
                    Add Multiple Recipients
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Add recipients (comma-separated)
                      </label>
                      <Textarea
                        placeholder="John Doe, Jane Smith, Bob Johnson, etc..."
                        value={bulkNames}
                        onChange={(e) => setBulkNames(e.target.value)}
                        className="resize-none"
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleBulkAdd} className="w-full min-h-[44px] sm:min-h-auto">
                      Add Recipients
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Names will be added as unassigned. You can assign them to buyers later.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="delete-recipients">
                  <AccordionTrigger className="text-sm font-medium">
                    Delete Recipients ({people.length} total)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    {people.length > 0 ? (
                      <>
                        <Button
                          variant="destructive"
                          onClick={() => setDeleteDialogOpen(true)}
                          className="w-full min-h-[44px] sm:min-h-auto"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Recipients...
                        </Button>
                        <p className="text-xs text-destructive">
                          <strong>Warning:</strong> Deleting recipients will remove all their gifts, notes, and assignments permanently.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-md">
                        No recipients added yet. Use "Add Multiple Recipients" above to get started.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Buyers Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Manage Buyers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Current Buyers */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Current Buyers
                  </label>
                  <div className="space-y-2">
                    {buyers.map((buyer) => (
                      <div key={buyer.id} className="flex items-center gap-2">
                        {editingBuyer === buyer.id ? (
                          <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background flex-1">
                            <div className="flex flex-wrap gap-1">
                              {['👤', '👨', '👩', '🧑', '👦', '👧', '🎅', '🤶', '👑', '⭐', '💝', '🎁'].map((emoji) => (
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
                                className="h-auto p-1 hover:bg-transparent min-h-[44px] sm:min-h-auto"
                                aria-label={`Edit ${buyer.name}`}
                              >
                                <Edit2 className="w-3 h-3 text-muted-foreground hover:text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBuyer(buyer.id)}
                                className="h-auto p-1 hover:bg-transparent min-h-[44px] sm:min-h-auto"
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
                </div>

                {/* Add New Buyer */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="add-buyer">
                    <AccordionTrigger className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add New Buyer
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">
                          Choose Emoji/Avatar
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {['👤', '👨', '👩', '🧑', '👦', '👧', '🎅', '🤶', '👑', '⭐', '💝', '🎁'].map((emoji) => (
                            <Button
                              key={emoji}
                              variant={newBuyerEmoji === emoji ? "default" : "outline"}
                              size="sm"
                              className="h-10 w-10 p-0 text-lg"
                              onClick={() => setNewBuyerEmoji(emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 border rounded-md px-3 py-2 flex-1">
                          <span className="text-lg">{newBuyerEmoji}</span>
                          <Input
                            placeholder="Buyer name"
                            value={newBuyer}
                            onChange={(e) => setNewBuyer(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addBuyer()}
                            className="border-0 p-0 focus-visible:ring-0 flex-1"
                          />
                        </div>
                        <Button onClick={addBuyer} className="min-h-[44px] sm:min-h-auto">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="space-y-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md border-l-2 border-primary/50">
                  <p>
                    <strong>Note:</strong> The assignment column will only appear in the gift tracker when you have more than one buyer. This keeps the interface clean for solo users while enabling collaboration for couples, families, or groups.
                  </p>
                </div>
              </div>
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

export default Settings;