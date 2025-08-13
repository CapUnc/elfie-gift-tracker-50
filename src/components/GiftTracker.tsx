import React, { useState, useEffect } from 'react';
import { Plus, Gift, DollarSign, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface Gift {
  id: string;
  name: string;
  cost: number;
  purchased: boolean;
  wrapped: boolean;
}

interface Person {
  id: string;
  name: string;
  gifts: Gift[];
  notes: string;
}

const GiftTracker = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [editingGift, setEditingGift] = useState<{ personId: string; giftId?: string } | null>(null);
  const [giftForm, setGiftForm] = useState({ name: '', cost: '' });

  // Initial data from spreadsheet
  const initialPeople: Person[] = [
    { id: '1', name: 'Mom (Mary)', gifts: [], notes: '' },
    { id: '2', name: 'Dad (Neil)', gifts: [], notes: '' },
    { id: '3', name: 'Mom (Kathy)', gifts: [], notes: '' },
    { id: '4', name: 'Ray', gifts: [], notes: '' },
    { id: '5', name: 'Kim', gifts: [], notes: '' },
    { id: '6', name: 'Jason', gifts: [], notes: '' },
    { id: '7', name: 'Kirstin', gifts: [], notes: '' },
    { id: '8', name: 'Ralph', gifts: [], notes: '' },
    { id: '9', name: 'Jenny', gifts: [], notes: '' },
    { id: '10', name: 'Billy', gifts: [], notes: '' },
    { id: '11', name: 'Maddie', gifts: [], notes: '' },
    { id: '12', name: 'Cole', gifts: [], notes: '' },
    { id: '13', name: 'Gina', gifts: [], notes: '' },
    { id: '14', name: 'Addyson', gifts: [], notes: '' },
    { id: '15', name: 'Esme', gifts: [], notes: '' },
    { id: '16', name: 'Atticus', gifts: [], notes: '' },
    { id: '17', name: 'Eden', gifts: [], notes: '' },
    { id: '18', name: 'Dax', gifts: [], notes: '' },
    { id: '19', name: 'Nassy', gifts: [], notes: '' },
    { id: '20', name: 'Pippa', gifts: [], notes: '' },
    { id: '21', name: 'Hannah/Logan', gifts: [], notes: '' },
    { id: '22', name: 'Lizzie', gifts: [], notes: '' },
    { id: '23', name: 'Landon', gifts: [], notes: '' },
    { id: '24', name: 'Work Team (Matt)', gifts: [], notes: '' },
    { id: '25', name: 'Chras', gifts: [], notes: '' }
  ];

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('christmas-gifts-2025');
    if (saved) {
      setPeople(JSON.parse(saved));
    } else {
      // Initialize with the names from your spreadsheet
      setPeople(initialPeople);
    }
  }, []);

  // Save to localStorage whenever people changes
  useEffect(() => {
    localStorage.setItem('christmas-gifts-2025', JSON.stringify(people));
  }, [people]);

  const addPerson = () => {
    if (!newPersonName.trim()) return;
    
    const newPerson: Person = {
      id: Date.now().toString(),
      name: newPersonName.trim(),
      gifts: [],
      notes: ''
    };
    
    setPeople([...people, newPerson]);
    setNewPersonName('');
    setIsAddPersonOpen(false);
  };

  const addGift = (personId: string) => {
    if (!giftForm.name.trim()) return;
    
    const newGift: Gift = {
      id: Date.now().toString(),
      name: giftForm.name.trim(),
      cost: parseFloat(giftForm.cost) || 0,
      purchased: false,
      wrapped: false
    };
    
    setPeople(people.map(person => 
      person.id === personId 
        ? { ...person, gifts: [...person.gifts, newGift] }
        : person
    ));
    
    setGiftForm({ name: '', cost: '' });
    setEditingGift(null);
  };

  const updateGiftStatus = (personId: string, giftId: string, field: 'purchased' | 'wrapped', value: boolean) => {
    setPeople(people.map(person => 
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.map(gift => 
              gift.id === giftId ? { ...gift, [field]: value } : gift
            )
          }
        : person
    ));
  };

  const updateNotes = (personId: string, notes: string) => {
    setPeople(people.map(person => 
      person.id === personId ? { ...person, notes } : person
    ));
  };

  const getTotalCost = (gifts: Gift[]) => {
    return gifts.reduce((total, gift) => total + gift.cost, 0);
  };

  const getCompletionStats = (gifts: Gift[]) => {
    const purchased = gifts.filter(g => g.purchased).length;
    const wrapped = gifts.filter(g => g.wrapped).length;
    return { purchased, wrapped, total: gifts.length };
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 flex items-center justify-center gap-3">
            <Gift className="text-christmas-red" />
            Christmas 2025 Gift Tracker
            <Gift className="text-christmas-green" />
          </h1>
          <p className="text-muted-foreground">Keep track of all your holiday gift planning</p>
        </div>

        {/* Add Person Button */}
        <div className="mb-6">
          <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-festive hover:opacity-90 text-white shadow-festive">
                <Plus className="w-4 h-4 mr-2" />
                Add Person
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Person</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Person's name"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPerson()}
                />
                <Button onClick={addPerson} className="w-full">
                  Add Person
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* People Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {people.map((person) => {
            const stats = getCompletionStats(person.gifts);
            const totalCost = getTotalCost(person.gifts);
            
            return (
              <Card key={person.id} className="shadow-card hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-primary">{person.name}</span>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-christmas-gold" />
                      <span className="font-semibold text-christmas-gold">
                        ${totalCost.toFixed(2)}
                      </span>
                    </div>
                  </CardTitle>
                  
                  {/* Progress badges */}
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Package className="w-3 h-3 mr-1" />
                      {stats.purchased}/{stats.total} purchased
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Gift className="w-3 h-3 mr-1" />
                      {stats.wrapped}/{stats.total} wrapped
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Gifts List */}
                  <div className="space-y-3">
                    {person.gifts.map((gift) => (
                      <div key={gift.id} className="border rounded-lg p-3 bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{gift.name}</span>
                          <span className="text-sm text-christmas-gold font-semibold">
                            ${gift.cost.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`purchased-${gift.id}`}
                              checked={gift.purchased}
                              onCheckedChange={(checked) => 
                                updateGiftStatus(person.id, gift.id, 'purchased', checked as boolean)
                              }
                            />
                            <label 
                              htmlFor={`purchased-${gift.id}`} 
                              className="text-sm text-muted-foreground"
                            >
                              Purchased
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`wrapped-${gift.id}`}
                              checked={gift.wrapped}
                              onCheckedChange={(checked) => 
                                updateGiftStatus(person.id, gift.id, 'wrapped', checked as boolean)
                              }
                            />
                            <label 
                              htmlFor={`wrapped-${gift.id}`} 
                              className="text-sm text-muted-foreground"
                            >
                              Wrapped
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Gift */}
                  {editingGift?.personId === person.id ? (
                    <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                      <Input
                        placeholder="Gift name"
                        value={giftForm.name}
                        onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Cost"
                        value={giftForm.cost}
                        onChange={(e) => setGiftForm({ ...giftForm, cost: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => addGift(person.id)}
                          className="flex-1"
                        >
                          Add Gift
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditingGift(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGift({ personId: person.id })}
                      className="w-full border-dashed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Gift
                    </Button>
                  )}

                  {/* Notes */}
                  <div>
                    <Textarea
                      placeholder="Notes (gift ideas, preferences, etc.)"
                      value={person.notes}
                      onChange={(e) => updateNotes(person.id, e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty state */}
        {people.length === 0 && (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No gift recipients yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Start by adding the people you're buying gifts for
            </p>
            <Button 
              onClick={() => setIsAddPersonOpen(true)}
              className="bg-gradient-festive hover:opacity-90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Person
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftTracker;