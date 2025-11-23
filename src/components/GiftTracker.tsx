import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Gift, DollarSign, ChevronDown, ChevronRight, Filter, Settings, Package, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, X, Trash2, Home, AlertCircle, CheckCircle, Circle, PlusCircle, Edit2, Save, XCircle, Search, ShoppingCart, Clock, Users, Check, StickyNote, Zap } from 'lucide-react';
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
import { RecipientNotes } from './RecipientNotes';
import { ErrorBoundary } from './ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { GiftForm } from './GiftForm';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';

import { useRecipients } from '@/hooks/useRecipients';
import { useGifts } from '@/hooks/useGifts';
import { useGivers } from '@/hooks/useGivers';
import { useGiftTemplates } from '@/hooks/useGiftTemplates';
import { supabase } from '@/integrations/supabase/client';

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
  is_placeholder?: boolean;
  template_id?: string | null;
  givers?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
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
  const { session } = useAuth();
  const { householdId, loading: householdLoading } = useHousehold(session?.user?.id);
  
  // Supabase hooks
  const { profileLinkedGivers, loading: buyersLoading } = useGivers(householdId);
  const supabaseBuyers = profileLinkedGivers; // For compatibility with existing code
  const { recipients: supabaseRecipients, updateRecipient, addRecipient } = useRecipients(householdId);
  const { gifts: supabaseGifts, addGift: addGiftToDb, updateGift: updateGiftInDb, updateGiftStatus: updateGiftStatusInDb, deleteGift: deleteGiftFromDb, duplicateGift: duplicateGiftInDb, batchUpdateGifts } = useGifts(householdId);
  const { givers } = useGivers(householdId);
  const { templates } = useGiftTemplates(householdId);
  
  // Fetch all household notes for indicator
  const { data: allNotes = [] } = useQuery({
    queryKey: ['all-recipient-notes', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data } = await supabase
        .from('recipient_notes')
        .select('*')
        .eq('household_id', householdId);
      return data || [];
    },
    enabled: !!householdId,
  });
  
  // Local state
  const [currency, setCurrency] = useState('$');
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonAssignment, setNewPersonAssignment] = useState<string | null>(null);
  const [editingGift, setEditingGift] = useState<{ personId: string; giftId?: string; gift?: Gift } | null>(null);
  
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
  const [expandedTracking, setExpandedTracking] = useState<Set<string>>(new Set());
  const [showLegend, setShowLegend] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    assignedTo: 'all' as string,
    completion: 'all' as 'all' | 'completed' | 'incomplete',
    wrapping: 'all' as 'all' | 'needs-wrapping' | 'all-wrapped',
    showCompleted: false,
    hasGifts: 'all' as 'all' | 'with-gifts' | 'no-gifts',
    costStatus: 'all' as 'all' | 'missing-cost',
    fromGiver: 'all' as string,
    hasPlaceholders: false
  });

  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'assignment' | 'cost' | 'progress';
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });
  const [openAssignmentPopover, setOpenAssignmentPopover] = useState<string | null>(null);
  const [openPeoplePopover, setOpenPeoplePopover] = useState(false);
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
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

  // Transform Supabase data into local format
  const buyers: Buyer[] = supabaseBuyers.map(g => ({
    id: g.id,
    name: g.name,
    emoji: g.icon || '🎁'
  }));
  
  const people: Person[] = useMemo(() => {
    return supabaseRecipients.map(recipient => ({
      id: recipient.id,
      name: recipient.name,
      notes: recipient.notes,
      assignedTo: recipient.assigned_to,
      completed: recipient.completed,
      manualComplete: recipient.manual_complete,
      gifts: supabaseGifts
        .filter(gift => gift.recipient_id === recipient.id)
        .map(gift => ({
          id: gift.id,
          name: gift.name,
          cost: gift.cost,
          purchased: gift.purchased,
          wrapped: gift.wrapped,
          url: gift.url || undefined,
          tracking: gift.tracking || undefined,
          assignedTo: gift.assigned_to || undefined,
        }))
    }));
  }, [supabaseRecipients, supabaseGifts]);

  // Load currency from Supabase household
  useEffect(() => {
    const fetchCurrency = async () => {
      if (!householdId) return;

      try {
        const { data, error } = await supabase
          .from('households')
          .select('currency')
          .eq('id', householdId)
          .single();

        if (error) throw error;
        if (data?.currency) {
          setCurrency(data.currency);
        }
      } catch (error) {
        console.error('Error fetching currency:', error);
      }
    };

    fetchCurrency();
  }, [householdId]);

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
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    if (state?.assignedTo) {
      setFilters(prev => ({ ...prev, assignedTo: state.assignedTo }));
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Show legend for first-time users
  useEffect(() => {
    const hasSeenLegend = localStorage.getItem('christmas-gifts-legend-seen');
    if (!hasSeenLegend) {
      setShowLegend(true);
      localStorage.setItem('christmas-gifts-legend-seen', 'true');
    }
  }, []);

  const addPerson = async () => {
    if (newPersonName.trim() && householdId) {
      try {
        await addRecipient(newPersonName.trim(), newPersonAssignment);
        setNewPersonName('');
        setNewPersonAssignment(null);
        setIsAddPersonOpen(false);
        setUnsavedChanges(false);
        
        haptic.impact('light');
        toast({
          title: "Person added",
          description: `${newPersonName.trim()} has been added to your gift list.`,
        });
      } catch (error) {
        // Error toast shown by hook
      }
    }
  };

  const addGift = async (
    personId: string, 
    name: string, 
    cost: number | null,
    options?: {
      isPlaceholder?: boolean;
      templateId?: string;
      giverIds?: string[];
    }
  ) => {
    if (name.trim() && householdId) {
      try {
        await addGiftToDb(
          personId,
          name.trim(),
          cost,
          options
        );
        
        setEditingGift(null);
        
        haptic.impact('light');
        toast({
          title: "Gift added",
          description: `"${name.trim()}" has been added to the list.`,
        });
      } catch (error) {
        // Error toast shown by hook
      }
    }
  };

  const updateGift = async (
    personId: string, 
    giftId: string, 
    updatedGift: Partial<Gift>,
    giverIds?: string[]
  ) => {
    try {
      await updateGiftInDb(giftId, updatedGift, giverIds);
      
      haptic.impact('light');
      toast({
        title: "Gift updated",
        description: "Gift details have been saved.",
      });
    } catch (error) {
      // Error toast shown by hook
    }
  };

  const updateGiftStatus = async (personId: string, giftId: string, field: 'purchased' | 'wrapped', value: boolean) => {
    try {
      await updateGiftStatusInDb(giftId, field, value);

      const person = people.find(p => p.id === personId);
      const gift = person?.gifts.find(g => g.id === giftId);
      
      if (gift) {
        haptic.impact('light');
        const action = value ? (field === 'purchased' ? 'purchased' : 'wrapped') : 
                             (field === 'purchased' ? 'unpurchased' : 'unwrapped');
        
        toast({
          title: `${gift.name} ${action}`,
          description: `Status updated for ${person?.name}`,
          duration: 2000,
        });
      }
    } catch (error) {
      // Error toast shown by hook
    }
  };

  const deleteGift = async (personId: string, giftId: string) => {
    try {
      await deleteGiftFromDb(giftId);
      
      haptic.impact('medium');
      toast({
        title: "Gift removed",
        description: "The gift has been deleted from the list.",
      });
    } catch (error) {
      // Error toast shown by hook
    }
  };

  const duplicateGift = async (personId: string, giftId: string) => {
    try {
      await duplicateGiftInDb(giftId);
      
      haptic.impact('light');
      toast({
        title: "Gift duplicated",
        description: "Gift has been duplicated.",
      });
    } catch (error) {
      // Error toast shown by hook
    }
  };

  const markAllPurchased = async (personId: string) => {
    try {
      await batchUpdateGifts(personId, { purchased: true });
      
      haptic.impact('medium');
      const person = people.find(p => p.id === personId);
      toast({
        title: "All gifts purchased",
        description: `All gifts for ${person?.name} marked as purchased.`,
      });
    } catch (error) {
      // Error toast shown by hook
    }
  };

  const markAllWrapped = async (personId: string) => {
    try {
      await batchUpdateGifts(personId, { wrapped: true });
      
      haptic.impact('medium');
      const person = people.find(p => p.id === personId);
      toast({
        title: "All gifts wrapped",
        description: `All gifts for ${person?.name} marked as wrapped.`,
      });
    } catch (error) {
      // Error toast shown by hook
    }
  };

  const updatePersonAssignment = async (personId: string, buyerId: string | null) => {
    try {
      await updateRecipient(personId, { assigned_to: buyerId });
      
      const buyer = buyers.find(b => b.id === buyerId);
      const person = people.find(p => p.id === personId);
      
      toast({
        title: "Assignment updated",
        description: `${person?.name} ${buyerId ? `assigned to ${buyer?.name}` : 'unassigned'}.`,
      });
    } catch (error) {
      // Error toast shown by hook
    }
  };

  const getCompletionStats = (person: Person) => {
    const realGifts = person.gifts.filter(g => !g.is_placeholder);
    const placeholders = person.gifts.filter(g => g.is_placeholder);
    
    const total = realGifts.length;
    const purchased = realGifts.filter(g => g.purchased).length;
    const wrapped = realGifts.filter(g => g.wrapped).length;
    const totalCost = realGifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
    const canBeComplete = placeholders.length === 0;
    
    return { total, purchased, wrapped, totalCost, placeholderCount: placeholders.length, canBeComplete };
  };

  const handleCompletionChange = async (person: Person, completed: boolean) => {
    if (completed) {
      const stats = getCompletionStats(person);
      
      // Check for placeholders first
      if (!stats.canBeComplete) {
        toast({
          title: "Cannot complete",
          description: `${person.name} has ${stats.placeholderCount} placeholder gift${stats.placeholderCount !== 1 ? 's' : ''} that need to be decided.`,
          variant: "destructive"
        });
        return;
      }
      
      const incompletePurchased = stats.total - stats.purchased;
      const incompleteWrapped = stats.total - stats.wrapped;
      
      if (incompletePurchased > 0 || incompleteWrapped > 0) {
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
    
    confirmManualComplete(person, completed, false);
  };

  const confirmManualComplete = async (person: Person, completed: boolean, markAllComplete: boolean) => {
    try {
      if (markAllComplete) {
        await batchUpdateGifts(person.id, { purchased: true, wrapped: true });
      }
      
      await updateRecipient(person.id, {
        completed,
        manual_complete: completed
      });
      
      haptic.impact(completed ? 'medium' : 'light');
      toast({
        title: completed ? "Person completed" : "Person reopened",
        description: completed 
          ? `${person.name} is now marked as complete.`
          : `${person.name} has been reopened for editing.`,
      });
    } catch (error) {
      // Error toast shown by hook
    }
  };


  const handleManualComplete = (person: Person) => {
    handleCompletionChange(person, !person.completed);
  };

  // Filtering logic
  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = person.name.toLowerCase().includes(searchLower);
        const matchesGifts = person.gifts.some(gift => 
          gift.name.toLowerCase().includes(searchLower)
        );
        if (!matchesName && !matchesGifts) return false;
      }

      if (filters.assignedTo !== 'all') {
        if (filters.assignedTo === 'unassigned') {
          if (person.assignedTo !== null) return false;
        } else if (filters.assignedTo === 'assigned-to-me') {
          // Get current user's giver ID (profile-linked)
          const currentUserGiver = supabaseBuyers.find(g => g.profile_id === session?.user?.id);
          if (!currentUserGiver || person.assignedTo !== currentUserGiver.id) return false;
        } else {
          if (person.assignedTo !== filters.assignedTo) return false;
        }
      }

      if (filters.completion === 'completed' && !person.completed) return false;
      if (filters.completion === 'incomplete' && person.completed) return false;

      if (filters.wrapping === 'needs-wrapping') {
        const hasUnwrappedGifts = person.gifts.some(gift => gift.purchased && !gift.wrapped);
        if (!hasUnwrappedGifts) return false;
      }
      if (filters.wrapping === 'all-wrapped') {
        const allWrapped = person.gifts.length > 0 && person.gifts.every(gift => gift.wrapped);
        if (!allWrapped) return false;
      }

      if (filters.hasGifts === 'with-gifts' && person.gifts.length === 0) return false;
      if (filters.hasGifts === 'no-gifts' && person.gifts.length > 0) return false;

      if (filters.costStatus === 'missing-cost') {
        const hasMissingCosts = person.gifts.some(gift => gift.cost === null);
        if (!hasMissingCosts) return false;
      }

      if (filters.fromGiver !== 'all') {
        const hasGiftFromGiver = person.gifts.some(gift => 
          gift.givers?.some(giver => giver.id === filters.fromGiver)
        );
        if (!hasGiftFromGiver) return false;
      }

      if (filters.hasPlaceholders) {
        const hasPlaceholders = person.gifts.some(gift => gift.is_placeholder);
        if (!hasPlaceholders) return false;
      }

      if (!filters.showCompleted && person.completed) return false;

      return true;
    });
  }, [people, searchTerm, filters, session?.user?.id, supabaseBuyers]);

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
  }, [filteredPeople, sortConfig, buyers]);

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

  const scrollToLetter = (letter: string) => {
    const person = sortedAndFilteredPeople.find(person => 
      person.name.toLowerCase().startsWith(letter.toLowerCase())
    );
    if (person) {
      const element = document.getElementById(`person-${person.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHighlightedItems(new Set([`person-${person.id}`]));
        setTimeout(() => setHighlightedItems(new Set()), 2000);
      }
    }
  };

  if (householdLoading || buyersLoading) {
    return (
      <div className="p-4 sm:p-6 pb-20 max-w-full overflow-hidden flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
            givers={givers}
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

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={addPerson} className="min-h-[44px]">
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
                  className="min-h-[44px]"
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
                const isExpanded = expandedPersonId === person.id;
                const isHighlighted = highlightedItems.has(`person-${person.id}`);
                const assignedBuyer = buyers.find(b => b.id === person.assignedTo);
                const progressPercent = stats.total > 0 ? ((stats.purchased + stats.wrapped) / (stats.total * 2)) * 100 : 0;

                return (
                  <PersonContextMenu
                    key={person.id}
                    onAddGift={() => setEditingGift({ personId: person.id })}
                    onEditAssignment={() => setOpenAssignmentPopover(person.id)}
                    onMarkAllPurchased={() => markAllPurchased(person.id)}
                    onMarkAllWrapped={() => markAllWrapped(person.id)}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 flex-shrink-0"
                              onClick={() => {
                                setExpandedPersonId(isExpanded ? null : person.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <h3 
                                  className={cn(
                                    "font-medium text-lg min-w-0 truncate",
                                    person.completed && "line-through text-muted-foreground"
                                  )}
                                >
                                  {person.name}
                                </h3>
                                {person.completed && (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Gift className="h-3 w-3" />
                                  {stats.total}
                                  {stats.placeholderCount > 0 && (
                                    <span className="text-amber-600 ml-0.5">({stats.placeholderCount} TBD)</span>
                                  )}
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
                                    {formatCurrency(stats.totalCost, currency)}
                                  </span>
                                )}
                                {(() => {
                                  const personNotes = allNotes.filter(n => n.recipient_id === person.id);
                                  const notesCount = personNotes.length;
                                  return notesCount > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="flex items-center gap-1">
                                            <StickyNote className="h-3.5 w-3.5 text-amber-600/70" />
                                            <span className="text-xs">{notesCount}</span>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-xs">
                                          <p className="text-xs">{notesCount} note{notesCount !== 1 ? 's' : ''}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                })()}
                              </div>
                            </div>

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

                        {stats.total > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <div className="flex items-center gap-2">
                                <span>Progress</span>
                                {stats.placeholderCount > 0 && (
                                  <span className="flex items-center gap-1 text-amber-600">
                                    <AlertCircle className="h-3 w-3" />
                                    {stats.placeholderCount} TBD
                                  </span>
                                )}
                              </div>
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
                            <div>
                              <RecipientNotes 
                                recipientId={person.id}
                                recipientName={person.name}
                                householdId={householdId || ''}
                              />
                            </div>

                            {person.gifts.length > 0 ? (
                              <div className="space-y-3 max-w-full">
                                 <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-medium">
                                    Gifts ({person.gifts.length})
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    {templates.length > 0 && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs"
                                          >
                                            <Zap className="h-3 w-3 mr-1" />
                                            Quick Add
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                          <DropdownMenuLabel>Add from Template</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          {templates.map(template => (
                                            <DropdownMenuItem
                                              key={template.id}
                                              onClick={() => {
                                                addGift(
                                                  person.id,
                                                  template.name,
                                                  template.default_cost,
                                                  {
                                                    templateId: template.id,
                                                    giverIds: template.default_giver_ids || []
                                                  }
                                                );
                                              }}
                                            >
                                              <span className="mr-2">{template.tag_icon}</span>
                                              {template.name}
                                            </DropdownMenuItem>
                                          ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
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
                                </div>
                                {person.gifts.map((gift) => (
                                  <SwipeableGiftItem
                                    key={gift.id}
                                    gift={gift}
                                    currency={currency}
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
          <ErrorBoundary>
            <GiftForm
              key={`${editingGift.personId}-${editingGift.giftId || 'new'}`}
              isOpen={true}
              onClose={() => setEditingGift(null)}
              onSubmit={async (giftData) => {
                if (editingGift.giftId) {
                  await updateGift(editingGift.personId, editingGift.giftId, {
                    name: giftData.name,
                    cost: giftData.cost ? parseFloat(giftData.cost) : null,
                    is_placeholder: giftData.isPlaceholder,
                    template_id: giftData.templateId || null,
                  }, giftData.giverIds);
                } else {
                  await addGift(
                    editingGift.personId,
                    giftData.name,
                    giftData.cost ? parseFloat(giftData.cost) : null,
                    {
                      isPlaceholder: giftData.isPlaceholder,
                      templateId: giftData.templateId,
                      giverIds: giftData.giverIds,
                    }
                  );
                }
                setEditingGift(null);
              }}
              updateGift={updateGift}
              onDelete={editingGift.giftId ? (giftId) => {
                deleteGift(editingGift.personId, giftId);
                setEditingGift(null);
              } : undefined}
              personName={people.find(p => p.id === editingGift.personId)?.name || ''}
              currency={currency}
              editingGift={editingGift.gift}
              mode={editingGift.giftId ? 'edit' : 'add'}
              givers={givers}
              templates={templates}
            />
          </ErrorBoundary>
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
