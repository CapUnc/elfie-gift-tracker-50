import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Gift as GiftIcon, DollarSign, ChevronDown, ChevronRight, Filter, Settings, Package, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, X, Trash2, Home, AlertCircle, CheckCircle, Circle, PlusCircle, Edit2, Save, XCircle, Search, ShoppingCart, Clock, Users, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useAnimatedButton } from '@/hooks/useAnimatedButton';
import { RippleButton } from './RippleButton';
import FloatingActionButton from './FloatingActionButton';
import { SwipeableGiftItem } from './SwipeableGiftItem';
import { GiftSearch } from './GiftSearch';
import { AlphabetIndex } from './AlphabetIndex';
import { GiftContextMenu, PersonContextMenu } from './ContextMenu';
import { GiftNotes } from './GiftNotes';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency } from '@/lib/currency';
import { GiftForm } from './GiftForm';
import { useAppData } from '@/components/providers/DataProvider';
import { Person, Buyer, Gift, SearchFilters } from '@/types';
import { DEFAULT_FILTERS } from '@/constants';

const GiftTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const haptic = useHapticFeedback();
  const { people, buyers, settings, updatePeople, addPerson, updatePerson, deletePerson } = useAppData();
  const currency = settings.currency;

  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonAssignment, setNewPersonAssignment] = useState<string | null>(null);
  const [editingGift, setEditingGift] = useState<{ personId: string; giftId?: string; gift?: Gift } | null>(null);
  const [giftForm, setGiftForm] = useState({ name: '', cost: '' });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedTracking, setExpandedTracking] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  // Handle navigation state from Summary page
  useEffect(() => {
    const state = window.history.state?.usr?.state;
    if (state?.applyFilter) {
      switch (state.applyFilter) {
        case 'people-incomplete':
          setFilters(prev => ({ ...prev, completion: 'incomplete' }));
          break;
        case 'needs-purchase':
          setFilters(prev => ({ ...prev, completion: 'incomplete' }));
          break;
        case 'needs-wrapping':
          setFilters(prev => ({ ...prev, wrapping: 'needs-wrapping' }));
          break;
      }
    }
  }, []);

  const [sortConfig, setSortConfig] = useState({ key: 'name' as keyof Person, direction: 'asc' as 'asc' | 'desc' });
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const handleAddPerson = () => {
    if (!newPersonName.trim()) return;
    
    const newPersonData = {
      name: newPersonName.trim(),
      gifts: [],
      notes: '',
      assignedTo: newPersonAssignment
    };
    
    addPerson.mutate(newPersonData, {
      onSuccess: () => {
        setNewPersonName('');
        setNewPersonAssignment(null);
        setIsAddPersonOpen(false);
        setUnsavedChanges(false);
      }
    });
  };

  const handleAddGift = (personId: string, giftData: { name: string; cost: string }) => {
    if (!giftData.name.trim()) return;
    
    const parsedCost = giftData.cost.trim() === '' ? null : parseFloat(giftData.cost);
    if (giftData.cost.trim() !== '' && (isNaN(parsedCost!) || parsedCost! < 0)) {
      toast({
        title: "Invalid cost",
        description: "Please enter a valid positive number for the cost.",
        variant: "destructive",
      });
      return;
    }

    const newGift: Gift = {
      id: Date.now().toString(),
      name: giftData.name.trim(),
      cost: parsedCost,
      purchased: false,
      wrapped: false,
    };

    const currentPeople = people;
    const updatedPeople = currentPeople.map(person =>
      person.id === personId 
        ? { ...person, gifts: [...person.gifts, newGift] }
        : person
    );

    updatePeople.mutate(updatedPeople, {
      onSuccess: () => {
        toast({
          title: "Gift added!",
          description: `${giftData.name.trim()} has been added.`,
        });
      }
    });
  };

  const handleUpdateGift = (personId: string, giftId: string, updates: Partial<Gift>) => {
    const currentPeople = people;
    const updatedPeople = currentPeople.map(person =>
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.map(gift =>
              gift.id === giftId ? { ...gift, ...updates } : gift
            )
          }
        : person
    );

    updatePeople.mutate(updatedPeople);
  };

  const handleDeleteGift = (personId: string, giftId: string) => {
    const currentPeople = people;
    const updatedPeople = currentPeople.map(person =>
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.filter(gift => gift.id !== giftId)
          }
        : person
    );

    updatePeople.mutate(updatedPeople, {
      onSuccess: () => {
        toast({
          title: "Gift deleted",
          description: "The gift has been removed.",
        });
      }
    });
  };

  const handlePersonUpdate = (personId: string, updates: Partial<Person>) => {
    updatePerson.mutate({ personId, updates });
  };

  const handleDeletePerson = (personId: string) => {
    deletePerson.mutate(personId);
  };

  // Filter and sort logic
  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      // Search filter
      if (searchTerm && !person.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Assignment filter
      if (filters.assignedTo !== 'all' && person.assignedTo !== filters.assignedTo) {
        return false;
      }

      // Completion filter
      if (filters.completion !== 'all') {
        const isComplete = person.completed || person.gifts.every(gift => gift.purchased && gift.wrapped);
        if (filters.completion === 'completed' && !isComplete) return false;
        if (filters.completion === 'incomplete' && isComplete) return false;
      }

      // Wrapping filter
      if (filters.wrapping !== 'all') {
        const needsWrapping = person.gifts.some(gift => gift.purchased && !gift.wrapped);
        const allWrapped = person.gifts.length > 0 && person.gifts.every(gift => !gift.purchased || gift.wrapped);
        
        if (filters.wrapping === 'needs-wrapping' && !needsWrapping) return false;
        if (filters.wrapping === 'all-wrapped' && !allWrapped) return false;
      }

      // Gifts filter
      if (filters.hasGifts !== 'all') {
        const hasGifts = person.gifts.length > 0;
        if (filters.hasGifts === 'with-gifts' && !hasGifts) return false;
        if (filters.hasGifts === 'no-gifts' && hasGifts) return false;
      }

      return true;
    });
  }, [people, searchTerm, filters]);

  const sortedPeople = useMemo(() => {
    return [...filteredPeople].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPeople, sortConfig]);

  return (
    <div className="p-4 sm:p-6 pb-20 max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto max-w-full">
        {/* Compact Header */}
        <div className="mb-6 max-w-full">
          <div className="flex items-center justify-between mb-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2 min-w-0">
                <GiftIcon className="h-5 w-5 text-christmas-red flex-shrink-0" />
                <span className="truncate">Gift Tracker</span>
              </h1>
              <p className="text-sm text-muted-foreground">Manage holiday gifts</p>
            </div>
          </div>

          {/* Enhanced Search and Filter System */}
          <div className="max-w-full overflow-hidden">
            <GiftSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={filters}
              onFiltersChange={setFilters}
              buyers={buyers}
            />
          </div>
        </div>

        {/* Add Person Dialog */}
        <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Person</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Person's name"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddPerson()}
              />
              {buyers.length > 1 && (
                <Select value={newPersonAssignment || ''} onValueChange={(value: string) => setNewPersonAssignment(value === 'unassigned' ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {buyers.map(buyer => (
                      <SelectItem key={buyer.id} value={buyer.name}>{buyer.emoji} {buyer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex flex-col gap-3 pt-4 border-t">
                <RippleButton 
                  onClick={handleAddPerson} 
                  className="w-full h-11" 
                  disabled={!newPersonName.trim() || addPerson.isPending}
                >
                  {addPerson.isPending ? 'Adding...' : 'Add Recipient'}
                </RippleButton>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddPersonOpen(false)}
                  className="w-full h-11"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Gift Form Sheet */}
        {editingGift && (
          <GiftForm
            isOpen={!!editingGift}
            onClose={() => setEditingGift(null)}
            onSubmit={(giftData) => {
              if (editingGift.giftId) {
                handleUpdateGift(editingGift.personId, editingGift.giftId, {
                  name: giftData.name,
                  cost: giftData.cost === '' ? null : parseFloat(giftData.cost)
                });
              } else {
                handleAddGift(editingGift.personId, giftData);
              }
              setEditingGift(null);
            }}
            personName={people.find(p => p.id === editingGift.personId)?.name || ''}
            currency={currency}
            editingGift={editingGift.gift}
            mode={editingGift.giftId ? 'edit' : 'add'}
          />
        )}

        {/* People List */}
        <div className="space-y-4">
          {sortedPeople.length === 0 ? (
            <div className="text-center py-12">
              <GiftIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {people.length === 0 ? 'No recipients yet' : 'No matching recipients'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {people.length === 0 
                  ? 'Add your first gift recipient to get started!' 
                  : 'Try adjusting your search or filters to find recipients.'
                }
              </p>
              {people.length === 0 && (
                <Button onClick={() => setIsAddPersonOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Recipient
                </Button>
              )}
            </div>
          ) : (
            sortedPeople.map(person => (
              <div key={person.id} className="bg-card rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{person.name}</h3>
                  <div className="flex items-center gap-2">
                    {person.assignedTo && (
                      <Badge variant="secondary">{person.assignedTo}</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGift({ personId: person.id })}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Gift
                    </Button>
                  </div>
                </div>
                
                {person.gifts.length > 0 && (
                  <div className="space-y-2">
                    {person.gifts.map(gift => (
                      <div key={gift.id} className="flex items-center justify-between bg-muted/50 rounded p-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={gift.purchased}
                            onCheckedChange={(checked) => 
                              handleUpdateGift(person.id, gift.id, { purchased: checked as boolean })
                            }
                          />
                          <span className={gift.purchased ? 'line-through text-muted-foreground' : ''}>
                            {gift.name}
                          </span>
                          {gift.cost && (
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(gift.cost, currency)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingGift({ personId: person.id, giftId: gift.id, gift })}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGift(person.id, gift.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {person.notes && (
                  <div className="mt-2 p-2 bg-muted/30 rounded text-sm">
                    {person.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton onClick={() => setIsAddPersonOpen(true)} />
      </div>
    </div>
  );
};

export default GiftTracker;