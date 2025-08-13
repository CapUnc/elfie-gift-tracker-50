import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Gift, DollarSign, ChevronDown, ChevronRight, Filter, Settings, Package, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Link, X, Trash2, Home, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';

interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  trackingNumber?: string;
  carrier?: string;
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
  const [buyers, setBuyers] = useState<string[]>(['Matt', 'Maddie']);
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
  const [linkHelper, setLinkHelper] = useState<{ isOpen: boolean; personId: string }>({ isOpen: false, personId: '' });
  const [linkForm, setLinkForm] = useState({ text: '', url: '' });
  const [deletingGift, setDeletingGift] = useState<{ personId: string; giftId: string; giftName: string } | null>(null);
  const [completionDialog, setCompletionDialog] = useState<{
    isOpen: boolean;
    person: Person | null;
    incompleteParts: { purchased: number; wrapped: number };
  }>({ isOpen: false, person: null, incompleteParts: { purchased: 0, wrapped: 0 } });

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
      setBuyers(JSON.parse(savedBuyers));
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

  const updateGiftTracking = (personId: string, giftId: string, field: 'trackingNumber' | 'carrier', value: string) => {
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

  const toggleTracking = (giftId: string) => {
    const newExpanded = new Set(expandedTracking);
    if (newExpanded.has(giftId)) {
      newExpanded.delete(giftId);
    } else {
      newExpanded.add(giftId);
    }
    setExpandedTracking(newExpanded);
  };

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
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


  // Link helper functions
  const openLinkHelper = (personId: string) => {
    setLinkHelper({ isOpen: true, personId });
    setLinkForm({ text: '', url: '' });
  };

  const closeLinkHelper = () => {
    setLinkHelper({ isOpen: false, personId: '' });
    setLinkForm({ text: '', url: '' });
  };

  const insertLink = () => {
    if (!linkForm.text.trim() || !linkForm.url.trim()) return;
    
    const person = people.find(p => p.id === linkHelper.personId);
    if (!person) return;

    const linkMarkdown = `[${linkForm.text}](${linkForm.url})`;
    const newNotes = person.notes ? `${person.notes} ${linkMarkdown}` : linkMarkdown;
    
    updateNotes(linkHelper.personId, newNotes);
    closeLinkHelper();
  };

  // Parse and render notes with links
  const renderNotesWithLinks = (notes: string) => {
    if (!notes) return null;
    
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(notes)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(notes.slice(lastIndex, match.index));
      }
      
      // Add the link
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline"
        >
          {match[1]}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < notes.length) {
      parts.push(notes.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : notes;
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
          const aStats = getCompletionStats(a.gifts);
          const bStats = getCompletionStats(b.gifts);
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
          <div className="flex gap-4 justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Summary
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
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
                {buyers.length > 1 && (
                    <Select value={newPersonAssignment || ''} onValueChange={(value: string) => setNewPersonAssignment(value === 'unassigned' ? null : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned"></SelectItem>
                        {buyers.map(buyer => (
                          <SelectItem key={buyer} value={buyer}>{buyer}</SelectItem>
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

          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
                  >
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Filter Options</h4>
                  
                   {/* Assignment Filter */}
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
                             <SelectItem key={buyer} value={buyer}>{buyer}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                   )}

                  {/* Completion Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Purchase Status</label>
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

                   {/* Wrapping Filter */}
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

                   {/* Show Completed Filter */}
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="showCompleted"
                       checked={filters.showCompleted}
                       onChange={(e) => setFilters(prev => ({ ...prev, showCompleted: e.target.checked }))}
                       className="rounded border-gray-300"
                     />
                      <label htmlFor="showCompleted" className="text-sm font-medium">
                        Include recipients you've finished shopping for
                      </label>
                   </div>
                 </div>

                {/* Clear Filters Button */}
                {getActiveFilterCount() > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={clearAllFilters}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear all filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Name {getSortIcon('name')}
                  </Button>
                </TableHead>
                {buyers.length > 1 && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('assignedTo')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Assigned {getSortIcon('assignedTo')}
                    </Button>
                  </TableHead>
                )}
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('totalCost')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Total Cost {getSortIcon('totalCost')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('progress')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Progress {getSortIcon('progress')}
                  </Button>
                </TableHead>
                <TableHead>
                  <span className="font-semibold">Notes</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredPeople.map((person) => {
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
                       <TableCell className="font-medium">
                         <div className="flex items-center gap-2">
                           <span className={person.completed ? "line-through text-muted-foreground" : ""}>{person.name}</span>
                           {person.completed && <CheckCircle className="w-4 h-4 text-christmas-green" />}
                            <input
                              type="checkbox"
                              checked={person.completed || false}
                              onChange={(e) => handleCompletionChange(person, e.target.checked)}
                              className="ml-auto rounded border-gray-300"
                              title="Mark shopping complete for this person"
                            />
                         </div>
                       </TableCell>
                      {buyers.length > 1 && (
                        <TableCell>
                          <Select 
                            value={person.assignedTo === null ? 'unassigned' : person.assignedTo} 
                            onValueChange={(value: string) => updateAssignment(person.id, value === 'unassigned' ? null : value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Assign to" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned"></SelectItem>
                              {buyers.map(buyer => (
                                <SelectItem key={buyer} value={buyer}>{buyer}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                       <TableCell>
                         <div className="flex items-center gap-1">
                           <DollarSign className="w-4 h-4 text-christmas-gold" />
                           <span className="font-semibold text-christmas-gold">
                             {formatCurrency(totalCost, currency)}
                           </span>
                           {getGiftsWithoutCost(person.gifts) > 0 && (
                             <div title={`${getGiftsWithoutCost(person.gifts)} gift(s) without cost`}>
                               <AlertCircle className="w-4 h-4 text-amber-500 ml-1" />
                             </div>
                           )}
                         </div>
                       </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            🛒 {stats.purchased}/{stats.total}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            🎁 {stats.wrapped}/{stats.total}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Ideas, order numbers, links, gift notes, tracking info..."
                              value={person.notes}
                              onChange={(e) => updateNotes(person.id, e.target.value)}
                              className="min-h-[40px] text-sm flex-1"
                            />
                            <Popover open={linkHelper.isOpen && linkHelper.personId === person.id} onOpenChange={(open) => open ? openLinkHelper(person.id) : closeLinkHelper()}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="px-2">
                                  <Link className="w-4 h-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-medium">Add Link</h4>
                                    <Button variant="ghost" size="sm" onClick={closeLinkHelper} className="h-auto p-1">
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    <Input
                                      placeholder="Link text (e.g., Order #123456)"
                                      value={linkForm.text}
                                      onChange={(e) => setLinkForm(prev => ({ ...prev, text: e.target.value }))}
                                    />
                                    <Input
                                      placeholder="URL (e.g., https://...)"
                                      value={linkForm.url}
                                      onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                                    />
                                    <Button onClick={insertLink} className="w-full" size="sm">
                                      Insert Link
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          {person.notes && (
                            <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded border">
                              {renderNotesWithLinks(person.notes)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded row content */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={buyers.length > 1 ? 6 : 5} className="bg-muted/30">
                          <div className="p-4 space-y-4">
                            <h4 className="font-medium text-sm text-muted-foreground">Gifts for {person.name}</h4>
                            
                            {/* Gifts List */}
                            <div className="space-y-3">
                              {person.gifts.map((gift) => (
                                <div key={gift.id} className="border rounded-lg p-3 bg-card">
                                   <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{gift.name}</span>
                                        {gift.cost === null && (
                                          <div title="Cost not set">
                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                          </div>
                                        )}
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
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
                                       <span className="text-sm text-christmas-gold font-semibold">
                                         {gift.cost === null ? 'TBD' : formatCurrency(gift.cost, currency)}
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
                                                 value={gift.carrier || ''} 
                                                 onValueChange={(value) => updateGiftTracking(person.id, gift.id, 'carrier', value)}
                                               >
                                                 <SelectTrigger className="w-24 h-8 text-xs">
                                                   <SelectValue placeholder="Carrier" />
                                                 </SelectTrigger>
                                                 <SelectContent>
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
                                                 onChange={(e) => updateGiftTracking(person.id, gift.id, 'trackingNumber', e.target.value)}
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
                              ))}
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
              className="bg-gradient-festive hover:opacity-90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Person
            </Button>
          </div>
        )}

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

export default GiftTracker;