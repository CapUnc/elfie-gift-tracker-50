import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Gift as GiftIcon, DollarSign, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, X, Package, CheckCircle, Check, ShoppingCart, StickyNote } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
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
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { GiftForm } from './GiftForm';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { useGivers } from '@/hooks/useGivers';
import { useRecipients } from '@/hooks/useRecipients';
import { useGifts } from '@/hooks/useGifts';
import { supabase } from '@/integrations/supabase/client';
import type { Gift, Giver, Person, SearchFilters, SortConfig } from '@/types/gift';

const GiftTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const haptic = useHapticFeedback();
  const { session } = useAuth();
  const { householdId, loading: householdLoading } = useHousehold(session?.user?.id);
  const isMobile = useIsMobile();
  
  // Supabase hooks
  const { givers: supabaseGivers, loading: giversLoading } = useGivers(householdId);
  const { recipients: supabaseRecipients, updateRecipient, addRecipient } = useRecipients(householdId);
  const { gifts: supabaseGifts, addGift: addGiftToDb, updateGift: updateGiftInDb, updateGiftStatus: updateGiftStatusInDb, deleteGift: deleteGiftFromDb, duplicateGift: duplicateGiftInDb, batchUpdateGifts } = useGifts(householdId);
  
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
  const [editingGift, setEditingGift] = useState<{ personId: string; giftId?: string; gift?: Gift } | null>(null);
  
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    assignedTo: 'all',
    completion: 'all',
    wrapping: 'all',
    showCompleted: false,
    hasGifts: 'all',
    costStatus: 'all'
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [completionDialog, setCompletionDialog] = useState<{
    isOpen: boolean;
    person: Person | null;
    incompleteParts: { purchased: number; wrapped: number };
  }>({
    isOpen: false,
    person: null,
    incompleteParts: { purchased: 0, wrapped: 0 }
  });

  const animateButton = useAnimatedButton();

  // Transform Supabase data into local format
  const buyers: Giver[] = supabaseGivers;
  
  const people: Person[] = useMemo(() => {
    return supabaseRecipients.map(recipient => ({
      id: recipient.id,
      name: recipient.name,
      notes: recipient.notes,
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
          assigned_to: gift.assigned_to || undefined,
          is_placeholder: gift.is_placeholder,
          recipient_id: gift.recipient_id,
          givers: gift.givers || [],
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
        if (data?.currency) setCurrency(data.currency);
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
        await addRecipient(newPersonName.trim(), null);
        setNewPersonName('');
        setIsAddPersonOpen(false);
        setUnsavedChanges(false);
        haptic.impact('light');
        toast({ title: "Person added", description: `${newPersonName.trim()} has been added to your gift list.` });
      } catch (error) {
        // Error toast shown by hook
      }
    }
  };

  const addGift = async (personId: string, name: string, cost: number | null, giverIds: string[] = [], isPlaceholder: boolean = false) => {
    if (name.trim() && householdId) {
      try {
        const gift = await addGiftToDb(personId, name.trim(), cost, { is_placeholder: isPlaceholder });
        
        // Batch assign givers
        if (gift && giverIds.length > 0) {
          await supabase.from('gift_givers').insert(
            giverIds.map(giverId => ({ gift_id: gift.id, giver_id: giverId }))
          );
        }
        
        setEditingGift(null);
        haptic.impact('light');
        toast({ title: "Gift added", description: `"${name.trim()}" has been added to the list.` });
      } catch (error) {
        // Error toast shown by hook
      }
    }
  };

  const updateGift = async (personId: string, giftId: string, updatedGift: Partial<Gift>, giverIds?: string[]) => {
    try {
      await updateGiftInDb(giftId, updatedGift);
      if (giverIds !== undefined) {
        await supabase.from('gift_givers').delete().eq('gift_id', giftId);
        if (giverIds.length > 0) {
          await supabase.from('gift_givers').insert(
            giverIds.map(giverId => ({ gift_id: giftId, giver_id: giverId }))
          );
        }
      }
      haptic.impact('light');
      toast({ title: "Gift updated", description: "Gift details have been saved." });
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
        const action = value ? (field === 'purchased' ? 'purchased' : 'wrapped') : (field === 'purchased' ? 'unpurchased' : 'unwrapped');
        toast({ title: `${gift.name} ${action}`, description: `Status updated for ${person?.name}`, duration: 2000 });
      }
    } catch (error) { /* hook handles */ }
  };

  const deleteGift = async (personId: string, giftId: string) => {
    try {
      await deleteGiftFromDb(giftId);
      haptic.impact('medium');
      toast({ title: "Gift removed", description: "The gift has been deleted from the list." });
    } catch (error) { /* hook handles */ }
  };

  const duplicateGift = async (personId: string, giftId: string) => {
    try {
      await duplicateGiftInDb(giftId);
      haptic.impact('light');
      toast({ title: "Gift duplicated", description: "Gift has been duplicated." });
    } catch (error) { /* hook handles */ }
  };

  const markAllPurchased = async (personId: string) => {
    try {
      await batchUpdateGifts(personId, { purchased: true });
      haptic.impact('medium');
      const person = people.find(p => p.id === personId);
      toast({ title: "All gifts purchased", description: `All gifts for ${person?.name} marked as purchased.` });
    } catch (error) { /* hook handles */ }
  };

  const markAllWrapped = async (personId: string) => {
    try {
      await batchUpdateGifts(personId, { wrapped: true });
      haptic.impact('medium');
      const person = people.find(p => p.id === personId);
      toast({ title: "All gifts wrapped", description: `All gifts for ${person?.name} marked as wrapped.` });
    } catch (error) { /* hook handles */ }
  };

  const getCompletionStats = (person: Person) => {
    const total = person.gifts.length;
    const purchased = person.gifts.filter(g => g.purchased).length;
    const wrapped = person.gifts.filter(g => g.wrapped).length;
    const totalCost = person.gifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
    return { total, purchased, wrapped, totalCost };
  };

  const handleCompletionChange = async (person: Person, completed: boolean) => {
    if (completed) {
      const stats = getCompletionStats(person);
      const incompletePurchased = stats.total - stats.purchased;
      const incompleteWrapped = stats.total - stats.wrapped;
      if (incompletePurchased > 0 || incompleteWrapped > 0) {
        setCompletionDialog({ isOpen: true, person, incompleteParts: { purchased: incompletePurchased, wrapped: incompleteWrapped } });
        return;
      }
    }
    confirmManualComplete(person, completed, false);
  };

  const confirmManualComplete = async (person: Person, completed: boolean, markAllComplete: boolean) => {
    try {
      if (markAllComplete) await batchUpdateGifts(person.id, { purchased: true, wrapped: true });
      await updateRecipient(person.id, { completed, manual_complete: completed });
      haptic.impact(completed ? 'medium' : 'light');
      toast({
        title: completed ? "Person completed" : "Person reopened",
        description: completed ? `${person.name} is now marked as complete.` : `${person.name} has been reopened for editing.`,
      });
    } catch (error) { /* hook handles */ }
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
        const matchesGifts = person.gifts.some(gift => gift.name.toLowerCase().includes(searchLower));
        if (!matchesName && !matchesGifts) return false;
      }
      if (filters.assignedTo !== 'all') {
        if (filters.assignedTo === 'my-gifts') {
          const currentUserGiver = supabaseGivers.find(g => g.profile_id === session?.user?.id);
          if (!currentUserGiver) return false;
          if (!person.gifts.some(gift => gift.givers?.some(giver => giver.id === currentUserGiver.id))) return false;
        } else {
          if (!person.gifts.some(gift => gift.givers?.some(giver => giver.id === filters.assignedTo))) return false;
        }
      }
      if (filters.completion === 'completed' && !person.completed) return false;
      if (filters.completion === 'incomplete' && person.completed) return false;
      if (filters.wrapping === 'needs-wrapping' && !person.gifts.some(gift => gift.purchased && !gift.wrapped)) return false;
      if (filters.wrapping === 'all-wrapped' && !(person.gifts.length > 0 && person.gifts.every(gift => gift.wrapped))) return false;
      if (filters.hasGifts === 'with-gifts' && person.gifts.length === 0) return false;
      if (filters.hasGifts === 'no-gifts' && person.gifts.length > 0) return false;
      if (filters.costStatus === 'missing-cost' && !person.gifts.some(gift => gift.cost === null)) return false;
      if (!filters.showCompleted && person.completed) return false;
      return true;
    });
  }, [people, searchTerm, filters]);

  // Sorting logic (removed stale 'assignment' case)
  const sortedAndFilteredPeople = useMemo(() => {
    return [...filteredPeople].sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      switch (sortConfig.key) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'cost': {
          const aCost = a.gifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
          const bCost = b.gifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
          return direction * (aCost - bCost);
        }
        case 'progress': {
          const aStats = getCompletionStats(a);
          const bStats = getCompletionStats(b);
          const aProgress = aStats.total > 0 ? aStats.purchased / aStats.total : 0;
          const bProgress = bStats.total > 0 ? bStats.purchased / bStats.total : 0;
          return direction * (aProgress - bProgress);
        }
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
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const scrollToLetter = (letter: string) => {
    const person = sortedAndFilteredPeople.find(p => p.name.toLowerCase().startsWith(letter.toLowerCase()));
    if (person) {
      const element = document.getElementById(`person-${person.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHighlightedItems(new Set([`person-${person.id}`]));
        setTimeout(() => setHighlightedItems(new Set()), 2000);
      }
    }
  };

  if (householdLoading || giversLoading) {
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
                <GiftIcon className="h-5 w-5 text-christmas-red flex-shrink-0" />
                <span className="truncate">Gift Tracker</span>
              </h1>
              <p className="text-sm text-muted-foreground">Manage holiday gifts</p>
            </div>
          </div>

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
                <Button variant="ghost" size="sm" onClick={() => setShowLegend(false)} className="h-auto p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

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
              <Input
                placeholder="Person's name"
                value={newPersonName}
                onChange={(e) => {
                  setNewPersonName(e.target.value);
                  setUnsavedChanges(e.target.value.trim() !== '');
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') addPerson(); }}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={addPerson} className="min-h-[44px]">Add Person</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (unsavedChanges && newPersonName.trim()) {
                      setShowCancelDialog(true);
                    } else {
                      setIsAddPersonOpen(false);
                      setNewPersonName('');
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

        {/* Cancel Confirmation Dialog (replaces window.confirm) */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to cancel?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Editing</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setIsAddPersonOpen(false);
                setNewPersonName('');
                setUnsavedChanges(false);
                setShowCancelDialog(false);
              }}>
                Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <FloatingActionButton 
          onClick={() => setIsAddPersonOpen(true)} 
          isVisible={!isAddPersonOpen && !editingGift}
        />

        {/* Main Content Area with Alphabet Index */}
        <div className="flex gap-4 max-w-full overflow-hidden">
          {sortedAndFilteredPeople.length > 10 && (
            <div className="hidden lg:block flex-shrink-0">
              <AlphabetIndex people={sortedAndFilteredPeople} onLetterClick={scrollToLetter} />
            </div>
          )}

          <div className="flex-1 space-y-4 min-w-0">
            {sortedAndFilteredPeople.length === 0 ? (
              <div className="text-center py-12">
                <GiftIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No people found</h3>
                <p className="text-sm text-muted-foreground">
                  {people.length === 0 ? "Add your first person to start tracking gifts" : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              sortedAndFilteredPeople.map((person) => {
                const stats = getCompletionStats(person);
                const isExpanded = expandedPersonId === person.id;
                const isHighlighted = highlightedItems.has(`person-${person.id}`);
                const progressPercent = stats.total > 0 ? ((stats.purchased + stats.wrapped) / (stats.total * 2)) * 100 : 0;

                return (
                  <PersonContextMenu
                    key={person.id}
                    onAddGift={() => setEditingGift({ personId: person.id })}
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
                      <div 
                        className={cn("p-4 border-b bg-muted/30", isMobile && "cursor-pointer")}
                        onClick={(e) => {
                          if (!isMobile) return;
                          const target = e.target as HTMLElement;
                          if (target.closest('button') || target.closest('[role="button"]')) return;
                          setExpandedPersonId(isExpanded ? null : person.id);
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" onClick={() => setExpandedPersonId(isExpanded ? null : person.id)}>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <h3 className={cn("font-medium text-lg min-w-0 truncate", person.completed && "line-through text-muted-foreground")}>
                                  {person.name}
                                </h3>
                                {person.completed && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                              </div>

                              <div className="space-y-2 mt-1">
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1"><GiftIcon className="h-3 w-3" />{stats.total}</span>
                                  <span className="flex items-center gap-1"><ShoppingCart className="h-3 w-3" />{stats.purchased}/{stats.total}</span>
                                  <span className="flex items-center gap-1"><Package className="h-3 w-3" />{stats.wrapped}/{stats.total}</span>
                                  {stats.totalCost > 0 && (
                                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(stats.totalCost, '')}</span>
                                  )}
                                </div>
                                
                                {(() => {
                                  const personNotes = allNotes.filter(n => n.recipient_id === person.id);
                                  const notesCount = personNotes.length;
                                  const giverMap = new Map<string, Giver>();
                                  person.gifts.forEach(gift => {
                                    gift.givers?.forEach(giver => { if (!giverMap.has(giver.id)) giverMap.set(giver.id, giver); });
                                  });
                                  const uniqueGivers = Array.from(giverMap.values());
                                  const hasContent = notesCount > 0 || uniqueGivers.length > 0;
                                  
                                  return hasContent && (
                                    <div className="flex items-center gap-3">
                                      {uniqueGivers.length > 0 && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center -space-x-2">
                                              {uniqueGivers.map((giver, idx) => (
                                                <div key={giver.id} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-background text-xs" style={{ zIndex: uniqueGivers.length - idx }}>
                                                  {giver.icon}
                                                </div>
                                              ))}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Givers: {uniqueGivers.map(g => g.name).join(', ')}</p></TooltipContent>
                                        </Tooltip>
                                      )}
                                      {notesCount > 0 && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge variant="secondary" className="flex-shrink-0">{notesCount} {notesCount === 1 ? 'note' : 'notes'}</Badge>
                                          </TooltipTrigger>
                                          <TooltipContent><p>Click to view and manage notes</p></TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleManualComplete(person)}
                                    className={cn(
                                      "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors",
                                      person.completed
                                        ? "bg-green-600 border-green-600 text-white"
                                        : "border-muted-foreground/30 hover:border-green-600 hover:bg-green-50 text-muted-foreground/40 hover:text-green-600"
                                    )}
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>{person.completed ? 'Mark as incomplete' : 'Mark as complete'}</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>

                        {stats.total > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Progress</span>
                              <span>{Math.round(progressPercent)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                            </div>
                          </div>
                        )}
                      </div>

                      <Collapsible open={isExpanded}>
                        <CollapsibleContent>
                          <div className="p-4 space-y-4">
                            <RecipientNotes recipientId={person.id} recipientName={person.name} householdId={householdId || ''} />

                            {person.gifts.length > 0 ? (
                              <div className="space-y-3 max-w-full">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-medium">Gifts ({person.gifts.length})</h4>
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditingGift({ personId: person.id })} aria-label={`Add gift for ${person.name}`}>
                                    <Plus className="h-3 w-3 mr-1" />Add Gift
                                  </Button>
                                </div>
                                {person.gifts.map((gift) => (
                                  <SwipeableGiftItem
                                    key={gift.id}
                                    gift={gift}
                                    currency={currency}
                                    onUpdate={(giftId, field, value) => updateGiftStatus(person.id, giftId, field, value)}
                                    onDelete={(giftId) => deleteGift(person.id, giftId)}
                                    onEdit={(giftId) => setEditingGift({ personId: person.id, giftId, gift })}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">
                                <GiftIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No gifts added yet</p>
                                <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditingGift({ personId: person.id })}>
                                  <Plus className="h-4 w-4 mr-1" />Add Gift
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

        {/* Gift Form */}
        {editingGift && (
          <GiftForm
            key={`${editingGift.personId}-${editingGift.giftId || 'new'}`}
            isOpen={true}
            onClose={() => setEditingGift(null)}
            onSubmit={async (giftData) => {
              if (editingGift.giftId) {
                await updateGift(editingGift.personId, editingGift.giftId, {
                  name: giftData.name,
                  cost: giftData.cost ? parseFloat(giftData.cost) : null,
                  is_placeholder: giftData.isPlaceholder
                } as Partial<Gift>, giftData.giverIds);
              } else {
                await addGift(editingGift.personId, giftData.name, giftData.cost ? parseFloat(giftData.cost) : null, giftData.giverIds, giftData.isPlaceholder);
              }
              setEditingGift(null);
            }}
            onDelete={editingGift.giftId ? (giftId) => { deleteGift(editingGift.personId, giftId); setEditingGift(null); } : undefined}
            personName={people.find(p => p.id === editingGift.personId)?.name || ''}
            currency={currency}
            editingGift={editingGift.gift}
            mode={editingGift.giftId ? 'edit' : 'add'}
            availableGivers={buyers}
          />
        )}

        {/* Completion Dialog */}
        <AlertDialog open={completionDialog.isOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Person</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>{completionDialog.person?.name} still has:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {completionDialog.incompleteParts.purchased > 0 && (
                    <li>{completionDialog.incompleteParts.purchased} gift{completionDialog.incompleteParts.purchased > 1 ? 's' : ''} not purchased</li>
                  )}
                  {completionDialog.incompleteParts.wrapped > 0 && (
                    <li>{completionDialog.incompleteParts.wrapped} gift{completionDialog.incompleteParts.wrapped > 1 ? 's' : ''} not wrapped</li>
                  )}
                </ul>
                <p className="text-sm">Would you like to mark all remaining gifts as purchased and wrapped, or just mark as complete anyway?</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={() => setCompletionDialog({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } })}>Cancel</AlertDialogCancel>
              <Button variant="outline" onClick={() => {
                if (completionDialog.person) confirmManualComplete(completionDialog.person, true, false);
                setCompletionDialog({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } });
              }}>Mark Complete Anyway</Button>
              <AlertDialogAction onClick={() => {
                if (completionDialog.person) confirmManualComplete(completionDialog.person, true, true);
                setCompletionDialog({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } });
              }}>Complete All Gifts</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default GiftTracker;
