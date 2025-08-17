import React, { useState, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Buyer, SearchFilters } from '@/types';

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
    if (!filters.showCompleted) count++;
    return count;
  }, [filters, buyers.length]);

  const clearAllFilters = () => {
    onFiltersChange({
      assignedTo: 'all',
      completion: 'all',
      wrapping: 'all',
      showCompleted: false,
      hasGifts: 'all'
    });
  };

  const clearSearch = () => {
    onSearchChange('');
  };

  const activeFilterChips = useMemo(() => {
    const chips = [];
    
    if (filters.assignedTo !== 'all') {
      const buyer = buyers.find(b => b.name === filters.assignedTo);
      chips.push({
        id: 'assignedTo',
        label: buyer ? `${buyer.emoji} ${buyer.name}` : filters.assignedTo === 'unassigned' ? 'Unassigned' : filters.assignedTo,
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

    if (!filters.showCompleted) {
      chips.push({
        id: 'showCompleted',
        label: 'Hide completed',
        onRemove: () => onFiltersChange({ ...filters, showCompleted: true })
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

      {/* Compact Horizontal Chip Rail */}
      <div className="flex items-center gap-1.5 flex-wrap max-w-full overflow-hidden">
        {/* Filter Sheet Trigger */}
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap h-7 px-2.5 relative flex-shrink-0"
            >
              <Filter className="h-3 w-3 mr-1" />
              <span className="text-xs">Filter</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs h-3.5 min-w-3.5 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

        {/* Active Filter Chips - Collapsible */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
          {activeFilterChips.slice(0, 2).map(chip => (
            <Badge
              key={chip.id}
              variant="secondary"
              className="h-7 px-2 pr-1 flex items-center gap-1 text-xs flex-shrink-0"
            >
              <span className="truncate max-w-24">{chip.label}</span>
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
          {activeFilterChips.length > 2 && (
            <Badge
              variant="secondary"
              className="h-7 px-2 text-xs cursor-pointer flex-shrink-0"
              onClick={() => setIsFilterSheetOpen(true)}
            >
              +{activeFilterChips.length - 2} more
            </Badge>
          )}
        </div>
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
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {buyers.map(buyer => (
                        <SelectItem key={buyer.id} value={buyer.name}>
                          {buyer.emoji} {buyer.name}
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
      </div>

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