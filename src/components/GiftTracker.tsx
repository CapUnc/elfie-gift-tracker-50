import React, { useState, useEffect } from 'react';
import { Plus, Gift, DollarSign, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  assignedTo: 'Matt' | 'Maddie';
}

const GiftTracker = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonAssignment, setNewPersonAssignment] = useState<'Matt' | 'Maddie'>('Matt');
  const [editingGift, setEditingGift] = useState<{ personId: string; giftId?: string } | null>(null);
  const [giftForm, setGiftForm] = useState({ name: '', cost: '' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    assignedTo: 'all' as 'all' | 'Matt' | 'Maddie',
    completion: 'all' as 'all' | 'completed' | 'incomplete',
    wrapping: 'all' as 'all' | 'needs-wrapping' | 'all-wrapped'
  });

  // Initial data from spreadsheet
  const initialPeople: Person[] = [
    { id: '1', name: 'Mom (Mary)', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '2', name: 'Dad (Neil)', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '3', name: 'Mom (Kathy)', gifts: [], notes: '', assignedTo: 'Maddie' },
    { id: '4', name: 'Ray', gifts: [], notes: '', assignedTo: 'Maddie' },
    { id: '5', name: 'Kim', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '6', name: 'Jason', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '7', name: 'Kirstin', gifts: [], notes: '', assignedTo: 'Maddie' },
    { id: '8', name: 'Ralph', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '9', name: 'Jenny', gifts: [], notes: '', assignedTo: 'Maddie' },
    { id: '10', name: 'Billy', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '11', name: 'Maddie', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '12', name: 'Cole', gifts: [], notes: '', assignedTo: 'Maddie' },
    { id: '13', name: 'Gina', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '14', name: 'Addyson', gifts: [], notes: '', assignedTo: 'Maddie' },
    { id: '15', name: 'Esme', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '16', name: 'Atticus', gifts: [], notes: '', assignedTo: 'Maddie' },
    { id: '17', name: 'Eden', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '18', name: 'Dax', gifts: [], notes: '', assignedTo: 'Maddie' },
    { id: '19', name: 'Nassy', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '20', name: 'Pippa', gifts: [], notes: '', assignedTo: 'Maddie' },
    { id: '21', name: 'Hannah/Logan', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '22', name: 'Lizzie', gifts: [], notes: '', assignedTo: 'Maddie' },
    { id: '23', name: 'Landon', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '24', name: 'Work Team (Matt)', gifts: [], notes: '', assignedTo: 'Matt' },
    { id: '25', name: 'Chras', gifts: [], notes: '', assignedTo: 'Maddie' }
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
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever people changes (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('christmas-gifts-2025', JSON.stringify(people));
    }
  }, [people, isLoaded]);

  const addPerson = () => {
    if (!newPersonName.trim()) return;
    
    const newPerson: Person = {
      id: Date.now().toString(),
      name: newPersonName.trim(),
      gifts: [],
      notes: '',
      assignedTo: newPersonAssignment
    };
    
    setPeople([...people, newPerson]);
    setNewPersonName('');
    setNewPersonAssignment('Matt');
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

  const updateAssignment = (personId: string, assignedTo: 'Matt' | 'Maddie') => {
    setPeople(people.map(person => 
      person.id === personId ? { ...person, assignedTo } : person
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

  const toggleRow = (personId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(personId)) {
      newExpanded.delete(personId);
    } else {
      newExpanded.add(personId);
    }
    setExpandedRows(newExpanded);
  };

  // Filter people based on current filters
  const filteredPeople = people.filter(person => {
    // Filter by assignment
    if (filters.assignedTo !== 'all' && person.assignedTo !== filters.assignedTo) {
      return false;
    }

    // Filter by completion
    if (filters.completion !== 'all') {
      const stats = getCompletionStats(person.gifts);
      const isCompleted = stats.total > 0 && stats.purchased === stats.total;
      if (filters.completion === 'completed' && !isCompleted) return false;
      if (filters.completion === 'incomplete' && isCompleted) return false;
    }

    // Filter by wrapping
    if (filters.wrapping !== 'all') {
      const stats = getCompletionStats(person.gifts);
      const needsWrapping = stats.total > 0 && stats.wrapped < stats.total;
      const allWrapped = stats.total > 0 && stats.wrapped === stats.total;
      
      if (filters.wrapping === 'needs-wrapping' && !needsWrapping) return false;
      if (filters.wrapping === 'all-wrapped' && !allWrapped) return false;
    }

    return true;
  });

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

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Add Person Button */}
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
                <Select value={newPersonAssignment} onValueChange={(value: 'Matt' | 'Maddie') => setNewPersonAssignment(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Matt">Matt</SelectItem>
                    <SelectItem value="Maddie">Maddie</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addPerson} className="w-full">
                  Add Person
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filters:</span>
          </div>

          <Select value={filters.assignedTo} onValueChange={(value: any) => setFilters(prev => ({ ...prev, assignedTo: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              <SelectItem value="Matt">Matt's</SelectItem>
              <SelectItem value="Maddie">Maddie's</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.completion} onValueChange={(value: any) => setFilters(prev => ({ ...prev, completion: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.wrapping} onValueChange={(value: any) => setFilters(prev => ({ ...prev, wrapping: value }))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wrapping</SelectItem>
              <SelectItem value="needs-wrapping">Needs Wrapping</SelectItem>
              <SelectItem value="all-wrapped">All Wrapped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.map((person) => {
                const stats = getCompletionStats(person.gifts);
                const totalCost = getTotalCost(person.gifts);
                const isExpanded = expandedRows.has(person.id);
                
                return (
                  <React.Fragment key={person.id}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(person.id)}
                          className="p-1"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>
                        <Select 
                          value={person.assignedTo} 
                          onValueChange={(value: 'Matt' | 'Maddie') => updateAssignment(person.id, value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Matt">Matt</SelectItem>
                            <SelectItem value="Maddie">Maddie</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-christmas-gold" />
                          <span className="font-semibold text-christmas-gold">
                            ${totalCost.toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {stats.purchased}/{stats.total} purchased
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {stats.wrapped}/{stats.total} wrapped
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          placeholder="Notes..."
                          value={person.notes}
                          onChange={(e) => updateNotes(person.id, e.target.value)}
                          className="resize-none min-h-[40px] text-sm"
                          rows={1}
                        />
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded row content */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="p-4 space-y-4">
                            <h4 className="font-medium text-sm text-muted-foreground">Gifts for {person.name}</h4>
                            
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
                                className="border-dashed"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Gift
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Empty state */}
        {filteredPeople.length === 0 && people.length > 0 && (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No people match your filters
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filter criteria to see more results
            </p>
          </div>
        )}

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