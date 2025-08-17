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

  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'assignment' | 'cost' | 'progress';
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });
  const [openAssignmentPopover, setOpenAssignmentPopover] = useState<string | null>(null);
  const [openPeoplePopover, setOpenPeoplePopover] = useState(false);
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [editingNotesText, setEditingNotesText] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [completionDialog, setCompletionDialog] = useState<{
    isOpen: boolean;
    person: Person | null;
    incompleteParts: { purchased: number; wrapped: number };
  }>({
    isOpen: false,
    person: null,
    incompleteParts: { purchased: 0, wrapped: 0 }
  });

  const buttonsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const animateButton = useAnimatedButton();

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
      
      // Clear the navigation state
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    // Handle assignedTo filter from Summary buyer breakdown
    if (state?.assignedTo) {
      setFilters(prev => ({ ...prev, assignedTo: state.assignedTo }));
      
      // Clear the navigation state
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Initialize with sample data if no data exists
  const initialPeople: Person[] = [
    {
      id: '1',
      name: 'Mom',
      gifts: [
        { id: '1-1', name: 'Jewelry box', cost: 45, purchased: true, wrapped: false },
        { id: '1-2', name: 'Book collection', cost: 85, purchased: false, wrapped: false }
      ],
      notes: 'Loves vintage jewelry and classic novels',
      assignedTo: '1'
    },
    {
      id: '2', 
      name: 'Dad',
      gifts: [
        { id: '2-1', name: 'Coffee grinder', cost: 120, purchased: true, wrapped: true },
        { id: '2-2', name: 'Golf accessories', cost: null, purchased: false, wrapped: false }
      ],
      notes: 'Coffee enthusiast and weekend golfer',
      assignedTo: '2'
    },
    {
      id: '3',
      name: 'Sarah',
      gifts: [
        { id: '3-1', name: 'Art supplies', cost: 65, purchased: true, wrapped: true },
        { id: '3-2', name: 'Tablet for drawing', cost: 300, purchased: false, wrapped: false },
        { id: '3-3', name: 'Online course subscription', cost: 99, purchased: true, wrapped: false }
      ],
      notes: 'Aspiring digital artist, loves creative projects',
      assignedTo: '1'
    }
  ];

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('christmas-gifts-2025');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setPeople(parsedData);
      } else {
        setPeople(initialPeople);
      }

      const savedBuyers = localStorage.getItem('christmas-gifts-buyers');
      if (savedBuyers) {
        setBuyers(JSON.parse(savedBuyers));
      }

      const savedCurrency = localStorage.getItem('christmas-gifts-currency');
      if (savedCurrency) {
        setCurrency(savedCurrency);
      }

      setIsLoaded(true);

      // Show legend for first-time users
      const hasSeenLegend = localStorage.getItem('christmas-gifts-legend-seen');
      if (!hasSeenLegend) {
        setShowLegend(true);
        localStorage.setItem('christmas-gifts-legend-seen', 'true');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setPeople(initialPeople);
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever people data changes
  useEffect(() => {
    if (isLoaded && people.length > 0) {
      try {
        localStorage.setItem('christmas-gifts-2025', JSON.stringify(people));
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  }, [people, isLoaded]);

  // Save buyers to localStorage whenever buyers data changes
  useEffect(() => {
    if (isLoaded && buyers.length > 0) {
      try {
        localStorage.setItem('christmas-gifts-buyers', JSON.stringify(buyers));
      } catch (error) {
        console.error('Error saving buyers:', error);
      }
    }
  }, [buyers, isLoaded]);

  // Save currency to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('christmas-gifts-currency', currency);
      } catch (error) {
        console.error('Error saving currency:', error);
      }
    }
  }, [currency, isLoaded]);

  const addPerson = () => {
    if (newPersonName.trim()) {
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
      
      haptic.impact('light');
      toast({
        title: "Person added",
        description: `${newPerson.name} has been added to your gift list.`,
      });
    }
  };

  const addGift = (personId: string) => {
    if (giftForm.name.trim()) {
      const newGift: Gift = {
        id: Date.now().toString(),
        name: giftForm.name.trim(),
        cost: giftForm.cost ? parseFloat(giftForm.cost) : null,
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
      
      haptic.impact('light');
      toast({
        title: "Gift added",
        description: `"${newGift.name}" has been added to the list.`,
      });
    }
  };

  const updateGift = (personId: string, giftId: string, updatedGift: Partial<Gift>) => {
    setPeople(people.map(person => 
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.map(gift => 
              gift.id === giftId ? { ...gift, ...updatedGift } : gift
            )
          }
        : person
    ));
    
    haptic.impact('light');
    toast({
      title: "Gift updated",
      description: "Gift details have been saved.",
    });
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

    const person = people.find(p => p.id === personId);
    const gift = person?.gifts.find(g => g.id === giftId);
    
    if (gift) {
      haptic.impact('light');
      
      // Show micro-toast for status changes
      const action = value ? (field === 'purchased' ? 'purchased' : 'wrapped') : 
                           (field === 'purchased' ? 'unpurchased' : 'unwrapped');
      
      toast({
        title: `${gift.name} ${action}`,
        description: `Status updated for ${person?.name}`,
        duration: 2000,
      });
    }
  };

  const deleteGift = (personId: string, giftId: string) => {
    setPeople(people.map(person => 
      person.id === personId 
        ? { ...person, gifts: person.gifts.filter(gift => gift.id !== giftId) }
        : person
    ));
    
    haptic.impact('medium');
    toast({
      title: "Gift removed",
      description: "The gift has been deleted from the list.",
    });
  };

  const duplicateGift = (personId: string, giftId: string) => {
    const person = people.find(p => p.id === personId);
    const gift = person?.gifts.find(g => g.id === giftId);
    
    if (gift) {
      const duplicatedGift: Gift = {
        ...gift,
        id: Date.now().toString(),
        name: `${gift.name} (Copy)`,
        purchased: false,
        wrapped: false
      };
      
      setPeople(people.map(p => 
        p.id === personId 
          ? { ...p, gifts: [...p.gifts, duplicatedGift] }
          : p
      ));
      
      haptic.impact('light');
      toast({
        title: "Gift duplicated",
        description: `"${duplicatedGift.name}" has been added.`,
      });
    }
  };

  const markAllPurchased = (personId: string) => {
    setPeople(people.map(person => 
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.map(gift => ({ ...gift, purchased: true }))
          }
        : person
    ));
    
    haptic.impact('medium');
    const person = people.find(p => p.id === personId);
    toast({
      title: "All gifts purchased",
      description: `All gifts for ${person?.name} marked as purchased.`,
    });
  };

  const markAllWrapped = (personId: string) => {
    setPeople(people.map(person => 
      person.id === personId 
        ? {
            ...person,
            gifts: person.gifts.map(gift => ({ ...gift, wrapped: true }))
          }
        : person
    ));
    
    haptic.impact('medium');
    const person = people.find(p => p.id === personId);
    toast({
      title: "All gifts wrapped",
      description: `All gifts for ${person?.name} marked as wrapped.`,
    });
  };

  const updatePersonNotes = (personId: string, notes: string) => {
    setPeople(people.map(person => 
      person.id === personId ? { ...person, notes } : person
    ));
  };

  const updatePersonAssignment = (personId: string, buyerId: string | null) => {
    setPeople(people.map(person => 
      person.id === personId ? { ...person, assignedTo: buyerId } : person
    ));
    
    const buyer = buyers.find(b => b.id === buyerId);
    const person = people.find(p => p.id === personId);
    
    toast({
      title: "Assignment updated",
      description: `${person?.name} ${buyerId ? `assigned to ${buyer?.name}` : 'unassigned'}.`,
    });
  };

  const getCompletionStats = (person: Person) => {
    const total = person.gifts.length;
    const purchased = person.gifts.filter(g => g.purchased).length;
    const wrapped = person.gifts.filter(g => g.wrapped).length;
    const totalCost = person.gifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
    
    return { total, purchased, wrapped, totalCost };
  };

  const handleCompletionChange = (person: Person, completed: boolean) => {
    if (completed) {
      // Check if all gifts are purchased and wrapped
      const stats = getCompletionStats(person);
      const incompletePurchased = stats.total - stats.purchased;
      const incompleteWrapped = stats.total - stats.wrapped;
      
      if (incompletePurchased > 0 || incompleteWrapped > 0) {
        // Show dialog asking what to do
        setCompletionDialog({
          isOpen: true,
          person,
          incompleteParts: {
            purchased: incompletePurchased,
            wrapped: incompleteWrapped
          }
        });
        return;
      }
    }
    
    // If uncompleting or all gifts are complete, just toggle
    confirmManualComplete(person, completed, false);
  };

  const confirmManualComplete = (person: Person, completed: boolean, markAllComplete: boolean) => {
    setPeople(people.map(p => 
      p.id === person.id 
        ? { 
            ...p, 
            completed,
            manualComplete: completed,
            gifts: markAllComplete 
              ? p.gifts.map(g => ({ ...g, purchased: true, wrapped: true }))
              : p.gifts
          }
        : p
    ));
    
    haptic.impact(completed ? 'medium' : 'light');
    toast({
      title: completed ? "Person completed" : "Person reopened",
      description: completed 
        ? `${person.name} is now marked as complete.`
        : `${person.name} has been reopened for editing.`,
    });
  };

  const handleManualComplete = (person: Person) => {
    handleCompletionChange(person, !person.completed);
  };

  // Filtering logic
  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = person.name.toLowerCase().includes(searchLower);
        const matchesGifts = person.gifts.some(gift => 
          gift.name.toLowerCase().includes(searchLower)
        );
        if (!matchesName && !matchesGifts) return false;
      }

      // Assignment filter
      if (filters.assignedTo !== 'all') {
        if (filters.assignedTo === 'unassigned') {
          if (person.assignedTo !== null) return false;
        } else {
          if (person.assignedTo !== filters.assignedTo) return false;
        }
      }

      // Completion filter
      if (filters.completion === 'completed' && !person.completed) return false;
      if (filters.completion === 'incomplete' && person.completed) return false;

      // Wrapping filter
      if (filters.wrapping === 'needs-wrapping') {
        const hasUnwrappedGifts = person.gifts.some(gift => gift.purchased && !gift.wrapped);
        if (!hasUnwrappedGifts) return false;
      }
      if (filters.wrapping === 'all-wrapped') {
        const allWrapped = person.gifts.length > 0 && person.gifts.every(gift => gift.wrapped);
        if (!allWrapped) return false;
      }

      // Gifts filter
      if (filters.hasGifts === 'with-gifts' && person.gifts.length === 0) return false;
      if (filters.hasGifts === 'no-gifts' && person.gifts.length > 0) return false;

      // Cost status filter
      if (filters.costStatus === 'missing-cost') {
        const hasMissingCosts = person.gifts.some(gift => gift.cost === null || gift.cost === 0);
        if (!hasMissingCosts) return false;
      }

      return true;
    });
  }, [people, searchTerm, filters]);

  // Sorting logic
  const sortedAndFilteredPeople = useMemo(() => {
    return [...filteredPeople].sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      
      switch (sortConfig.key) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'assignment':
          const aAssignment = buyers.find(buyer => buyer.id === a.assignedTo)?.name || 'Unassigned';
          const bAssignment = buyers.find(buyer => buyer.id === b.assignedTo)?.name || 'Unassigned';
          return direction * aAssignment.localeCompare(bAssignment);
        case 'cost':
          const aCost = a.gifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
          const bCost = b.gifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
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

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: typeof sortConfig.key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" /> 
      : <ArrowDown className="h-4 w-4" />;
  };

  const handleNotesEditStart = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (person) {
      setEditingNotes(personId);
      setEditingNotesText(person.notes);
    }
  };

  const handleNotesEditSave = () => {
    if (editingNotes) {
      updatePersonNotes(editingNotes, editingNotesText);
      setEditingNotes(null);
      setEditingNotesText('');
    }
  };

  const handleNotesEditCancel = () => {
    setEditingNotes(null);
    setEditingNotesText('');
  };

  const scrollToLetter = (letter: string) => {
    const person = sortedAndFilteredPeople.find(person => 
      person.name.toLowerCase().startsWith(letter.toLowerCase())
    );
    if (person) {
      const element = document.getElementById(`person-${person.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Highlight the person briefly
        setHighlightedItems(new Set([`person-${person.id}`]));
        setTimeout(() => setHighlightedItems(new Set()), 2000);
      }
    }
  };

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
                    <span className="text-lg">🛒</span>
                    <span className="text-muted-foreground">Purchased</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <span className="text-muted-foreground">Wrapped</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLegend(false)}
                  className="h-auto p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Search and Filter Row */}
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
          <DialogContent className="w-full max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Add Person</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Person's name"
                  value={newPersonName}
                  onChange={(e) => {
                    setNewPersonName(e.target.value);
                    setUnsavedChanges(e.target.value.trim() !== '');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addPerson();
                    }
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Assign to:</label>
                <div className="space-y-2">
                  {buyers.map((buyer) => (
                    <label key={buyer.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="assignment"
                        value={buyer.id}
                        checked={newPersonAssignment === buyer.id}
                        onChange={(e) => {
                          setNewPersonAssignment(e.target.value);
                          setUnsavedChanges(true);
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-lg">{buyer.emoji}</span>
                      <span className="text-sm">{buyer.name}</span>
                    </label>
                  ))}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="assignment"
                      value=""
                      checked={newPersonAssignment === null}
                      onChange={() => {
                        setNewPersonAssignment(null);
                        setUnsavedChanges(true);
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">No assignment</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={addPerson} className="flex-1">
                  Add Person
                </Button>
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
        <div className="flex gap-4 max-w-full overflow-hidden">
          {/* Alphabet Index - Desktop Only */}
          {sortedAndFilteredPeople.length > 10 && (
            <div className="hidden lg:block flex-shrink-0">
              <AlphabetIndex
                people={sortedAndFilteredPeople}
                onLetterClick={scrollToLetter}
              />
            </div>
          )}

          {/* People List */}
          <div className="flex-1 space-y-4 min-w-0">
            {sortedAndFilteredPeople.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No people found</h3>
                <p className="text-sm text-muted-foreground">
                  {people.length === 0 
                    ? "Add your first person to start tracking gifts"
                    : "Try adjusting your search or filters"}
                </p>
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
                    <div
                      id={`person-${person.id}`}
                      className={cn(
                        "bg-card border rounded-lg shadow-sm transition-all duration-300 max-w-full overflow-hidden",
                        isHighlighted && "ring-2 ring-primary/50 shadow-lg",
                        person.completed && "opacity-75"
                      )}
                    >
                      {/* Person Header */}
                      <div className="p-4 border-b bg-muted/30">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Expand/Collapse Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 flex-shrink-0"
                              onClick={() => {
                                const newExpanded = new Set(expandedRows);
                                if (isExpanded) {
                                  newExpanded.delete(person.id);
                                } else {
                                  newExpanded.add(person.id);
                                }
                                setExpandedRows(newExpanded);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>

                            {/* Person Name & Status */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <h3 className={cn(
                                  "font-medium text-lg min-w-0 truncate",
                                  person.completed && "line-through text-muted-foreground"
                                )}>
                                  {person.name}
                                </h3>
                                {person.completed && (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                )}
                              </div>

                              {/* Stats Row */}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Gift className="h-3 w-3" />
                                  {stats.total}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ShoppingCart className="h-3 w-3" />
                                  {stats.purchased}/{stats.total}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {stats.wrapped}/{stats.total}
                                </span>
                                {stats.totalCost > 0 && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(stats.totalCost, getCurrencySymbol())}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Small Assignment Avatar */}
                            <Popover 
                              open={openAssignmentPopover === person.id} 
                              onOpenChange={(open) => setOpenAssignmentPopover(open ? person.id : null)}
                            >
                              <PopoverTrigger asChild>
                                <button 
                                  className="flex-shrink-0 h-8 w-8 rounded-full border border-muted-foreground/30 flex items-center justify-center text-sm bg-background hover:bg-muted transition-colors"
                                  title={assignedBuyer ? `Assigned to ${assignedBuyer.name}` : 'Not assigned'}
                                >
                                  {assignedBuyer ? assignedBuyer.emoji : '?'}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48 p-2" align="end">
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-muted-foreground mb-2">Assign to:</div>
                                  <button
                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
                                    onClick={() => {
                                      updatePersonAssignment(person.id, null);
                                      setOpenAssignmentPopover(null);
                                    }}
                                  >
                                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30 flex items-center justify-center">
                                      <span className="text-xs">?</span>
                                    </div>
                                    <span>Unassigned</span>
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
                                      <span>{buyer.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>

                            {/* Complete Toggle */}
                            <div className="flex-shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleManualComplete(person)}
                                    className={cn(
                                      "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors",
                                      person.completed
                                        ? "bg-green-600 border-green-600 text-white"
                                        : "border-muted-foreground/30 hover:border-green-600 hover:bg-green-50"
                                    )}
                                  >
                                    {person.completed && <Check className="h-4 w-4" />}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {person.completed ? 'Mark as incomplete' : 'Mark as complete'}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {stats.total > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Progress</span>
                              <span>{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expandable Content */}
                      <Collapsible open={isExpanded}>
                        <CollapsibleContent>
                          <div className="p-4 space-y-4">
                            {/* Notes Section */}
                            <div>
                              <label className="text-sm font-medium mb-2 block">Notes</label>
                              {editingNotes === person.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editingNotesText}
                                    onChange={(e) => setEditingNotesText(e.target.value)}
                                    placeholder="Add notes about gift preferences..."
                                    className="min-h-[60px]"
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={handleNotesEditSave}>
                                      <Save className="h-3 w-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleNotesEditCancel}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="min-h-[40px] p-2 border rounded bg-muted/50 text-sm cursor-pointer hover:bg-muted transition-colors"
                                  onClick={() => handleNotesEditStart(person.id)}
                                >
                                  {person.notes || "Click to add notes about gift preferences..."}
                                </div>
                              )}
                            </div>

                            {/* Gifts Section */}
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
                                   className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-background/50 max-w-full"
                                 >
                                   {/* Left: Gift info and status toggles */}
                                   <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <SwipeableGiftItem
                                          gift={gift}
                                          currency={getCurrencySymbol()}
                                          onUpdate={(giftId, field, value) => updateGiftStatus(person.id, giftId, field, value)}
                                          onDelete={(giftId) => deleteGift(person.id, giftId)}
                                          onEdit={(giftId) => {
                                            setEditingGift({
                                              personId: person.id,
                                              giftId: giftId,
                                              gift: gift
                                            });
                                          }}
                                      />
                                     
                                     <div className="min-w-0 flex-1">
                                       <div className="flex items-center gap-2 min-w-0">
                                         <h5 className={cn(
                                           "font-medium text-sm min-w-0 truncate",
                                           gift.purchased && gift.wrapped && "line-through text-muted-foreground"
                                         )}>
                                           {gift.name}
                                         </h5>
                                       </div>
                                     </div>
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
                        </CollapsibleContent>
                      </Collapsible>
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
              key={`${editingGift.personId}-${editingGift.giftId || 'new'}`}
              isOpen={true}
              onClose={() => setEditingGift(null)}
              onSubmit={(giftData) => {
                if (editingGift.giftId) {
                  updateGift(editingGift.personId, editingGift.giftId, {
                    name: giftData.name,
                    cost: giftData.cost ? parseFloat(giftData.cost) : null
                  });
                } else {
                  const newGift: Gift = {
                    id: Date.now().toString(),
                    name: giftData.name,
                    cost: giftData.cost ? parseFloat(giftData.cost) : null,
                    purchased: false,
                    wrapped: false
                  };
                  
                  setPeople(people.map(person => 
                    person.id === editingGift.personId 
                      ? { ...person, gifts: [...person.gifts, newGift] }
                      : person
                  ));
                }
                setEditingGift(null);
              }}
              personName={people.find(p => p.id === editingGift.personId)?.name || ''}
              currency={getCurrencySymbol()}
              editingGift={editingGift.gift}
              mode={editingGift.giftId ? 'edit' : 'add'}
            />
         )}

         {/* Completion Dialog */}
         <AlertDialog open={completionDialog.isOpen}>
           <AlertDialogContent>
             <AlertDialogHeader>
               <AlertDialogTitle>Complete Person</AlertDialogTitle>
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
