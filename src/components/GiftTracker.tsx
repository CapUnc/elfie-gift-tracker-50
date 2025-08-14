import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Gift, DollarSign, ChevronDown, ChevronRight, Filter, Settings, Package, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, X, Trash2, Home, AlertCircle, CheckCircle, Circle, PlusCircle, Edit2, Save, XCircle } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

// Force rebuild to clear cached Popover references

interface Buyer {
  id: string;
  name: string;
  emoji: string;
}

interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  trackingNumber?: string;
  carrier?: string;
  assignedTo?: string | null;
}

interface Person {
  id: string;
  name: string;
  gifts: Gift[];
  notes: string;
  assignedTo: string | null;
  completed?: boolean;
}

const GiftTracker = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([
    { id: '1', name: 'Matt', emoji: '👨' },
    { id: '2', name: 'Maddie', emoji: '👩' }
  ]);
  const [currency, setCurrency] = useState('$');
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonAssignment, setNewPersonAssignment] = useState<string | null>(null);
  const [editingGift, setEditingGift] = useState<{ personId: string; giftId?: string } | null>(null);
  const [giftForm, setGiftForm] = useState({ name: '', cost: '' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedTracking, setExpandedTracking] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    assignedTo: 'all' as string,
    completion: 'all' as 'all' | 'completed' | 'incomplete',
    wrapping: 'all' as 'all' | 'needs-wrapping' | 'all-wrapped',
    showCompleted: false
  });
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'assignedTo' | 'totalCost' | 'progress';
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });
  const [deletingGift, setDeletingGift] = useState<{ personId: string; giftId: string; giftName: string } | null>(null);
  const [completionDialog, setCompletionDialog] = useState<{
    isOpen: boolean;
    person: Person | null;
    incompleteParts: { purchased: number; wrapped: number };
  }>({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } });
  const [quickAddGift, setQuickAddGift] = useState<{ personId: string; isOpen: boolean } | null>(null);
  const [editingRecipient, setEditingRecipient] = useState<{
    personId: string;
    field: 'assignment' | 'notes';
    value: string;
  } | null>(null);

  // Initial data from spreadsheet
  const initialPeople: Person[] = [
    { id: '1', name: 'Mom (Mary)', gifts: [], notes: '', assignedTo: null },
    { id: '2', name: 'Dad (Neil)', gifts: [], notes: '', assignedTo: null },
    { id: '3', name: 'Mom (Kathy)', gifts: [], notes: '', assignedTo: null },
    { id: '4', name: 'Ray', gifts: [], notes: '', assignedTo: null },
    { id: '5', name: 'Kim', gifts: [], notes: '', assignedTo: null },
    { id: '6', name: 'Jason', gifts: [], notes: '', assignedTo: null },
    { id: '7', name: 'Kirstin', gifts: [], notes: '', assignedTo: null },
    { id: '8', name: 'Ralph', gifts: [], notes: '', assignedTo: null },
    { id: '9', name: 'Jenny', gifts: [], notes: '', assignedTo: null },
    { id: '10', name: 'Billy', gifts: [], notes: '', assignedTo: null },
    { id: '11', name: 'Maddie', gifts: [], notes: '', assignedTo: null },
    { id: '12', name: 'Cole', gifts: [], notes: '', assignedTo: null },
    { id: '13', name: 'Gina', gifts: [], notes: '', assignedTo: null },
    { id: '14', name: 'Addyson', gifts: [], notes: '', assignedTo: null },
    { id: '15', name: 'Esme', gifts: [], notes: '', assignedTo: null },
    { id: '16', name: 'Atticus', gifts: [], notes: '', assignedTo: null },
    { id: '17', name: 'Eden', gifts: [], notes: '', assignedTo: null },
    { id: '18', name: 'Dax', gifts: [], notes: '', assignedTo: null },
    { id: '19', name: 'Nassy', gifts: [], notes: '', assignedTo: null },
    { id: '20', name: 'Pippa', gifts: [], notes: '', assignedTo: null },
    { id: '21', name: 'Hannah/Logan', gifts: [], notes: '', assignedTo: null },
    { id: '22', name: 'Lizzie', gifts: [], notes: '', assignedTo: null },
    { id: '23', name: 'Landon', gifts: [], notes: '', assignedTo: null },
    { id: '24', name: 'Work Team (Matt)', gifts: [], notes: '', assignedTo: null },
    { id: '25', name: 'Chras', gifts: [], notes: '', assignedTo: null }
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
      } else {
        setBuyers(parsed);
      }
    }
  }, []);

  // Load currency from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('christmas-gifts-currency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
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
    setNewPersonAssignment(null);
    setIsAddPersonOpen(false);
  };

  const addGift = (personId: string) => {
    if (!giftForm.name.trim()) return;
    
    const parsedCost = giftForm.cost.trim() === '' ? null : parseFloat(giftForm.cost);
    const cost = isNaN(parsedCost as number) ? null : parsedCost;
    
    const newGift: Gift = {
      id: Date.now().toString(),
      name: giftForm.name.trim(),
      cost,
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

  const quickAddGiftSubmit = (personId: string, name: string, cost: string) => {
    if (!name.trim()) return;
    
    const parsedCost = cost.trim() === '' ? null : parseFloat(cost);
    const finalCost = isNaN(parsedCost as number) ? null : parsedCost;
    
    const newGift: Gift = {
      id: Date.now().toString(),
      name: name.trim(),
      cost: finalCost,
      purchased: false,
      wrapped: false
    };
    
    setPeople(people.map(person => 
      person.id === personId 
        ? { ...person, gifts: [...person.gifts, newGift] }
        : person
    ));
    
    setQuickAddGift(null);
  };

  const deleteGift = (personId: string, giftId: string) => {
    setPeople(people.map(person => 
      person.id === personId 
        ? { ...person, gifts: person.gifts.filter(gift => gift.id !== giftId) }
        : person
    ));
    setDeletingGift(null);
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

  const updateGiftTracking = (personId: string, giftId: string, trackingNumber?: string, carrier?: string) => {
    setPeople(people.map(person => 
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.map(gift => 
              gift.id === giftId ? { 
                ...gift, 
                ...(trackingNumber !== undefined && { trackingNumber }),
                ...(carrier !== undefined && { carrier })
              } : gift
            )
          }
        : person
    ));
  };

  const updateGiftName = (personId: string, giftId: string, name: string) => {
    setPeople(people.map(person => 
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.map(gift => 
              gift.id === giftId ? { ...gift, name } : gift
            )
          }
        : person
    ));
  };

  const updateGiftCost = (personId: string, giftId: string, cost: number | null) => {
    setPeople(people.map(person => 
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.map(gift => 
              gift.id === giftId ? { ...gift, cost } : gift
            )
          }
        : person
    ));
  };

  const toggleTracking = (giftId: string) => {
    const newExpanded = new Set(expandedTracking);
    if (newExpanded.has(giftId)) {
      newExpanded.delete(giftId);
    } else {
      newExpanded.add(giftId);
    }
    setExpandedTracking(newExpanded);
  };

  const getTrackingUrl = (trackingNumber: string, carrier: string) => {
    const trackingUrls: { [key: string]: string } = {
      'UPS': `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`,
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      'Amazon': `https://track.amazon.com/tracking/${trackingNumber}`,
      'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`
    };
    return trackingUrls[carrier] || '#';
  };

  const updateNotes = (personId: string, notes: string) => {
    setPeople(people.map(person => 
      person.id === personId ? { ...person, notes } : person
    ));
  };


  const updateAssignment = (personId: string, assignedTo: string | null) => {
    setPeople(people.map(person => 
      person.id === personId ? { ...person, assignedTo } : person
    ));
  };

  const startEditingRecipient = (personId: string, field: 'assignment' | 'notes') => {
    const person = people.find(p => p.id === personId);
    if (!person) return;
    
    const value = field === 'assignment' ? (person.assignedTo || 'unassigned') : person.notes;
    setEditingRecipient({ personId, field, value });
  };

  const saveRecipientEdit = () => {
    if (!editingRecipient) return;
    
    const { personId, field, value } = editingRecipient;
    
    if (field === 'assignment') {
      const assignedTo = value === 'unassigned' ? null : value;
      updateAssignment(personId, assignedTo);
    } else if (field === 'notes') {
      updateNotes(personId, value);
    }
    
    setEditingRecipient(null);
  };

  const cancelRecipientEdit = () => {
    setEditingRecipient(null);
  };

  const handleCompletionChange = (person: Person, completed: boolean) => {
    if (!completed) {
      // If unchecking, directly update
      updateCompletion(person.id, false);
      return;
    }

    // If checking, check for incomplete gifts
    const incompleteGifts = person.gifts.filter(gift => !gift.purchased || !gift.wrapped);
    
    if (incompleteGifts.length === 0) {
      // All gifts are already complete, proceed normally
      updateCompletion(person.id, true);
      return;
    }

    // Show confirmation dialog for incomplete gifts
    const unpurchased = incompleteGifts.filter(gift => !gift.purchased).length;
    const unwrapped = incompleteGifts.filter(gift => !gift.wrapped).length;
    
    setCompletionDialog({
      isOpen: true,
      person,
      incompleteParts: { purchased: unpurchased, wrapped: unwrapped }
    });
  };

  const updateCompletion = (personId: string, completed: boolean) => {
    setPeople(people.map(person => 
      person.id === personId ? { ...person, completed } : person
    ));
  };

  const completeAllGifts = (person: Person) => {
    // Mark all gifts as purchased and wrapped
    const updatedPeople = people.map(p => 
      p.id === person.id 
        ? {
            ...p,
            gifts: p.gifts.map(gift => ({
              ...gift,
              purchased: true,
              wrapped: true
            })),
            completed: true
          }
        : p
    );
    
    setPeople(updatedPeople);
    setCompletionDialog({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } });
  };

  const cancelCompletion = () => {
    setCompletionDialog({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } });
  };

  const getTotalCost = (gifts: Gift[]) => {
    return gifts.reduce((total, gift) => total + (gift.cost || 0), 0);
  };

  const getGiftsWithoutCost = (gifts: Gift[]) => {
    return gifts.filter(gift => gift.cost === null).length;
  };

  const getCompletionStats = (person: Person) => {
    const purchased = person.gifts.filter(g => g.purchased).length;
    const wrapped = person.gifts.filter(g => g.wrapped).length;
    return { purchased, wrapped, total: person.gifts.length };
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

  // Sorting functions
  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (column: typeof sortConfig.key) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="w-4 h-4" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Filter helper functions
  const getActiveFilterCount = () => {
    let count = 0;
    if (buyers.length > 1 && filters.assignedTo !== 'all') count++;
    if (filters.completion !== 'all') count++;
    if (filters.wrapping !== 'all') count++;
    if (!filters.showCompleted) count++;
    return count;
  };

  const clearAllFilters = () => {
    setFilters({
      assignedTo: 'all',
      completion: 'all',
      wrapping: 'all',
      showCompleted: false
    });
  };

  // Filter people based on current filters
  const filteredPeople = people.filter(person => {
    // Filter by shopping completion status
    if (!filters.showCompleted && person.completed === true) return false;

    // Filter by assignment (only if there are multiple buyers)
    if (buyers.length > 1 && filters.assignedTo !== 'all') {
      if (filters.assignedTo === 'unassigned' && person.assignedTo !== null) return false;
      if (filters.assignedTo !== 'unassigned' && person.assignedTo !== filters.assignedTo) return false;
    }

    // Filter by completion
    if (filters.completion !== 'all') {
      const stats = getCompletionStats(person);
      const isCompleted = stats.total > 0 && stats.purchased === stats.total;
      if (filters.completion === 'completed' && !isCompleted) return false;
      if (filters.completion === 'incomplete' && isCompleted) return false;
    }

    // Filter by wrapping
    if (filters.wrapping !== 'all') {
      const stats = getCompletionStats(person);
      const needsWrapping = stats.total > 0 && stats.wrapped < stats.total;
      const allWrapped = stats.total > 0 && stats.wrapped === stats.total;
      
      if (filters.wrapping === 'needs-wrapping' && !needsWrapping) return false;
      if (filters.wrapping === 'all-wrapped' && !allWrapped) return false;
    }

    return true;
  });

  const sortedAndFilteredPeople = useMemo(() => {
    return [...filteredPeople].sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      switch (sortConfig.key) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'assignedTo':
          const aAssigned = a.assignedTo || 'Unassigned';
          const bAssigned = b.assignedTo || 'Unassigned';
          return direction * aAssigned.localeCompare(bAssigned);
        case 'totalCost':
          const aCost = getTotalCost(a.gifts);
          const bCost = getTotalCost(b.gifts);
          return direction * (aCost - bCost);
        case 'progress':
          const aStats = getCompletionStats(a);
          const bStats = getCompletionStats(b);
          const aProgress = aStats.total > 0 ? aStats.purchased / aStats.total : 0;
          const bProgress = bStats.total > 0 ? bStats.purchased / bStats.total : 0;
          return direction * (aProgress - bProgress);
        default:
          return 0;
      }
    });
  }, [filteredPeople, sortConfig]);

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
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="min-h-[44px] sm:min-h-auto"
            >
              <Home className="w-4 h-4 mr-2" />
              Summary
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              className="min-h-[44px] sm:min-h-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

          {/* Controls */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mb-6">
          {/* Add Person Button */}
          <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-festive hover:opacity-90 text-white shadow-festive w-full sm:w-auto min-h-[44px] sm:min-h-auto">
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
                {buyers.length > 1 && (
                    <Select value={newPersonAssignment || ''} onValueChange={(value: string) => setNewPersonAssignment(value === 'unassigned' ? null : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned"></SelectItem>
                        {buyers.map(buyer => (
                          <SelectItem key={buyer.id} value={buyer.name}>{buyer.emoji} {buyer.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                )}
                <Button onClick={addPerson} className="w-full min-h-[44px] sm:min-h-auto">
                  Add Person
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Filter Controls */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative w-full sm:w-auto min-h-[44px] sm:min-h-auto">
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {getActiveFilterCount() > 0 && (
                    <Button 
                      variant="ghost" 
                      onClick={clearAllFilters}
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>

                {buyers.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assignment</label>
                    <Select value={filters.assignedTo} onValueChange={(value: any) => setFilters(prev => ({ ...prev, assignedTo: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All assignments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All assignments</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {buyers.map(buyer => (
                          <SelectItem key={buyer.id} value={buyer.name}>{buyer.emoji} {buyer.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Completion Status</label>
                  <Select value={filters.completion} onValueChange={(value: any) => setFilters(prev => ({ ...prev, completion: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="incomplete">Incomplete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Wrapping Status</label>
                  <Select value={filters.wrapping} onValueChange={(value: any) => setFilters(prev => ({ ...prev, wrapping: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All wrapping</SelectItem>
                      <SelectItem value="needs-wrapping">Needs wrapping</SelectItem>
                      <SelectItem value="all-wrapped">All wrapped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                 <div className="flex items-center space-x-2">
                   <Checkbox
                     id="showCompleted"
                     checked={filters.showCompleted}
                     onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showCompleted: !!checked }))}
                     className="touch-target"
                   />
                   <label htmlFor="showCompleted" className="text-sm font-medium cursor-pointer touch-target">
                     Show completed recipients
                   </label>
                 </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] sm:w-[60px]">
                  <span className="sr-only">Expand</span>
                </TableHead>
                <TableHead className="min-w-[120px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-auto p-0 font-semibold hover:bg-transparent text-left"
                  >
                    <span className="hidden sm:inline">Name</span>
                    <span className="sm:hidden">Person</span>
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                {buyers.length > 1 && (
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('assignedTo')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Assigned To {getSortIcon('assignedTo')}
                    </Button>
                  </TableHead>
                )}
                <TableHead className="hidden sm:table-cell min-w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('totalCost')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Total Cost {getSortIcon('totalCost')}
                  </Button>
                </TableHead>
                <TableHead className="min-w-[80px]">
                  <span className="font-semibold hidden sm:inline">Progress</span>
                  <span className="font-semibold sm:hidden">Status</span>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <span className="font-semibold">Notes</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredPeople.map((person) => {
                const stats = getCompletionStats(person);
                const isExpanded = expandedRows.has(person.id);
                
                return (
                  <React.Fragment key={person.id}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => toggleRow(person.id)}
                             className="p-1 touch-target quick-action-btn"
                           >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   onClick={() => handleCompletionChange(person, !person.completed)}
                                   className={`h-8 w-8 touch-target quick-action-btn ${person.completed 
                                     ? "text-christmas-green hover:text-christmas-green/80" 
                                     : "text-muted-foreground hover:text-foreground"
                                   }`}
                                 >
                                  {person.completed ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {person.completed ? "Mark as Incomplete" : "Mark as Complete"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                       <TableCell className="font-medium p-2 sm:p-4">
                         <div className="space-y-1">
                           <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-2">
                               <span className={`text-sm sm:text-base ${person.completed ? "line-through text-muted-foreground" : ""}`}>
                                 {person.name}
                               </span>
                               {person.completed && <CheckCircle className="w-4 h-4 text-christmas-green flex-shrink-0" />}
                             </div>
                             {/* Quick Add Gift Button */}
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => setQuickAddGift({ personId: person.id, isOpen: true })}
                                     className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                   >
                                     <PlusCircle className="w-4 h-4" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   Quick Add Gift
                                 </TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                           </div>
                           {/* Mobile-only assignment display */}
                           {buyers.length > 1 && (
                             <div className="md:hidden text-xs text-muted-foreground flex items-center gap-1">
                               {person.assignedTo ? (
                                 <span 
                                   className="text-lg" 
                                   title={`Assigned to ${person.assignedTo}`}
                                 >
                                   {buyers.find(b => b.name === person.assignedTo)?.emoji || '?'}
                                 </span>
                               ) : (
                                 'Unassigned'
                               )}
                             </div>
                           )}
                          {/* Mobile-only cost display */}
                          <div className="sm:hidden text-xs text-muted-foreground">
                            {formatCurrency(getTotalCost(person.gifts), currency)}
                          </div>
                        </div>
                      </TableCell>
                      {buyers.length > 1 && (
                        <TableCell className="hidden md:table-cell p-2 sm:p-4">
                          <Select 
                            value={person.assignedTo || "unassigned"} 
                            onValueChange={(value) => updateAssignment(person.id, value === "unassigned" ? null : value)}
                          >
                            <SelectTrigger className="w-full min-w-[140px]">
                              <SelectValue placeholder="Assign to..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {buyers.map((buyer) => (
                                <SelectItem key={buyer.id} value={buyer.name}>
                                  {buyer.emoji} {buyer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      <TableCell className="hidden sm:table-cell p-2 sm:p-4">
                        <div className="font-medium">
                          {formatCurrency(getTotalCost(person.gifts), currency)}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              <span className="hidden sm:inline">Purchased: </span>
                              <span className="sm:hidden">🛒 </span>
                              {stats.purchased}/{stats.total}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <span className="hidden sm:inline">Wrapped: </span>
                              <span className="sm:hidden">🎁 </span>
                              {stats.wrapped}/{stats.total}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-2 sm:p-4">
                        <div className="max-w-[200px]">
                          <Textarea
                            placeholder="Add notes..."
                            value={person.notes}
                            onChange={(e) => updateNotes(person.id, e.target.value)}
                            className="min-h-[60px] text-sm resize-none"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    
                      {/* Expanded row content */}
                     {isExpanded && (
                       <TableRow>
                         <TableCell colSpan={6} className="bg-muted/30 p-2 sm:p-4 smooth-accordion">
                          <div className="space-y-6">
                            {/* Recipient Information Section */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                <Gift className="w-4 h-4 text-primary" />
                                <h3 className="font-semibold text-base">Recipient Information</h3>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Assignment */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Assigned to:</span>
                                    {editingRecipient?.personId === person.id && editingRecipient.field === 'assignment' ? (
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={saveRecipientEdit}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Save className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={cancelRecipientEdit}
                                          className="h-6 w-6 p-0"
                                        >
                                          <XCircle className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditingRecipient(person.id, 'assignment')}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {editingRecipient?.personId === person.id && editingRecipient.field === 'assignment' ? (
                                    <Select
                                      value={editingRecipient.value}
                                      onValueChange={(value) => setEditingRecipient({ ...editingRecipient, value })}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {buyers.map(buyer => (
                                          <SelectItem key={buyer.id} value={buyer.name}>
                                            {buyer.emoji} {buyer.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div className="text-sm">
                                       {person.assignedTo ? (
                                         <span className="flex items-center gap-2">
                                           {buyers.find(b => b.name === person.assignedTo)?.emoji || '?'} 
                                           {person.assignedTo}
                                         </span>
                                      ) : (
                                        <span className="text-muted-foreground">Unassigned</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Notes:</span>
                                    {editingRecipient?.personId === person.id && editingRecipient.field === 'notes' ? (
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={saveRecipientEdit}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Save className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={cancelRecipientEdit}
                                          className="h-6 w-6 p-0"
                                        >
                                          <XCircle className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEditingRecipient(person.id, 'notes')}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {editingRecipient?.personId === person.id && editingRecipient.field === 'notes' ? (
                                    <Textarea
                                      value={editingRecipient.value}
                                      onChange={(e) => setEditingRecipient({ ...editingRecipient, value: e.target.value })}
                                      placeholder="Add notes about this person..."
                                      className="min-h-[80px]"
                                    />
                                  ) : (
                                    <div className="text-sm min-h-[80px]">
                                      {person.notes ? (
                                        <p className="whitespace-pre-wrap">{person.notes}</p>
                                      ) : (
                                        <span className="text-muted-foreground italic">No notes</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Summary Stats */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                                <div className="text-center">
                                  <div className="text-lg font-semibold">{person.gifts.length}</div>
                                  <div className="text-xs text-muted-foreground">Gifts</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold">{formatCurrency(getTotalCost(person.gifts), currency)}</div>
                                  <div className="text-xs text-muted-foreground">Total Cost</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold">{getCompletionStats(person).purchased}/{person.gifts.length}</div>
                                  <div className="text-xs text-muted-foreground">Purchased</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold">{getCompletionStats(person).wrapped}/{person.gifts.length}</div>
                                  <div className="text-xs text-muted-foreground">Wrapped</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Gift List */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                  <Package className="w-4 h-4 text-primary" />
                                  <h3 className="font-semibold text-base">Gifts</h3>
                                </div>
                                <Button
                                  onClick={() => setEditingGift({ personId: person.id })}
                                  size="sm"
                                  variant="outline"
                                  className="gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Gift
                                </Button>
                              </div>
                              <div className="space-y-3">
                              {person.gifts.map((gift) => {
                                const assignedBuyer = buyers.find(buyer => buyer.name === (gift.assignedTo || person.assignedTo));
                                const hasNotes = gift.trackingNumber || gift.carrier;
                                
                                return (
                                  <div 
                                    key={gift.id} 
                                    className={`border rounded-lg p-4 bg-card transition-all duration-200 ${
                                      gift.purchased && gift.wrapped ? 'opacity-75 bg-success/5 border-success/20' : ''
                                    }`}
                                  >
                                    {/* Gift Header */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-2 flex-1">
                                        {/* Status Icons */}
                                        <div className="flex items-center gap-1">
                                          {gift.purchased ? (
                                            <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                                              <CheckCircle className="w-3 h-3 text-success" />
                                            </div>
                                          ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-muted flex items-center justify-center">
                                              <Circle className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                          )}
                                          
                                          {gift.wrapped && (
                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center ml-1">
                                              <Gift className="w-3 h-3 text-primary" />
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Gift Name */}
                                        <span className={`font-medium ${
                                          gift.purchased && gift.wrapped ? 'line-through text-muted-foreground' : ''
                                        }`}>
                                          {gift.name}
                                        </span>
                                        
                                        {/* Indicators */}
                                        <div className="flex items-center gap-1">
                                          {hasNotes && (
                                            <div title="Has tracking info">
                                              <Package className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                          )}
                                          {gift.cost === null && (
                                            <div title="Cost not set">
                                              <AlertCircle className="w-3 h-3 text-amber-500" />
                                            </div>
                                          )}
                                           {assignedBuyer && assignedBuyer.emoji && buyers.length > 1 && (
                                             <div 
                                               title={`Assigned to ${assignedBuyer.name}`}
                                               className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-xs"
                                             >
                                               {assignedBuyer.emoji}
                                             </div>
                                           )}
                                        </div>
                                      </div>
                                      
                                      {/* Cost and Actions */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-primary">
                                          {gift.cost === null ? 'TBD' : formatCurrency(gift.cost, currency)}
                                        </span>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive touch-target"
                                              onClick={() => setDeletingGift({ personId: person.id, giftId: gift.id, giftName: gift.name })}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Gift</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to delete "{gift.name}"? This action cannot be undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel onClick={() => setDeletingGift(null)}>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => deleteGift(person.id, gift.id)}>
                                                Delete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                    
                                    {/* Status Controls */}
                                    <div className="flex items-center gap-6">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => updateGiftStatus(person.id, gift.id, 'purchased', !gift.purchased)}
                                        className={`flex items-center gap-2 p-2 rounded-lg transition-all touch-target ${
                                          gift.purchased 
                                            ? 'bg-success/10 text-success hover:bg-success/20' 
                                            : 'hover:bg-muted/50 text-muted-foreground'
                                        }`}
                                      >
                                        {gift.purchased ? '✅' : '🛒'}
                                        <span className="text-sm font-medium">
                                          {gift.purchased ? 'Purchased' : 'Not Purchased'}
                                        </span>
                                      </Button>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => updateGiftStatus(person.id, gift.id, 'wrapped', !gift.wrapped)}
                                        className={`flex items-center gap-2 p-2 rounded-lg transition-all touch-target ${
                                          gift.wrapped 
                                            ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                            : 'hover:bg-muted/50 text-muted-foreground'
                                        }`}
                                      >
                                        {gift.wrapped ? '🎁' : '📦'}
                                        <span className="text-sm font-medium">
                                          {gift.wrapped ? 'Wrapped' : 'Not Wrapped'}
                                        </span>
                                      </Button>
                                    </div>

                                    {/* Tracking Section - Only show if purchased */}
                                    {gift.purchased && (
                                      <div className="mt-3 pt-3 border-t border-muted">
                                        <Collapsible
                                          open={expandedTracking.has(gift.id)}
                                          onOpenChange={() => toggleTracking(gift.id)}
                                        >
                                          <CollapsibleTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                                            >
                                              <Package className="w-3 h-3 mr-1" />
                                              Tracking Info
                                              {expandedTracking.has(gift.id) ? 
                                                <ChevronDown className="w-3 h-3 ml-1" /> : 
                                                <ChevronRight className="w-3 h-3 ml-1" />
                                              }
                                            </Button>
                                          </CollapsibleTrigger>
                                          <CollapsibleContent className="mt-2">
                                            <div className="space-y-2 pl-4">
                                              <div className="flex gap-2">
                                                 <Select 
                                                   value={gift.carrier || 'none'} 
                                                   onValueChange={(value) => updateGiftTracking(person.id, gift.id, undefined, value === 'none' ? undefined : value)}
                                                 >
                                                   <SelectTrigger className="w-24 h-8 text-xs">
                                                     <SelectValue placeholder="Carrier" />
                                                   </SelectTrigger>
                                                   <SelectContent>
                                                     <SelectItem value="none">None</SelectItem>
                                                     <SelectItem value="UPS">UPS</SelectItem>
                                                     <SelectItem value="FedEx">FedEx</SelectItem>
                                                     <SelectItem value="USPS">USPS</SelectItem>
                                                     <SelectItem value="Amazon">Amazon</SelectItem>
                                                     <SelectItem value="DHL">DHL</SelectItem>
                                                     <SelectItem value="Other">Other</SelectItem>
                                                   </SelectContent>
                                                 </Select>
                                                <Input
                                                  placeholder="Tracking number"
                                                  value={gift.trackingNumber || ''}
                                                  onChange={(e) => updateGiftTracking(person.id, gift.id, e.target.value)}
                                                  className="h-8 text-xs flex-1"
                                                />
                                                {gift.carrier && gift.trackingNumber && gift.carrier !== 'Other' && (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-2"
                                                    onClick={() => window.open(getTrackingUrl(gift.carrier!, gift.trackingNumber!), '_blank')}
                                                  >
                                                    <ExternalLink className="w-3 h-3" />
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          </CollapsibleContent>
                                        </Collapsible>
                                      </div>
                                    )}
                                   </div>
                                 );
                               })}
                             </div>

                             {/* Add Gift */}
                            {editingGift?.personId === person.id ? (
                               <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                                 <Input
                                   placeholder="Gift name"
                                   value={giftForm.name}
                                   onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                                   onKeyPress={(e) => e.key === 'Enter' && document.getElementById('cost-input')?.focus()}
                                 />
                                 <Input
                                   id="cost-input"
                                   type="number"
                                   placeholder="Cost (leave blank if unknown)"
                                   value={giftForm.cost}
                                   onChange={(e) => setGiftForm({ ...giftForm, cost: e.target.value })}
                                   onKeyPress={(e) => e.key === 'Enter' && addGift(person.id)}
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
        {sortedAndFilteredPeople.length === 0 && people.length > 0 && (
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
              className="bg-gradient-festive hover:opacity-90 text-white min-h-[44px] sm:min-h-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Person
            </Button>
          </div>
        )}

        {/* Quick Add Gift Sheet */}
        <Sheet open={quickAddGift?.isOpen || false} onOpenChange={(open) => !open && setQuickAddGift(null)}>
          <SheetContent side="bottom" className="h-[300px] sm:h-auto">
            <SheetHeader>
              <SheetTitle>
                Add Gift for {quickAddGift ? people.find(p => p.id === quickAddGift.personId)?.name : ''}
              </SheetTitle>
            </SheetHeader>
            <QuickAddGiftForm 
              personId={quickAddGift?.personId || ''}
              onSubmit={quickAddGiftSubmit}
              onCancel={() => setQuickAddGift(null)}
              currency={currency}
            />
          </SheetContent>
        </Sheet>

        {/* Completion Confirmation Dialog */}
        <AlertDialog open={completionDialog.isOpen} onOpenChange={(open) => !open && cancelCompletion()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Shopping for {completionDialog.person?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                {completionDialog.person && (() => {
                  const { purchased, wrapped } = completionDialog.incompleteParts;
                  let message = `${completionDialog.person.name} has `;
                  
                  if (purchased > 0 && wrapped > 0) {
                    message += `${purchased} unpurchased gift${purchased > 1 ? 's' : ''} and ${wrapped} unwrapped gift${wrapped > 1 ? 's' : ''}. `;
                    message += "Marking them as complete will automatically mark all their gifts as purchased and wrapped.";
                  } else if (purchased > 0) {
                    message += `${purchased} unpurchased gift${purchased > 1 ? 's' : ''}. `;
                    message += "Marking them as complete will automatically mark all their gifts as purchased.";
                  } else if (wrapped > 0) {
                    message += `${wrapped} unwrapped gift${wrapped > 1 ? 's' : ''}. `;
                    message += "Marking them as complete will automatically mark all their gifts as wrapped.";
                  }
                  
                  return message;
                })()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelCompletion}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => completionDialog.person && completeAllGifts(completionDialog.person)}>
                Complete Shopping
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// Quick Add Gift Form Component
const QuickAddGiftForm = ({ personId, onSubmit, onCancel, currency }: {
  personId: string;
  onSubmit: (personId: string, name: string, cost: string) => void;
  onCancel: () => void;
  currency: string;
}) => {
  const [giftName, setGiftName] = useState('');
  const [giftCost, setGiftCost] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (giftName.trim()) {
      onSubmit(personId, giftName, giftCost);
      setGiftName('');
      setGiftCost('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <label htmlFor="giftName" className="text-sm font-medium">
          Gift Name
        </label>
        <Input
          id="giftName"
          placeholder="Enter gift name..."
          value={giftName}
          onChange={(e) => setGiftName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="touch-target"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="giftCost" className="text-sm font-medium">
          Cost ({currency}) - Optional
        </label>
        <Input
          id="giftCost"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={giftCost}
          onChange={(e) => setGiftCost(e.target.value)}
          onKeyDown={handleKeyDown}
          className="touch-target"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button 
          type="submit" 
          className="flex-1 touch-target quick-action-btn"
          disabled={!giftName.trim()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Gift
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="touch-target quick-action-btn"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default GiftTracker;
