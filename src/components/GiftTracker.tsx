import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Gift, DollarSign, ChevronDown, ChevronRight, Filter, Settings, Package, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, X, Trash2, Home, AlertCircle, CheckCircle, Circle, PlusCircle, Edit2, Save, XCircle, Search, ShoppingCart, Clock, Users, Check } from 'lucide-react';
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
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { GiftForm } from './GiftForm';

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
  url?: string;
  tracking?: string;
  assignedTo?: string;
}

interface Person {
  id: string;
  name: string;
  gifts: Gift[];
  notes: string;
  assignedTo: string | null;
  completed?: boolean;
  manualComplete?: boolean;
}

const GiftTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const haptic = useHapticFeedback();
  const [people, setPeople] = useState<Person[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([
    { id: '1', name: 'Matt', emoji: '👨' },
    { id: '2', name: 'Maddie', emoji: '👩' }
  ]);
  const [currency, setCurrency] = useState('$');
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonAssignment, setNewPersonAssignment] = useState<string | null>(null);
  const [editingGift, setEditingGift] = useState<{ personId: string; giftId?: string; gift?: Gift } | null>(null);
  const [giftForm, setGiftForm] = useState({ name: '', cost: '' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedTracking, setExpandedTracking] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    assignedTo: 'all' as string,
    completion: 'all' as 'all' | 'completed' | 'incomplete',
    wrapping: 'all' as 'all' | 'needs-wrapping' | 'all-wrapped',
    showCompleted: false,
    hasGifts: 'all' as 'all' | 'with-gifts' | 'no-gifts'
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
  
  const [editingRecipient, setEditingRecipient] = useState<{
    personId: string;
    field: 'assignment' | 'notes';
    value: string;
  } | null>(null);
  const [lastExpandedRow, setLastExpandedRow] = useState<string | null>(null);
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCompletionToggle, setPendingCompletionToggle] = useState<{ person: Person; newState: boolean } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

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
    setUnsavedChanges(false);
    
    // Show success toast
    toast({
      title: "Recipient added!",
      description: `${newPersonName.trim()} has been added to your list.`,
    });
    
    // Highlight the new person
    const highlightId = `person-${newPerson.id}`;
    setHighlightedItems(new Set([highlightId]));
    setTimeout(() => setHighlightedItems(new Set()), 3000);
  };

  const addGift = (personId: string, giftData: { name: string; cost: string }) => {
    if (!giftData.name.trim()) return;
    
    const parsedCost = giftData.cost.trim() === '' ? null : parseFloat(giftData.cost);
    const cost = isNaN(parsedCost as number) ? null : parsedCost;
    
    const newGift: Gift = {
      id: Date.now().toString(),
      name: giftData.name.trim(),
      cost,
      purchased: false,
      wrapped: false,
      url: '',
      tracking: '',
      assignedTo: ''
    };

    // Check if person was manually marked done
    const person = people.find(p => p.id === personId);
    const wasManuallyComplete = person?.completed && person?.manualComplete;
    
    setPeople(people.map(person => 
      person.id === personId 
        ? { 
            ...person, 
            gifts: [...person.gifts, newGift],
            // Auto-unset completion if they were manually marked done
            completed: wasManuallyComplete ? false : person.completed,
            manualComplete: wasManuallyComplete ? false : person.manualComplete
          }
        : person
    ));
    
    setEditingGift(null);
    setUnsavedChanges(false);
    
    // Show success toast with auto-unset message if applicable
    if (wasManuallyComplete) {
      toast({
        title: "Gift added!",
        description: `Added gift - ${person?.name} unmarked as done.`,
      });
    } else {
      toast({
        title: "Gift added!",
        description: `${giftData.name.trim()} has been added to the list.`,
      });
    }
    
    // Highlight the new gift
    const highlightId = `gift-${newGift.id}`;
    setHighlightedItems(new Set([highlightId]));
    setTimeout(() => setHighlightedItems(new Set()), 3000);
  };

  const updateGift = (personId: string, giftId: string, giftData: { name: string; cost: string }) => {
    if (!giftData.name.trim()) return;
    
    const parsedCost = giftData.cost.trim() === '' ? null : parseFloat(giftData.cost);
    const cost = isNaN(parsedCost as number) ? null : parsedCost;
    
    setPeople(people.map(person => 
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.map(gift => 
              gift.id === giftId 
                ? { ...gift, name: giftData.name.trim(), cost }
                : gift
            )
          }
        : person
    ));
    
    setEditingGift(null);
    setUnsavedChanges(false);
    
    // Show success toast
    toast({
      title: "Gift updated!",
      description: `${giftData.name.trim()} has been updated.`,
    });
    
    // Highlight the updated gift
    const highlightId = `gift-${giftId}`;
    setHighlightedItems(new Set([highlightId]));
    setTimeout(() => setHighlightedItems(new Set()), 3000);
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
    
    // Show status update toast
    const action = value ? (field === 'purchased' ? 'marked as purchased' : 'marked as wrapped') 
                         : (field === 'purchased' ? 'unmarked as purchased' : 'unmarked as wrapped');
    toast({
      title: "Status updated",
      description: `Gift ${action}.`,
    });
    
    // Check for auto-completion after gift status changes
    checkAndUpdateAutoCompletion(personId);
  };

  // Check if person should be auto-completed
  const isAutoComplete = (person: Person) => {
    return person.gifts.length > 0 && 
           person.gifts.every(gift => gift.purchased && gift.wrapped);
  };

  // Auto-completion check after gift status changes
  const checkAndUpdateAutoCompletion = (personId: string) => {
    setPeople(prevPeople => 
      prevPeople.map(person => {
        if (person.id === personId && !person.manualComplete) {
          const shouldBeComplete = isAutoComplete(person);
          if (shouldBeComplete !== person.completed) {
            return { ...person, completed: shouldBeComplete };
          }
        }
        return person;
      })
    );
  };

  // Check if person has incomplete gifts
  const hasIncompleteGifts = (person: Person) => {
    return person.gifts.some(gift => !gift.purchased || !gift.wrapped);
  };

  const handleManualComplete = (person: Person) => {
    const newState = !person.completed;
    
    if (newState && hasIncompleteGifts(person)) {
      // Show confirmation dialog for incomplete gifts
      setPendingCompletionToggle({ person, newState });
      setShowConfirmDialog(true);
    } else {
      // Direct toggle
      confirmManualComplete(person, newState);
    }
  };

  const confirmManualComplete = (person: Person, completed: boolean) => {
    setPeople(prevPeople =>
      prevPeople.map(p =>
        p.id === person.id
          ? { ...p, completed, manualComplete: true }
          : p
      )
    );
    
    const incompleteGiftsNote = completed && hasIncompleteGifts(person) ? " (with incomplete gifts)" : "";
    
    toast({
      title: `Marked ${person.name} as ${completed ? "done" : "not done"}.`,
      description: completed 
        ? `${person.name} marked as done${incompleteGiftsNote}.`
        : `${person.name} unmarked as done.`,
    });
  };

  const handleCompletionChange = (person: Person, completed: boolean) => {
    // Legacy function for context menu - redirect to new manual complete
    handleManualComplete(person);
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
    const isCurrentlyExpanded = newExpanded.has(personId);
    
    // Close any open notes editing when expanding a different row
    if (!isCurrentlyExpanded && editingNotes !== personId) {
      setEditingNotes(null);
    }
    
    if (isCurrentlyExpanded) {
      // Collapsing: remove from expanded and scroll to person
      newExpanded.delete(personId);
      setLastExpandedRow(null);
      
      // Scroll back to the person's row
      setTimeout(() => {
        const personElement = document.querySelector(`[data-person-id="${personId}"]`);
        if (personElement) {
          personElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      // Expanding: accordion mode - close previously expanded row
      if (lastExpandedRow && newExpanded.has(lastExpandedRow)) {
        newExpanded.delete(lastExpandedRow);
      }
      newExpanded.add(personId);
      setLastExpandedRow(personId);
    }
    
    setExpandedRows(newExpanded);
  };

  const handleNotesEditStart = (personId: string) => {
    // Close any other notes editing and row expansion
    setEditingNotes(personId);
    // Optionally close expanded rows when editing notes
    // setExpandedRows(new Set());
    // setLastExpandedRow(null);
  };

  const handleNotesEditEnd = () => {
    setEditingNotes(null);
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

  // Letter navigation
  const scrollToLetter = (letter: string) => {
    const personIndex = sortedAndFilteredPeople.findIndex(person => 
      person.name.charAt(0).toUpperCase() === letter
    );
    if (personIndex !== -1 && tableRef.current) {
      const tableRows = tableRef.current.querySelectorAll('tbody tr[data-person-id]');
      const targetRow = tableRows[personIndex];
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Enhanced gift management functions
  const deleteGift = (personId: string, giftId: string) => {
    const giftName = people.find(p => p.id === personId)?.gifts.find(g => g.id === giftId)?.name || 'Gift';
    
    setPeople(people.map(person => 
      person.id === personId 
        ? { ...person, gifts: person.gifts.filter(gift => gift.id !== giftId) }
        : person
    ));
    
    // Show deletion toast
    toast({
      title: "Gift deleted",
      description: `${giftName} has been removed from the list.`,
    });
  };

  const duplicateGift = (personId: string, gift: Gift) => {
    const newGift: Gift = {
      ...gift,
      id: Date.now().toString(),
      name: gift.name + ' (Copy)',
      purchased: false,
      wrapped: false
    };
    
    setPeople(people.map(person => 
      person.id === personId 
        ? { ...person, gifts: [...person.gifts, newGift] }
        : person
    ));
  };

  const markAllPurchased = (personId: string) => {
    const person = people.find(p => p.id === personId);
    const unpurchasedCount = person?.gifts.filter(g => !g.purchased).length || 0;
    
    setPeople(people.map(person => 
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.map(gift => ({ ...gift, purchased: true }))
          }
        : person
    ));
    
    if (unpurchasedCount > 0) {
      toast({
        title: "All gifts marked as purchased",
        description: `${unpurchasedCount} gift${unpurchasedCount === 1 ? '' : 's'} marked as purchased.`,
      });
    }
  };

  const markAllWrapped = (personId: string) => {
    const person = people.find(p => p.id === personId);
    const unwrappedCount = person?.gifts.filter(g => !g.wrapped).length || 0;
    
    setPeople(people.map(person => 
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.map(gift => ({ ...gift, wrapped: true }))
          }
        : person
    ));
    
    if (unwrappedCount > 0) {
      toast({
        title: "All gifts marked as wrapped",
        description: `${unwrappedCount} gift${unwrappedCount === 1 ? '' : 's'} marked as wrapped.`,
      });
    }
  };

  const updatePersonNotes = (personId: string, notes: string) => {
    setPeople(people.map(person => 
      person.id === personId ? { ...person, notes } : person
    ));
  };

  const updatePersonAssignment = (personId: string, assignedTo: string | null) => {
    setPeople(prev => 
      prev.map(person => 
        person.id === personId 
          ? { ...person, assignedTo }
          : person
      )
    );
    
    const assignedBuyer = assignedTo ? buyers.find(b => b.name === assignedTo) : null;
    const person = people.find(p => p.id === personId);
    
    if (person) {
      toast({
        title: assignedTo 
          ? `Assigned ${person.name} to ${assignedBuyer?.emoji} ${assignedTo}`
          : `Unassigned ${person.name}`,
      });
    }
    
    haptic.success();
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
      showCompleted: false,
      hasGifts: 'all'
    });
  };

  // Filter people based on current filters and search
  const filteredPeople = people.filter(person => {
    // Search filter
    if (searchTerm && !person.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (!filters.showCompleted && person.completed === true) return false;
    
    if (buyers.length > 1 && filters.assignedTo !== 'all') {
      if (filters.assignedTo === 'unassigned' && person.assignedTo !== null) return false;
      if (filters.assignedTo !== 'unassigned' && person.assignedTo !== filters.assignedTo) return false;
    }

    if (filters.hasGifts !== 'all') {
      const hasGifts = person.gifts.length > 0;
      if (filters.hasGifts === 'with-gifts' && !hasGifts) return false;
      if (filters.hasGifts === 'no-gifts' && hasGifts) return false;
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

          {/* Enhanced Search and Filter System */}
          <GiftSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFiltersChange={setFilters}
            buyers={buyers}
          />
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
              <div className="flex flex-col gap-3 pt-4 border-t">
                <RippleButton onClick={addPerson} className="w-full h-11" disabled={!newPersonName.trim()}>
                  Add Recipient
                </RippleButton>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (unsavedChanges && newPersonName.trim()) {
                      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                        setIsAddPersonOpen(false);
                        setNewPersonName('');
                        setNewPersonAssignment(null);
                        setUnsavedChanges(false);
                      }
                    } else {
                      setIsAddPersonOpen(false);
                      setNewPersonName('');
                      setNewPersonAssignment(null);
                      setUnsavedChanges(false);
                    }
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating Action Button */}
        <FloatingActionButton 
          onClick={() => setIsAddPersonOpen(true)} 
          isVisible={!isAddPersonOpen && !editingGift}
        />

        {/* Main Content Area with Alphabet Index */}
        <div className="flex gap-4">
          {/* Alphabet Index - Desktop Only */}
          {sortedAndFilteredPeople.length > 10 && (
            <div className="hidden xl:block">
              <div className="sticky top-4">
                <AlphabetIndex
                  people={sortedAndFilteredPeople}
                  onLetterClick={scrollToLetter}
                  className="w-8"
                />
              </div>
            </div>
          )}

          {/* Compact Table */}
          <div className="flex-1 rounded-lg border bg-card overflow-hidden shadow-sm" ref={tableRef}>
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
                    <PersonContextMenu
                      onAddGift={() => setEditingGift({ personId: person.id })}
                      onEditNotes={() => {/* TODO: Open notes edit */}}
                      onEditAssignment={() => {/* TODO: Open assignment edit */}}
                      onMarkAllPurchased={() => markAllPurchased(person.id)}
                      onMarkAllWrapped={() => markAllWrapped(person.id)}
                      onDeletePerson={() => {/* TODO: Delete person */}}
                      onMarkComplete={() => handleCompletionChange(person, !person.completed)}
                      hasGifts={person.gifts.length > 0}
                      isComplete={person.completed || false}
                    >
                       <TableRow 
                         data-person-id={person.id}
                         className={`hover:bg-muted/50 border-b border-border/50 cursor-pointer ${person.completed ? 'bg-accent/20' : ''} ${
                           highlightedItems.has(`person-${person.id}`) ? 'animate-fade-in bg-primary/10 border-primary/20' : ''
                         }`}
                       >
                      <TableCell className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            haptic.tap();
                            toggleRow(person.id);
                          }}
                          className="p-1 h-6 w-6"
                        >
                          <ChevronRight 
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-90' : 'rotate-0'
                            }`} 
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                             <div className="flex items-center gap-2">
                               <span className={`font-semibold text-base ${person.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                 {person.name}
                               </span>
                               
                               {/* Assignment Avatar */}
                               <Popover>
                                 <PopoverTrigger asChild>
                                   <Avatar className="h-5 w-5 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                                     {person.assignedTo ? (
                                       <AvatarFallback className="bg-primary/10 text-xs">
                                         {buyers.find(b => b.name === person.assignedTo)?.emoji || '👤'}
                                       </AvatarFallback>
                                     ) : (
                                       <AvatarFallback className="bg-muted hover:bg-muted/80 text-muted-foreground">
                                         <Plus className="h-3 w-3" />
                                       </AvatarFallback>
                                     )}
                                   </Avatar>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-48 p-2" align="start">
                                   <div className="space-y-1">
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       className="w-full justify-start"
                                       onClick={() => {
                                         updatePersonAssignment(person.id, null);
                                       }}
                                     >
                                       <Circle className="mr-2 h-4 w-4 text-muted-foreground" />
                                       Unassigned
                                     </Button>
                                     {buyers.map(buyer => (
                                       <Button
                                         key={buyer.id}
                                         variant="ghost"
                                         size="sm"
                                         className="w-full justify-start"
                                         onClick={() => {
                                           updatePersonAssignment(person.id, buyer.name);
                                         }}
                                       >
                                         <span className="mr-2 text-sm">{buyer.emoji}</span>
                                         {buyer.name}
                                       </Button>
                                     ))}
                                   </div>
                                 </PopoverContent>
                               </Popover>
                               <Button
                                 variant={person.completed ? "default" : "outline"}
                                 size="sm"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   haptic.tap();
                                   handleManualComplete(person);
                                 }}
                                 className={`h-6 px-2 text-xs ${
                                   person.completed 
                                     ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                                     : 'border-muted-foreground/30 text-muted-foreground hover:bg-muted/50'
                                 }`}
                               >
                                 <Check className="w-3 h-3 mr-1" />
                                 Done
                               </Button>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Gift className="h-3 w-3" />
                                {stats.total}
                              </span>
                              <span className="flex items-center gap-1">
                                <ShoppingCart className="h-3 w-3" />
                                {stats.purchased}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {stats.wrapped}
                              </span>
                            </div>
                            {/* Notes Preview */}
                            <GiftNotes
                              notes={person.notes}
                              onNotesChange={(notes) => updatePersonNotes(person.id, notes)}
                              personName={person.name}
                              className="mt-0.5"
                              isEditing={editingNotes === person.id}
                              onEditStart={() => handleNotesEditStart(person.id)}
                              onEditEnd={handleNotesEditEnd}
                            />
                          </div>
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
                        <div className="flex items-center gap-2 w-full max-w-24">
                          <div className="flex-1 bg-muted rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${
                                person.completed ? 'bg-green-500' : 'bg-primary'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground min-w-[28px]">
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGift({ personId: person.id });
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    </PersonContextMenu>
                    
                    {/* Expanded Gift Details */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={buyers.length > 1 ? 6 : 5} className="p-0">
                          <div className="bg-muted/20 p-4 border-t">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">Gifts for {person.name}</h4>
                                <Button
                                  onClick={() => setEditingGift({ personId: person.id })}
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Gift
                                </Button>
                              </div>
                              {person.gifts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No gifts added yet</p>
                              ) : (
                                 <div className="space-y-2">
                                   {person.gifts.map((gift) => (
                                     <GiftContextMenu
                                       key={gift.id}
                                       gift={gift}
                                        onEdit={() => setEditingGift({ personId: person.id, giftId: gift.id, gift })}
                                       onTogglePurchased={() => updateGiftStatus(person.id, gift.id, 'purchased', !gift.purchased)}
                                       onToggleWrapped={() => updateGiftStatus(person.id, gift.id, 'wrapped', !gift.wrapped)}
                                       onDelete={() => deleteGift(person.id, gift.id)}
                                       onDuplicate={() => duplicateGift(person.id, gift)}
                                     >
                                        <div className={highlightedItems.has(`gift-${gift.id}`) ? 'animate-fade-in bg-primary/10 rounded-md p-1' : ''}>
                                          <SwipeableGiftItem
                                            gift={gift}
                                            currency={currency}
                                            onUpdate={(field, value) => updateGiftStatus(person.id, gift.id, field, value)}
                                            onDelete={() => deleteGift(person.id, gift.id)}
                                            onEdit={() => setEditingGift({ personId: person.id, giftId: gift.id, gift })}
                                          />
                                        </div>
                                     </GiftContextMenu>
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
        </div>


        {/* Gift Form for Add/Edit */}
        {editingGift && (
          <GiftForm
            isOpen={true}
            onClose={() => setEditingGift(null)}
            onSubmit={(giftData) => {
              if (editingGift.giftId) {
                // Edit existing gift
                updateGift(editingGift.personId, editingGift.giftId, giftData);
              } else {
                // Add new gift
                addGift(editingGift.personId, giftData);
              }
            }}
            personName={people.find(p => p.id === editingGift.personId)?.name || ''}
            currency={currency}
            editingGift={editingGift.gift}
            mode={editingGift.giftId ? 'edit' : 'add'}
          />
        )}

        {/* Confirmation Dialog for Incomplete Gifts */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark as Done?</AlertDialogTitle>
              <AlertDialogDescription>
                You still have gifts not purchased or wrapped for {pendingCompletionToggle?.person.name}. 
                Mark done anyway?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowConfirmDialog(false);
                setPendingCompletionToggle(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (pendingCompletionToggle) {
                  confirmManualComplete(pendingCompletionToggle.person, pendingCompletionToggle.newState);
                }
                setShowConfirmDialog(false);
                setPendingCompletionToggle(null);
              }}>
                Mark Done Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};


export default GiftTracker;
