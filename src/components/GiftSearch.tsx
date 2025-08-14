import React, { useState, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Buyer {
  id: string;
  name: string;
  emoji: string;
}

interface SearchFilters {
  assignedTo: string;
  completion: 'all' | 'completed' | 'incomplete';
  wrapping: 'all' | 'needs-wrapping' | 'all-wrapped';
  showCompleted: boolean;
  hasGifts: 'all' | 'with-gifts' | 'no-gifts';
}

interface GiftSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  buyers: Buyer[];
  quickFilters?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    active: boolean;
  }[];
}

export const GiftSearch: React.FC<GiftSearchProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  buyers,
  quickFilters = []
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  return (
    <div className="space-y-3">
      {/* Search Bar */}
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

      {/* Quick Filters and Main Filter Button */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {/* Quick Filter Pills */}
        {quickFilters.map((filter, index) => (
          <Button
            key={index}
            variant={filter.active ? "default" : "outline"}
            size="sm"
            onClick={filter.onClick}
            className="whitespace-nowrap h-8 px-3 flex items-center gap-1.5"
          >
            {filter.icon}
            <span className="text-xs">{filter.label}</span>
          </Button>
        ))}

        {/* Advanced Filter Button */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap h-8 px-3 relative"
            >
              <Filter className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Filter</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-xs h-4 min-w-4">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                {activeFilterCount > 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={clearAllFilters}
                    size="sm"
                    className="h-8 px-2"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>

              {buyers.length > 1 && (
                <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
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
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filter Summary */}
      {(activeFilterCount > 0 || searchTerm) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Search: "{searchTerm}"
            </Badge>
          )}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearSearch();
              clearAllFilters();
            }}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};