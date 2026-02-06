import React from 'react';
import {
  Plus,
  Gift as GiftIcon,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Package,
  CheckCircle,
  Check,
  ShoppingCart,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { SwipeableGiftItem } from '@/components/SwipeableGiftItem';
import { PersonContextMenu } from '@/components/ContextMenu';
import { RecipientNotes } from '@/components/RecipientNotes';
import type { Gift, Giver, Person } from '@/types/gift';

interface RecipientNoteRecord {
  id: string;
  recipient_id: string;
  [key: string]: unknown;
}

interface RecipientCardProps {
  person: Person;
  isExpanded: boolean;
  isHighlighted: boolean;
  currency: string;
  householdId: string;
  allNotes: RecipientNoteRecord[];
  onToggleExpand: (personId: string) => void;
  onAddGift: (personId: string) => void;
  onEditGift: (personId: string, giftId: string, gift: Gift) => void;
  onUpdateGiftStatus: (personId: string, giftId: string, field: 'purchased' | 'wrapped', value: boolean) => void;
  onDeleteGift: (personId: string, giftId: string) => void;
  onMarkAllPurchased: (personId: string) => void;
  onMarkAllWrapped: (personId: string) => void;
  onToggleComplete: (person: Person) => void;
}

const getCompletionStats = (person: Person) => {
  const total = person.gifts.length;
  const purchased = person.gifts.filter((g) => g.purchased).length;
  const wrapped = person.gifts.filter((g) => g.wrapped).length;
  const totalCost = person.gifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
  return { total, purchased, wrapped, totalCost };
};

const RecipientCard: React.FC<RecipientCardProps> = ({
  person,
  isExpanded,
  isHighlighted,
  currency,
  householdId,
  allNotes,
  onToggleExpand,
  onAddGift,
  onEditGift,
  onUpdateGiftStatus,
  onDeleteGift,
  onMarkAllPurchased,
  onMarkAllWrapped,
  onToggleComplete,
}) => {
  const isMobile = useIsMobile();
  const stats = getCompletionStats(person);
  const progressPercent =
    stats.total > 0 ? ((stats.purchased + stats.wrapped) / (stats.total * 2)) * 100 : 0;

  const personNotes = allNotes.filter((n) => n.recipient_id === person.id);
  const notesCount = personNotes.length;

  // Collect unique givers across all gifts
  const giverMap = new Map<string, Giver>();
  person.gifts.forEach((gift) => {
    gift.givers?.forEach((giver) => {
      if (!giverMap.has(giver.id)) giverMap.set(giver.id, giver);
    });
  });
  const uniqueGivers = Array.from(giverMap.values());
  const hasMetadata = notesCount > 0 || uniqueGivers.length > 0;

  return (
    <PersonContextMenu
      onAddGift={() => onAddGift(person.id)}
      onMarkAllPurchased={() => onMarkAllPurchased(person.id)}
      onMarkAllWrapped={() => onMarkAllWrapped(person.id)}
      onMarkComplete={() => onToggleComplete(person)}
      hasGifts={person.gifts.length > 0}
      isComplete={person.completed || false}
    >
      <div
        id={`person-${person.id}`}
        className={cn(
          'bg-card border rounded-lg shadow-sm transition-all duration-300 max-w-full overflow-hidden',
          isHighlighted && 'ring-2 ring-primary/50 shadow-lg',
          person.completed && 'opacity-75'
        )}
      >
        {/* Header */}
        <div
          className={cn('p-4 border-b bg-muted/30', isMobile && 'cursor-pointer')}
          onClick={(e) => {
            if (!isMobile) return;
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('[role="button"]')) return;
            onToggleExpand(person.id);
          }}
        >
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
                onClick={() => onToggleExpand(person.id)}
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
                      'font-medium text-lg min-w-0 truncate',
                      person.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {person.name}
                  </h3>
                  {person.completed && (
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                </div>

                <div className="space-y-2 mt-1">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GiftIcon className="h-3 w-3" />
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
                        {formatCurrency(stats.totalCost, '')}
                      </span>
                    )}
                  </div>

                  {hasMetadata && (
                    <div className="flex items-center gap-3">
                      {uniqueGivers.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center -space-x-2">
                              {uniqueGivers.map((giver, idx) => (
                                <div
                                  key={giver.id}
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-background text-xs"
                                  style={{ zIndex: uniqueGivers.length - idx }}
                                >
                                  {giver.icon}
                                </div>
                              ))}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Givers: {uniqueGivers.map((g) => g.name).join(', ')}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {notesCount > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="flex-shrink-0">
                              {notesCount} {notesCount === 1 ? 'note' : 'notes'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to view and manage notes</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onToggleComplete(person)}
                      className={cn(
                        'h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors',
                        person.completed
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-muted-foreground/30 hover:border-green-600 hover:bg-green-50 text-muted-foreground/40 hover:text-green-600'
                      )}
                    >
                      <Check className="h-4 w-4" />
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

        {/* Expanded content */}
        <Collapsible open={isExpanded}>
          <CollapsibleContent>
            <div className="p-4 space-y-4">
              <RecipientNotes
                recipientId={person.id}
                recipientName={person.name}
                householdId={householdId}
              />

              {person.gifts.length > 0 ? (
                <div className="space-y-3 max-w-full">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Gifts ({person.gifts.length})</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => onAddGift(person.id)}
                      aria-label={`Add gift for ${person.name}`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Gift
                    </Button>
                  </div>
                  {person.gifts.map((gift) => (
                    <SwipeableGiftItem
                      key={gift.id}
                      gift={gift}
                      currency={currency}
                      onUpdate={(giftId, field, value) =>
                        onUpdateGiftStatus(person.id, giftId, field, value)
                      }
                      onDelete={(giftId) => onDeleteGift(person.id, giftId)}
                      onEdit={(giftId) => onEditGift(person.id, giftId, gift)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <GiftIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No gifts added yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => onAddGift(person.id)}
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
};

export { RecipientCard, getCompletionStats };
