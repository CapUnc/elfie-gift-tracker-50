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
import { cn } from '@/lib/utils';
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
  assignedTo: string | null; // Buyer ID
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
  const [showLegend, setShowLegend] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    assignedTo: 'all' as string,
    completion: 'all' as 'all' | 'completed' | 'incomplete',
    wrapping: 'all' as 'all' | 'needs-wrapping' | 'all-wrapped',
    showCompleted: false,
    hasGifts: 'all' as 'all' | 'with-gifts' | 'no-gifts',
    costStatus: 'all' as 'all' | 'missing-cost'
  });

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
        case 'missing-cost':
          setFilters(prev => ({ ...prev, costStatus: 'missing-cost' }));
          break;
      }
    }
    if (state?.assignedTo) {
      setFilters(prev => ({ ...prev, assignedTo: state.assignedTo }));
    }
  }, []);
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
  const [openAssignmentPopover, setOpenAssignmentPopover] = useState<string | null>(null);
  const [editingRecipient, setEditingRecipient] = useState<{
    personId: string;
    field: 'assignment' | 'notes';
    value: string;
  } | null>(null);
  const [lastExpandedRow, setLastExpandedRow] = useState<string | null>(null);
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
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
      const loadedPeople = JSON.parse(saved);
      // Migrate assignedTo from buyer names to buyer IDs
      const migratedPeople = loadedPeople.map((person: Person) => {
        if (person.assignedTo && typeof person.assignedTo === 'string') {
          // Check if assignedTo is already a buyer ID
          const buyerById = buyers.find(b => b.id === person.assignedTo);
          if (buyerById) {
            return person; // Already using ID
          }
          // Convert from buyer name to buyer ID
          const buyerByName = buyers.find(b => b.name === person.assignedTo);
          return {
            ...person,
            assignedTo: buyerByName ? buyerByName.id : null
          };
        }
        return person;
      });
      setPeople(migratedPeople);
    } else {
      // Initialize with the names from your spreadsheet
      setPeople(initialPeople);
    }
    setIsLoaded(true);
  }, [buyers]);

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
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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
      // Calculate incomplete parts for the dialog
      const purchased = person.gifts.filter(g => !g.purchased).length;
      const wrapped = person.gifts.filter(g => !g.wrapped).length;
      
      // Show confirmation dialog for incomplete gifts
      setCompletionDialog({
        isOpen: true,
        person,
        incompleteParts: { purchased, wrapped }
      });
    } else {
      // Direct toggle
      confirmManualComplete(person, newState);
    }
  };

  const confirmManualComplete = (person: Person, completed: boolean, markGiftsComplete = false) => {
    setPeople(prevPeople =>
      prevPeople.map(p =>
        p.id === person.id
          ? { 
              ...p, 
              completed, 
              manualComplete: true,
              gifts: markGiftsComplete && completed 
                ? p.gifts.map(gift => ({ ...gift, purchased: true, wrapped: true }))
                : p.gifts
            }
          : p
      )
    );
    
    const incompleteGiftsNote = completed && hasIncompleteGifts(person) && !markGiftsComplete ? " (with incomplete gifts)" : "";
    const markedGiftsNote = markGiftsComplete && completed ? " and marked all gifts as purchased & wrapped" : "";
    
    toast({
      title: `Marked ${person.name} as ${completed ? "complete" : "not complete"}.`,
      description: completed 
        ? `${person.name} marked as complete${incompleteGiftsNote}${markedGiftsNote}.`
        : `${person.name} unmarked as complete.`,
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
    
    const assignedBuyer = assignedTo ? buyers.find(b => b.id === assignedTo) : null;
    const person = people.find(p => p.id === personId);
    
    if (person) {
      toast({
        title: assignedTo 
          ? `Assigned ${person.name} to ${assignedBuyer?.emoji} ${assignedBuyer?.name}`
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
      hasGifts: 'all',
      costStatus: 'all'
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

    if (filters.costStatus !== 'all') {
      const hasMissingCost = person.gifts.some(gift => gift.cost === null);
      if (filters.costStatus === 'missing-cost' && !hasMissingCost) return false;
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
          const aBuyer = a.assignedTo ? buyers.find(b => b.id === a.assignedTo) : null;
          const bBuyer = b.assignedTo ? buyers.find(buyer => buyer.id === b.assignedTo) : null;
          const aAssigned = aBuyer ? aBuyer.name : 'Unassigned';
          const bAssigned = bBuyer ? bBuyer.name : 'Unassigned';
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

  console.log("GiftTracker render started");
  return (
    <div className="p-4 sm:p-6 pb-20 max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto max-w-full">
        {/* Compact Header */}
        <div className="mb-6 max-w-full">
          <div className="flex items-center justify-between mb-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2 min-w-0">
                <Gift className="h-5 w-5 text-christmas-red flex-shrink-0" />
                <span className="truncate">Gift Tracker</span>
              </h1>
              <p className="text-sm text-muted-foreground">Manage holiday gifts</p>
            </div>
          </div>

          {/* Session Legend */}
          {showLegend && (
            <div className="mb-4 bg-muted/50 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-emerald-600" />
                    <span className="text-muted-foreground">Purchased</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="text-muted-foreground">Wrapped</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowLegend(false);
                    sessionStorage.setItem('gift-tracker-legend-shown', 'true');
                  }}
                  className="h-7 px-2 text-xs"
                >
                  Got it
                </Button>
              </div>
            </div>
          )}
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
                      <SelectItem key={buyer.id} value={buyer.id}>{buyer.emoji} {buyer.name}</SelectItem>
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

        {/* Floating Action Button */}
        <FloatingActionButton 
          onClick={() => setIsAddPersonOpen(true)} 
          isVisible={!isAddPersonOpen && !editingGift}
        />

        {/* Main Content Area with Alphabet Index */}
        <div className="flex gap-4 max-w-full overflow-hidden">
          {/* Alphabet Index - Desktop Only */}
          {sortedAndFilteredPeople.length > 10 && (
            <div className="hidden xl:block flex-shrink-0">
              <div className="sticky top-4">
                <AlphabetIndex
                  people={sortedAndFilteredPeople}
                  onLetterClick={scrollToLetter}
                  className="w-8"
                />
              </div>
            </div>
          )}

          {/* Responsive Card Layout */}
          <div className="flex-1 space-y-3 max-w-full overflow-hidden" ref={tableRef}>
            {/* Sort Controls - Compact Segmented Design */}
            {sortedAndFilteredPeople.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={sortConfig.key === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-7 px-3 text-xs"
                  >
                    Name {sortConfig.key === 'name' && getSortIcon('name')}
                  </Button>
                  {buyers.length > 1 && (
                    <Button
                      variant={sortConfig.key === 'assignedTo' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSort('assignedTo')}
                      className="h-7 px-3 text-xs"
                    >
                      Assignment {sortConfig.key === 'assignedTo' && getSortIcon('assignedTo')}
                    </Button>
                  )}
                  <Button
                    variant={sortConfig.key === 'totalCost' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('totalCost')}
                    className="h-7 px-3 text-xs"
                  >
                    Cost {sortConfig.key === 'totalCost' && getSortIcon('totalCost')}
                  </Button>
                  <Button
                    variant={sortConfig.key === 'progress' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSort('progress')}
                    className="h-7 px-3 text-xs"
                  >
                    Progress {sortConfig.key === 'progress' && getSortIcon('progress')}
                  </Button>
                </div>
              </div>
            )}

            {/* Responsive Card List */}
            {sortedAndFilteredPeople.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {people.length === 0 ? "No recipients added yet" : "No recipients match your search"}
                </p>
                {people.length === 0 && (
                  <Button onClick={() => setIsAddPersonOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Recipient
                  </Button>
                )}
              </div>
            ) : (
              sortedAndFilteredPeople.map((person) => {
                const stats = getCompletionStats(person);
                const isExpanded = expandedRows.has(person.id);
                const isHighlighted = highlightedItems.has(`person-${person.id}`);
                const assignedBuyer = buyers.find(b => b.id === person.assignedTo);
                const progressPercent = stats.total > 0 ? ((stats.purchased + stats.wrapped) / (stats.total * 2)) * 100 : 0;

                return (
                  <PersonContextMenu
                    key={person.id}
                    onAddGift={() => setEditingGift({ personId: person.id })}
                    onEditNotes={() => handleNotesEditStart(person.id)}
                    onEditAssignment={() => setOpenAssignmentPopover(person.id)}
                    onMarkAllPurchased={() => markAllPurchased(person.id)}
                    onMarkAllWrapped={() => markAllWrapped(person.id)}
                    onDeletePerson={() => {/* TODO: Delete person */}}
                    onMarkComplete={() => handleCompletionChange(person, !person.completed)}
                    hasGifts={person.gifts.length > 0}
                    isComplete={person.completed || false}
                  >
                    <div className="max-w-full overflow-hidden">
                      {/* Main Recipient Card - Two Row Layout */}
                         <div 
                         className={`bg-card rounded-lg border cursor-pointer transition-colors duration-200 max-w-full hover:bg-muted/30 ${
                           isHighlighted ? 'bg-primary/10 border-primary/30' : ''
                         } ${person.completed ? 'opacity-75' : ''}`}
                         data-person-id={person.id}
                         onClick={() => toggleRow(person.id)}
                         role="button"
                         aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${person.name}'s gift details`}
                         aria-expanded={isExpanded}
                       >
                          <div className="px-3 py-3 space-y-3">
                            {/* Top Row: Caret + Avatar + Name + Complete Button */}
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Expand/Collapse Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  haptic.tap();
                                  toggleRow(person.id);
                                }}
                                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${person.name}'s gift details`}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>

                             {/* Small Assignment Avatar */}
                             <Popover 
                               open={openAssignmentPopover === person.id} 
                               onOpenChange={(open) => setOpenAssignmentPopover(open ? person.id : null)}
                             >
                               <PopoverTrigger asChild>
                                 <button 
                                   className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full hover:bg-accent/50 transition-colors"
                                   onClick={(e) => e.stopPropagation()}
                                   type="button"
                                 >
                                   {assignedBuyer?.emoji ? (
                                     <span className="text-sm leading-none">{assignedBuyer.emoji}</span>
                                   ) : (
                                     <div className="h-4 w-4 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center">
                                       <Users className="h-2.5 w-2.5 text-muted-foreground" />
                                     </div>
                                   )}
                                 </button>
                               </PopoverTrigger>
                               <PopoverContent className="w-48 p-2" align="start">
                                 <div className="space-y-1">
                                   <button
                                     className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
                                     onClick={() => {
                                       updatePersonAssignment(person.id, null);
                                       setOpenAssignmentPopover(null);
                                     }}
                                   >
                                     <div className="h-4 w-4 rounded-full border border-muted-foreground/30 flex items-center justify-center">
                                       <Users className="h-3 w-3 text-muted-foreground" />
                                     </div>
                                     Unassigned
                                   </button>
                                   {buyers.map((buyer) => (
                                     <button
                                       key={buyer.id}
                                       className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
                                        onClick={() => {
                                          updatePersonAssignment(person.id, buyer.id);
                                          setOpenAssignmentPopover(null);
                                        }}
                                     >
                                       <span className="text-lg leading-none">{buyer.emoji}</span>
                                       {buyer.name}
                                     </button>
                                   ))}
                                 </div>
                               </PopoverContent>
                             </Popover>

                              {/* Name (truncate) */}
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm text-foreground truncate">
                                  {person.name}
                                </div>
                              </div>

                               {/* Complete Button - Top Right */}
                               <div className="flex-shrink-0">
                                 <Button
                                   variant={(!hasIncompleteGifts(person) && person.gifts.length > 0) || person.completed ? "default" : "outline"}
                                   size="sm"
                                   className={cn(
                                     "h-8 px-3 text-xs font-medium transition-colors",
                                     (!hasIncompleteGifts(person) && person.gifts.length > 0) || person.completed
                                       ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                                       : "border-border hover:bg-muted"
                                   )}
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     haptic.tap();
                                     handleManualComplete(person);
                                   }}
                                   aria-label={`Mark ${person.name} as ${person.completed ? 'not complete' : 'complete'}`}
                                 >
                                   Complete
                                 </Button>
                               </div>
                          </div>

                            {/* Bottom Row: Icon Stats + Progress */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <span className="flex items-center gap-1">
                                  🎁 {person.gifts.length}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  🛒 {stats.purchased}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  🎀 {stats.wrapped}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  $ {formatCurrency(getTotalCost(person.gifts), getCurrencySymbol()).replace(getCurrencySymbol(), '')}
                                </span>
                              </div>
                              
                              {/* Progress in bottom-right */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {person.gifts.length > 0 ? (
                                  <>
                                    <div className="bg-secondary/50 rounded-full h-1 w-16 overflow-hidden">
                                      <div 
                                        className="h-full bg-primary rounded-full transition-all duration-300" 
                                        style={{ width: `${progressPercent}%` }}
                                        role="progressbar"
                                        aria-valuenow={stats.purchased + stats.wrapped}
                                        aria-valuemin={0}
                                        aria-valuemax={stats.total * 2}
                                        aria-label={`Gift progress: ${stats.purchased + stats.wrapped} out of ${stats.total * 2} tasks done`}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">
                                      {stats.purchased + stats.wrapped} of {stats.total * 2}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    No gifts yet
                                  </span>
                                )}
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-2 bg-muted/20 rounded-lg border p-4 max-w-full overflow-hidden">
                          {/* Notes Section */}
                          <div className="mb-4">
                            <GiftNotes
                              notes={person.notes}
                              onNotesChange={(notes) => updatePersonNotes(person.id, notes)}
                              personName={person.name}
                              isEditing={editingNotes === person.id}
                              onEditStart={() => handleNotesEditStart(person.id)}
                              onEditEnd={handleNotesEditEnd}
                            />
                          </div>

                            {/* Gift List */}
                           {person.gifts.length > 0 ? (
                             <div className="space-y-3 max-w-full">
                               <div className="flex items-center justify-between mb-3">
                                 <h4 className="text-sm font-medium">
                                   Gifts ({person.gifts.length})
                                 </h4>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   className="h-7 px-2 text-xs"
                                   onClick={() => setEditingGift({ personId: person.id })}
                                   aria-label={`Add gift for ${person.name}`}
                                 >
                                   <Plus className="h-3 w-3 mr-1" />
                                   Add Gift
                                 </Button>
                               </div>
                              {person.gifts.map((gift) => (
                                <div
                                  key={gift.id}
                                  className={`bg-background rounded-lg border p-3 transition-colors duration-200 max-w-full overflow-hidden ${
                                    highlightedItems.has(`gift-${gift.id}`) ? 'bg-primary/10 border-primary/30' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {/* Left: Two status toggles */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Checkbox
                                        checked={gift.purchased}
                                        onCheckedChange={(checked) => updateGiftStatus(person.id, gift.id, 'purchased', checked === true)}
                                        aria-label={`Mark ${gift.name} as ${gift.purchased ? 'not purchased' : 'purchased'}`}
                                        className="h-4 w-4"
                                      />
                                      <Checkbox
                                        checked={gift.wrapped}
                                        onCheckedChange={(checked) => updateGiftStatus(person.id, gift.id, 'wrapped', checked === true)}
                                        aria-label={`Mark ${gift.name} as ${gift.wrapped ? 'not wrapped' : 'wrapped'}`}
                                        className="h-4 w-4"
                                      />
                                    </div>

                                    {/* Center: Gift name */}
                                    <div className="min-w-0 flex-1">
                                      <span className="text-sm font-medium text-foreground truncate block">
                                        {gift.name}
                                      </span>
                                    </div>

                                    {/* Right: Cost and single edit button */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="text-sm text-muted-foreground">
                                        {gift.cost ? formatCurrency(gift.cost, getCurrencySymbol()) : '—'}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => setEditingGift({ personId: person.id, giftId: gift.id, gift })}
                                        aria-label={`Edit ${gift.name}`}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No gifts added yet</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => setEditingGift({ personId: person.id })}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Gift
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </PersonContextMenu>
                );
              })
            )}
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
        <AlertDialog open={completionDialog.isOpen} onOpenChange={(open) => {
          if (!open) {
            setCompletionDialog({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } });
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark {completionDialog.person?.name} as Complete?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  {completionDialog.person?.name} still has:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {completionDialog.incompleteParts.purchased > 0 && (
                    <li>{completionDialog.incompleteParts.purchased} gift{completionDialog.incompleteParts.purchased > 1 ? 's' : ''} not purchased</li>
                  )}
                  {completionDialog.incompleteParts.wrapped > 0 && (
                    <li>{completionDialog.incompleteParts.wrapped} gift{completionDialog.incompleteParts.wrapped > 1 ? 's' : ''} not wrapped</li>
                  )}
                </ul>
                <p className="text-sm">
                  Would you like to mark all remaining gifts as purchased and wrapped, or just mark as complete anyway?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={() => {
                setCompletionDialog({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } });
              }}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => {
                  if (completionDialog.person) {
                    confirmManualComplete(completionDialog.person, true, false);
                  }
                  setCompletionDialog({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } });
                }}
              >
                Mark Complete Anyway
              </Button>
              <AlertDialogAction onClick={() => {
                if (completionDialog.person) {
                  confirmManualComplete(completionDialog.person, true, true);
                }
                setCompletionDialog({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } });
              }}>
                Complete All Gifts
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};


export default GiftTracker;
