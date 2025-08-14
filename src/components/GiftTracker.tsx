import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Gift, DollarSign, ChevronDown, ChevronRight, Filter, Settings, Package, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, X, Trash2, Home, AlertCircle, CheckCircle, Circle, PlusCircle, Edit2, Save, XCircle } from 'lucide-react';
import FloatingActionButton from './FloatingActionButton';
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
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
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

  const handleCompletionChange = (person: Person, completed: boolean) => {
    if (!completed) {
      // If unchecking, directly update
      updateCompletion(person.id, false);
      return;
    }

    // If checking, directly update without dialog for now
    updateCompletion(person.id, true);
  };

  const updateCompletion = (personId: string, completed: boolean) => {
    setPeople(people.map(person => 
      person.id === personId ? { ...person, completed } : person
    ));
  };

  const getTotalCost = (gifts: Gift[]) => {
    return gifts.reduce((total, gift) => total + (gift.cost || 0), 0);
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
    if (!filters.showCompleted && person.completed === true) return false;
    
    if (buyers.length > 1 && filters.assignedTo !== 'all') {
      if (filters.assignedTo === 'unassigned' && person.assignedTo !== null) return false;
      if (filters.assignedTo !== 'unassigned' && person.assignedTo !== filters.assignedTo) return false;
    }

    if (filters.completion !== 'all') {
      const stats = getCompletionStats(person);
      const isCompleted = stats.total > 0 && stats.purchased === stats.total;
      if (filters.completion === 'completed' && !isCompleted) return false;
      if (filters.completion === 'incomplete' && isCompleted) return false;
    }

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
    <div className="p-4 sm:p-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
                <Gift className="h-5 w-5 text-christmas-red" />
                Gift Tracker
              </h1>
              <p className="text-sm text-muted-foreground">Manage holiday gifts</p>
            </div>
          </div>

          {/* Compact Controls Toolbar */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Filter Controls */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="relative h-9">
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
                </div>
              </PopoverContent>
            </Popover>
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
                onKeyPress={(e) => e.key === 'Enter' && addPerson()}
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
              <Button onClick={addPerson} className="w-full">
                Add Person
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating Action Button */}
        <FloatingActionButton onClick={() => setIsAddPersonOpen(true)} />

        {/* Compact Table */}
        <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b">
                <TableHead className="w-10 p-2">
                  <span className="sr-only">Expand</span>
                </TableHead>
                <TableHead className="font-semibold text-left p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-auto p-0 font-semibold hover:bg-transparent text-left -ml-1"
                  >
                    Name {getSortIcon('name')}
                  </Button>
                </TableHead>
                {buyers.length > 1 && (
                  <TableHead className="hidden md:table-cell font-semibold p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('assignedTo')}
                      className="h-auto p-0 font-semibold hover:bg-transparent -ml-1"
                    >
                      Assignment {getSortIcon('assignedTo')}
                    </Button>
                  </TableHead>
                )}
                <TableHead className="hidden sm:table-cell font-semibold p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('totalCost')}
                    className="h-auto p-0 font-semibold hover:bg-transparent -ml-1"
                  >
                    Cost {getSortIcon('totalCost')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold p-3 text-center">
                  Progress
                </TableHead>
                <TableHead className="w-12 p-2">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredPeople.map((person) => {
                const stats = getCompletionStats(person);
                const isExpanded = expandedRows.has(person.id);
                const progressPercent = stats.total > 0 ? (stats.purchased / stats.total) * 100 : 0;
                
                return (
                  <React.Fragment key={person.id}>
                    <TableRow className={`hover:bg-muted/50 border-b border-border/50 ${person.completed ? 'bg-accent/20' : ''}`}>
                      <TableCell className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(person.id)}
                          className="p-1 h-6 w-6"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCompletionChange(person, !person.completed)}
                                  className={`h-5 w-5 p-0 ${person.completed 
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
                          <span className={`font-semibold text-base ${person.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {person.name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {stats.total} gifts • {stats.purchased} purchased • {stats.wrapped} wrapped
                        </div>
                      </TableCell>
                      {buyers.length > 1 && (
                        <TableCell className="hidden md:table-cell p-3">
                          <span className="text-sm">
                            {person.assignedTo ? 
                              buyers.find(b => b.name === person.assignedTo)?.emoji + ' ' + person.assignedTo 
                              : 'Unassigned'
                            }
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="hidden sm:table-cell p-3">
                        <span className="font-medium">{formatCurrency(getTotalCost(person.gifts), currency)}</span>
                      </TableCell>
                      <TableCell className="p-3 text-center">
                        <div className="w-full max-w-20">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all" 
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {Math.round(progressPercent)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuickAddGift({ personId: person.id, isOpen: true })}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Gift Details */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={buyers.length > 1 ? 6 : 5} className="p-0">
                          <div className="bg-muted/20 p-4 border-t">
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Gifts for {person.name}</h4>
                              {person.gifts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No gifts added yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {person.gifts.map((gift) => (
                                    <div key={gift.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                      <div className="flex items-center gap-3">
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => updateGiftStatus(person.id, gift.id, 'purchased', !gift.purchased)}
                                            className={`h-6 w-6 p-0 ${gift.purchased ? 'text-christmas-green' : 'text-muted-foreground'}`}
                                          >
                                            {gift.purchased ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => updateGiftStatus(person.id, gift.id, 'wrapped', !gift.wrapped)}
                                            className={`h-6 w-6 p-0 ${gift.wrapped ? 'text-christmas-red' : 'text-muted-foreground'}`}
                                          >
                                            <Package className="w-4 h-4" />
                                          </Button>
                                        </div>
                                        <div>
                                          <span className={`text-sm font-medium ${gift.purchased ? 'line-through text-muted-foreground' : ''}`}>
                                            {gift.name}
                                          </span>
                                          {gift.cost !== null && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                              {formatCurrency(gift.cost, currency)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
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

        {/* Quick Add Gift Sheet */}
        {quickAddGift && (
          <Sheet open={quickAddGift.isOpen} onOpenChange={(open) => !open && setQuickAddGift(null)}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Quick Add Gift</SheetTitle>
              </SheetHeader>
              <QuickAddGiftForm
                personId={quickAddGift.personId}
                onSubmit={(name, cost) => {
                  const person = people.find(p => p.id === quickAddGift.personId);
                  if (person) {
                    const parsedCost = cost.trim() === '' ? null : parseFloat(cost);
                    const finalCost = isNaN(parsedCost as number) ? null : parsedCost;
                    
                    const newGift: Gift = {
                      id: Date.now().toString(),
                      name: name.trim(),
                      cost: finalCost,
                      purchased: false,
                      wrapped: false
                    };
                    
                    setPeople(people.map(p => 
                      p.id === quickAddGift.personId 
                        ? { ...p, gifts: [...p.gifts, newGift] }
                        : p
                    ));
                  }
                  setQuickAddGift(null);
                }}
                onCancel={() => setQuickAddGift(null)}
                currency={currency}
              />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
};

// Quick Add Gift Form Component
const QuickAddGiftForm: React.FC<{
  personId: string;
  onSubmit: (name: string, cost: string) => void;
  onCancel: () => void;
  currency: string;
}> = ({ onSubmit, onCancel, currency }) => {
  const [giftName, setGiftName] = useState('');
  const [giftCost, setGiftCost] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (giftName.trim()) {
      onSubmit(giftName, giftCost);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <label htmlFor="giftName" className="text-sm font-medium">
          Gift Name *
        </label>
        <Input
          id="giftName"
          placeholder="Enter gift name"
          value={giftName}
          onChange={(e) => setGiftName(e.target.value)}
          onKeyDown={handleKeyDown}
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
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button 
          type="submit" 
          className="flex-1"
          disabled={!giftName.trim()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Gift
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default GiftTracker;
