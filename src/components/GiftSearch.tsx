import React, { useState, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Buyer {
  id: string;
  name: string;
  icon: string;
}

interface SearchFilters {
  assignedTo: string;
  completion: 'all' | 'completed' | 'incomplete';
  wrapping: 'all' | 'needs-wrapping' | 'all-wrapped';
  showCompleted: boolean;
  hasGifts: 'all' | 'with-gifts' | 'no-gifts';
  costStatus: 'all' | 'missing-cost';
}

interface GiftSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  buyers: Buyer[];
}

export const GiftSearch: React.FC<GiftSearchProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  buyers
}) => {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (buyers.length > 1 && filters.assignedTo !== 'all') count++;
    if (filters.completion !== 'all') count++;
    if (filters.wrapping !== 'all') count++;
    if (filters.hasGifts !== 'all') count++;
    if (filters.costStatus !== 'all') count++;
    // Don't count showCompleted in the filter count
    return count;
  }, [filters, buyers.length]);

  const clearAllFilters = () => {
    onFiltersChange({
      assignedTo: 'all',
      completion: 'all',
      wrapping: 'all',
      showCompleted: true,
      hasGifts: 'all',
      costStatus: 'all'
    });
  };

  const clearSearch = () => {
    onSearchChange('');
  };

  const activeFilterChips = useMemo(() => {
    const chips = [];
    
    if (filters.assignedTo !== 'all') {
      const buyer = buyers.find(b => b.id === filters.assignedTo);
      let label = filters.assignedTo;
      if (buyer) {
        label = `${buyer.icon} ${buyer.name}`;
      } else if (filters.assignedTo === 'unassigned') {
        label = 'Unassigned';
      } else if (filters.assignedTo === 'assigned-to-me') {
        label = 'Assigned to me';
      }
      chips.push({
        id: 'assignedTo',
        label,
        onRemove: () => onFiltersChange({ ...filters, assignedTo: 'all' })
      });
    }
    
    if (filters.completion !== 'all') {
      chips.push({
        id: 'completion',
        label: filters.completion === 'completed' ? 'Fully purchased' : 'Needs shopping',
        onRemove: () => onFiltersChange({ ...filters, completion: 'all' })
      });
    }
    
    if (filters.wrapping !== 'all') {
      chips.push({
        id: 'wrapping', 
        label: filters.wrapping === 'needs-wrapping' ? 'Needs wrapping' : 'Fully wrapped',
        onRemove: () => onFiltersChange({ ...filters, wrapping: 'all' })
      });
    }
    
    if (filters.hasGifts !== 'all') {
      chips.push({
        id: 'hasGifts',
        label: filters.hasGifts === 'with-gifts' ? 'Has gifts' : 'No gifts',
        onRemove: () => onFiltersChange({ ...filters, hasGifts: 'all' })
      });
    }

    if (filters.costStatus !== 'all') {
      chips.push({
        id: 'costStatus',
        label: 'Missing cost',
        onRemove: () => onFiltersChange({ ...filters, costStatus: 'all' })
      });
    }
    
    return chips;
  }, [filters, buyers, onFiltersChange]);

  return (
    <div className="space-y-3">
      {/* Search Bar - Own Row */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search recipients..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Filter Sheet Trigger */}
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap h-8 px-3 relative flex-shrink-0"
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="text-sm">Filter</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs h-4 min-w-4 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filter Options</SheetTitle>
              <SheetDescription>
                Choose filters to narrow down your recipient list
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 py-6">
              {buyers.length > 1 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Assignment</label>
                  <Select 
                    value={filters.assignedTo} 
                    onValueChange={(value) => onFiltersChange({ ...filters, assignedTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All assignments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All assignments</SelectItem>
                      <SelectItem value="assigned-to-me">Assigned to me</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {buyers.map(buyer => (
                        <SelectItem key={buyer.id} value={buyer.id}>
                          {buyer.icon} {buyer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-medium">Gift Status</label>
                <Select 
                  value={filters.hasGifts} 
                  onValueChange={(value: 'all' | 'with-gifts' | 'no-gifts') => 
                    onFiltersChange({ ...filters, hasGifts: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All recipients</SelectItem>
                    <SelectItem value="with-gifts">Has gifts</SelectItem>
                    <SelectItem value="no-gifts">No gifts added</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Purchase Status</label>
                <Select 
                  value={filters.completion} 
                  onValueChange={(value: 'all' | 'completed' | 'incomplete') => 
                    onFiltersChange({ ...filters, completion: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="completed">Fully purchased</SelectItem>
                    <SelectItem value="incomplete">Needs shopping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Wrapping Status</label>
                <Select 
                  value={filters.wrapping} 
                  onValueChange={(value: 'all' | 'needs-wrapping' | 'all-wrapped') => 
                    onFiltersChange({ ...filters, wrapping: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="needs-wrapping">Needs wrapping</SelectItem>
                    <SelectItem value="all-wrapped">Fully wrapped</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeFilterCount > 0 && (
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Hide Completed Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-muted-foreground">Hide completed</span>
          <Switch
            checked={!filters.showCompleted}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, showCompleted: !checked })}
            className="h-5 w-9"
          />
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilterChips.map(chip => (
            <Badge
              key={chip.id}
              variant="secondary"
              className="h-7 px-2 pr-1 flex items-center gap-1 text-xs flex-shrink-0"
            >
              <span className="truncate max-w-32">{chip.label}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={chip.onRemove}
                className="h-4 w-4 p-0 hover:bg-destructive/20 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Clean Status Line - only show clear button */}
      {(activeFilterCount > 0 || searchTerm) && (
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearSearch();
              clearAllFilters();
            }}
            className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Clear all filters and search"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};