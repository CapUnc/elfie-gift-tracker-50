import React, { useState, useEffect, useMemo } from 'react';
import { Gift as GiftIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import FloatingActionButton from './FloatingActionButton';
import { GiftSearch } from './GiftSearch';
import { GiftForm } from './GiftForm';
import { useAuthContext } from '@/contexts/AuthContext';
import { useHouseholdContext } from '@/contexts/HouseholdContext';
import { useGivers } from '@/hooks/useGivers';
import { useRecipients } from '@/hooks/useRecipients';
import { useGifts } from '@/hooks/useGifts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import type { Gift, Giver, Person, SearchFilters, SortConfig } from '@/types/gift';

import AddPersonDialog from './gifts/AddPersonDialog';
import CompletionDialog from './gifts/CompletionDialog';
import RecipientList from './gifts/RecipientList';
import { getCompletionStats } from './gifts/RecipientCard';

const GiftTracker = () => {
  const { toast } = useToast();
  const haptic = useHapticFeedback();
  const { session } = useAuthContext();
  const { householdId, loading: householdLoading } = useHouseholdContext();
  const { givers: supabaseGivers, loading: giversLoading } = useGivers(householdId);
  const { recipients: supabaseRecipients, updateRecipient, addRecipient } = useRecipients(householdId);
  const { gifts: supabaseGifts, addGift: addGiftToDb, updateGift: updateGiftInDb, updateGiftStatus: updateGiftStatusInDb, deleteGift: deleteGiftFromDb, duplicateGift: duplicateGiftInDb, batchUpdateGifts } = useGifts(householdId);

  const { data: allNotes = [] } = useQuery({
    queryKey: ['all-recipient-notes', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data } = await supabase.from('recipient_notes').select('*').eq('household_id', householdId);
      return data || [];
    },
    enabled: !!householdId,
  });

  // Local UI state
  const [currency, setCurrency] = useState('$');
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<{ personId: string; giftId?: string; gift?: Gift } | null>(null);
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    assignedTo: 'all', completion: 'all', wrapping: 'all',
    showCompleted: false, hasGifts: 'all', costStatus: 'all',
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [highlightedItems, setHighlightedItems] = useState<Set<string>>(new Set());
  const [completionDialog, setCompletionDialog] = useState<{
    isOpen: boolean; person: Person | null;
    incompleteParts: { purchased: number; wrapped: number };
  }>({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } });

  const buyers: Giver[] = supabaseGivers;

  const people: Person[] = useMemo(() => {
    return supabaseRecipients.map(recipient => ({
      id: recipient.id, name: recipient.name, notes: recipient.notes,
      completed: recipient.completed, manualComplete: recipient.manual_complete,
      gifts: supabaseGifts
        .filter(gift => gift.recipient_id === recipient.id)
        .map(gift => ({
          id: gift.id, name: gift.name, cost: gift.cost,
          purchased: gift.purchased, wrapped: gift.wrapped,
          url: gift.url || undefined, tracking: gift.tracking || undefined,
          assigned_to: gift.assigned_to || undefined,
          is_placeholder: gift.is_placeholder, recipient_id: gift.recipient_id,
          givers: gift.givers || [],
        })),
    }));
  }, [supabaseRecipients, supabaseGifts]);

  // Load currency
  useEffect(() => {
    const fetchCurrency = async () => {
      if (!householdId) return;
      try {
        const { data, error } = await supabase.from('households').select('currency').eq('id', householdId).single();
        if (error) throw error;
        if (data?.currency) setCurrency(data.currency);
      } catch (error) { console.error('Error fetching currency:', error); }
    };
    fetchCurrency();
  }, [householdId]);

  // Handle navigation state from Summary page
  useEffect(() => {
    const state = window.history.state?.usr?.state;
    if (state?.applyFilter) {
      switch (state.applyFilter) {
        case 'people-incomplete': case 'needs-purchase':
          setFilters(prev => ({ ...prev, completion: 'incomplete' })); break;
        case 'needs-wrapping':
          setFilters(prev => ({ ...prev, wrapping: 'needs-wrapping' })); break;
        case 'missing-cost':
          setFilters(prev => ({ ...prev, costStatus: 'missing-cost' })); break;
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
    if (!hasSeenLegend) { setShowLegend(true); localStorage.setItem('christmas-gifts-legend-seen', 'true'); }
  }, []);

  // --- Action handlers ---

  const handleAddPerson = async (name: string) => {
    if (householdId) {
      await addRecipient(name, null);
      setIsAddPersonOpen(false);
      haptic.impact('light');
      toast({ title: 'Person added', description: `${name} has been added to your gift list.` });
    }
  };

  const addGift = async (personId: string, name: string, cost: number | null, giverIds: string[] = [], isPlaceholder = false) => {
    if (name.trim() && householdId) {
      try {
        const gift = await addGiftToDb(personId, name.trim(), cost, { is_placeholder: isPlaceholder });
        if (gift && giverIds.length > 0) {
          await supabase.from('gift_givers').insert(giverIds.map(giverId => ({ gift_id: gift.id, giver_id: giverId })));
        }
        setEditingGift(null);
        haptic.impact('light');
        toast({ title: 'Gift added', description: `"${name.trim()}" has been added to the list.` });
      } catch { /* hook handles */ }
    }
  };

  const updateGift = async (personId: string, giftId: string, updatedGift: Partial<Gift>, giverIds?: string[]) => {
    try {
      await updateGiftInDb(giftId, updatedGift);
      if (giverIds !== undefined) {
        await supabase.from('gift_givers').delete().eq('gift_id', giftId);
        if (giverIds.length > 0) {
          await supabase.from('gift_givers').insert(giverIds.map(giverId => ({ gift_id: giftId, giver_id: giverId })));
        }
      }
      haptic.impact('light');
      toast({ title: 'Gift updated', description: 'Gift details have been saved.' });
    } catch { /* hook handles */ }
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
    } catch { /* hook handles */ }
  };

  const deleteGift = async (personId: string, giftId: string) => {
    try { await deleteGiftFromDb(giftId); haptic.impact('medium'); toast({ title: 'Gift removed', description: 'The gift has been deleted from the list.' }); }
    catch { /* hook handles */ }
  };

  const markAllPurchased = async (personId: string) => {
    try { await batchUpdateGifts(personId, { purchased: true }); haptic.impact('medium');
      toast({ title: 'All gifts purchased', description: `All gifts marked as purchased.` }); }
    catch { /* hook handles */ }
  };

  const markAllWrapped = async (personId: string) => {
    try { await batchUpdateGifts(personId, { wrapped: true }); haptic.impact('medium');
      toast({ title: 'All gifts wrapped', description: `All gifts marked as wrapped.` }); }
    catch { /* hook handles */ }
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
      toast({ title: completed ? 'Person completed' : 'Person reopened', description: completed ? `${person.name} is now marked as complete.` : `${person.name} has been reopened for editing.` });
    } catch { /* hook handles */ }
  };

  const handleToggleComplete = (person: Person) => handleCompletionChange(person, !person.completed);

  // --- Filtering & sorting ---

  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!person.name.toLowerCase().includes(s) && !person.gifts.some(g => g.name.toLowerCase().includes(s))) return false;
      }
      if (filters.assignedTo !== 'all') {
        if (filters.assignedTo === 'my-gifts') {
          const currentUserGiver = supabaseGivers.find(g => g.profile_id === session?.user?.id);
          if (!currentUserGiver || !person.gifts.some(gift => gift.givers?.some(giver => giver.id === currentUserGiver.id))) return false;
        } else {
          if (!person.gifts.some(gift => gift.givers?.some(giver => giver.id === filters.assignedTo))) return false;
        }
      }
      if (filters.completion === 'completed' && !person.completed) return false;
      if (filters.completion === 'incomplete' && person.completed) return false;
      if (filters.wrapping === 'needs-wrapping' && !person.gifts.some(g => g.purchased && !g.wrapped)) return false;
      if (filters.wrapping === 'all-wrapped' && !(person.gifts.length > 0 && person.gifts.every(g => g.wrapped))) return false;
      if (filters.hasGifts === 'with-gifts' && person.gifts.length === 0) return false;
      if (filters.hasGifts === 'no-gifts' && person.gifts.length > 0) return false;
      if (filters.costStatus === 'missing-cost' && !person.gifts.some(g => g.cost === null)) return false;
      if (!filters.showCompleted && person.completed) return false;
      return true;
    });
  }, [people, searchTerm, filters, supabaseGivers, session?.user?.id]);

  const sortedAndFilteredPeople = useMemo(() => {
    return [...filteredPeople].sort((a, b) => {
      const d = sortConfig.direction === 'asc' ? 1 : -1;
      switch (sortConfig.key) {
        case 'name': return d * a.name.localeCompare(b.name);
        case 'cost': return d * (a.gifts.reduce((s, g) => s + (g.cost || 0), 0) - b.gifts.reduce((s, g) => s + (g.cost || 0), 0));
        case 'progress': {
          const aP = a.gifts.length > 0 ? a.gifts.filter(g => g.purchased).length / a.gifts.length : 0;
          const bP = b.gifts.length > 0 ? b.gifts.filter(g => g.purchased).length / b.gifts.length : 0;
          return d * (aP - bP);
        }
        default: return 0;
      }
    });
  }, [filteredPeople, sortConfig]);

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
        {/* Header */}
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
                  <div className="flex items-center gap-2"><span className="text-lg">🛒</span><span className="text-muted-foreground">Purchased</span></div>
                  <div className="flex items-center gap-2"><span className="text-lg">🎁</span><span className="text-muted-foreground">Wrapped</span></div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowLegend(false)} className="h-auto p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <GiftSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} filters={filters} onFiltersChange={setFilters} buyers={buyers} />
        </div>

        <AddPersonDialog isOpen={isAddPersonOpen} onOpenChange={setIsAddPersonOpen} onAddPerson={handleAddPerson} />

        <FloatingActionButton onClick={() => setIsAddPersonOpen(true)} isVisible={!isAddPersonOpen && !editingGift} />

        <RecipientList
          people={sortedAndFilteredPeople}
          allPeopleCount={people.length}
          expandedPersonId={expandedPersonId}
          highlightedItems={highlightedItems}
          currency={currency}
          householdId={householdId || ''}
          allNotes={allNotes}
          onToggleExpand={(id) => setExpandedPersonId(expandedPersonId === id ? null : id)}
          onAddGift={(personId) => setEditingGift({ personId })}
          onEditGift={(personId, giftId, gift) => setEditingGift({ personId, giftId, gift })}
          onUpdateGiftStatus={updateGiftStatus}
          onDeleteGift={deleteGift}
          onMarkAllPurchased={markAllPurchased}
          onMarkAllWrapped={markAllWrapped}
          onToggleComplete={handleToggleComplete}
          onScrollToLetter={scrollToLetter}
        />

        {editingGift && (
          <GiftForm
            key={`${editingGift.personId}-${editingGift.giftId || 'new'}`}
            isOpen={true}
            onClose={() => setEditingGift(null)}
            onSubmit={async (giftData) => {
              if (editingGift.giftId) {
                await updateGift(editingGift.personId, editingGift.giftId, {
                  name: giftData.name, cost: giftData.cost ? parseFloat(giftData.cost) : null,
                  is_placeholder: giftData.isPlaceholder,
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

        <CompletionDialog
          state={completionDialog}
          onClose={() => setCompletionDialog({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } })}
          onMarkCompleteAnyway={(person) => confirmManualComplete(person, true, false)}
          onCompleteAllGifts={(person) => confirmManualComplete(person, true, true)}
        />
      </div>
    </div>
  );
};

export default GiftTracker;
