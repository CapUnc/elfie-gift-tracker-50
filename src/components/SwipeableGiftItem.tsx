import React, { useState, useRef, useEffect } from 'react';
import { Trash2, ShoppingCart, Package, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusToggle } from '@/components/ui/status-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/currency';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface Giver {
  id: string;
  name: string;
  icon: string;
  is_virtual?: boolean;
}

interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  trackingNumber?: string;
  carrier?: string;
  assignedTo?: string | null;
  givers?: Giver[];
}

interface SwipeableGiftItemProps {
  gift: Gift;
  currency: string;
  onUpdate: (giftId: string, field: 'purchased' | 'wrapped', value: boolean) => void;
  onDelete: (giftId: string) => void;
  onEdit: (giftId: string) => void;
}

export const SwipeableGiftItem: React.FC<SwipeableGiftItemProps> = ({
  gift,
  currency,
  onUpdate,
  onDelete,
  onEdit
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [microToast, setMicroToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const itemRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const haptic = useHapticFeedback();

  const SWIPE_THRESHOLD = 60;
  const QUICK_ACTION_THRESHOLD = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Only allow right swipe (positive diff) for delete, left swipe (negative) for purchase
    if (Math.abs(diff) > 10) {
      setSwipeOffset(Math.max(-150, Math.min(150, diff)));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const duration = Date.now() - startTimeRef.current;
    
    // Quick swipe for instant actions
    if (Math.abs(swipeOffset) > QUICK_ACTION_THRESHOLD && duration < 300) {
      if (swipeOffset > 0) {
        // Right swipe - toggle purchased
        haptic.success();
        setIsHighlighted(true);
        setTimeout(() => setIsHighlighted(false), 2000);
        onUpdate(gift.id, 'purchased', !gift.purchased);
      } else {
        // Left swipe - delete
        haptic.error();
        onDelete(gift.id);
      }
    } else if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      // Show action buttons
      haptic.tap();
      setShowActions(true);
    }
    
    setSwipeOffset(0);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const diff = e.clientX - startXRef.current;
    if (Math.abs(diff) > 10) {
      setSwipeOffset(Math.max(-150, Math.min(150, diff)));
    }
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleTouchEnd();
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const diff = e.clientX - startXRef.current;
      if (Math.abs(diff) > 10) {
        setSwipeOffset(Math.max(-150, Math.min(150, diff)));
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging]);

  useEffect(() => {
    if (showActions) {
      const timer = setTimeout(() => setShowActions(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showActions]);

  const handleContentClick = (e: React.MouseEvent) => {
    // Prevent click when swiping or if target is a checkbox
    if (isDragging || Math.abs(swipeOffset) > 5) return;
    if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
    if ((e.target as HTMLElement).closest('button')) return;
    
    haptic.tap();
    onEdit(gift.id);
  };

  return (
    <div className="relative overflow-hidden rounded-lg border bg-card">
      {/* Background action indicators */}
      <div className="absolute inset-0 flex">
        <div 
          className={`flex items-center justify-center bg-emerald-500 transition-all duration-200 ${
            swipeOffset > SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ width: Math.max(0, swipeOffset) }}
        >
          <ShoppingCart className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1" />
        <div 
          className={`flex items-center justify-center bg-destructive transition-all duration-200 ${
            swipeOffset < -SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ width: Math.max(0, -swipeOffset) }}
        >
          <Trash2 className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Main content */}
      <div
        ref={itemRef}
        className={cn(
          "relative bg-card p-3 select-none transition-all duration-200 touch-target hover:bg-muted/20",
          isHighlighted && "animate-highlight-pulse"
        )}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div 
          className="flex items-center gap-2 min-h-[44px] cursor-pointer"
          onClick={handleContentClick}
        >
          {/* Left Group: Status Toggles + Gift Name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <StatusToggle
                    type="purchased"
                    checked={gift.purchased}
                    onCheckedChange={(checked) => {
                      haptic.success();
                      setIsHighlighted(true);
                      setTimeout(() => setIsHighlighted(false), 2000);
                      
                      // Show micro-toast
                      setMicroToast({ 
                        message: checked ? 'Marked purchased' : 'Marked not purchased', 
                        show: true 
                      });
                      setTimeout(() => setMicroToast(prev => ({ ...prev, show: false })), 2000);
                      
                      onUpdate(gift.id, 'purchased', checked as boolean);
                    }}
                    className="flex-shrink-0"
                    aria-label={`Purchased for ${gift.name}. ${gift.purchased ? 'Checked' : 'Unchecked'}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Mark as purchased</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <StatusToggle
                    type="wrapped"
                    checked={gift.wrapped}
                    onCheckedChange={(checked) => {
                      haptic.success();
                      setIsHighlighted(true);
                      setTimeout(() => setIsHighlighted(false), 2000);
                      
                      // Show micro-toast
                      setMicroToast({ 
                        message: checked ? 'Marked wrapped' : 'Marked not wrapped', 
                        show: true 
                      });
                      setTimeout(() => setMicroToast(prev => ({ ...prev, show: false })), 2000);
                      
                      onUpdate(gift.id, 'wrapped', checked as boolean);
                    }}
                    className="flex-shrink-0"
                    aria-label={`Wrapped for ${gift.name}. ${gift.wrapped ? 'Checked' : 'Unchecked'}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Mark as wrapped</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="min-w-0 flex-1">
              <div className={cn(
                "font-medium text-sm truncate",
                gift.purchased && "line-through text-muted-foreground"
              )}>
                {gift.name}
              </div>
            </div>
          </div>

          {/* Right Group: Cost + Givers + Action */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {gift.cost !== null && (
              <span className="text-sm text-muted-foreground font-medium">
                {formatCurrency(gift.cost, currency)}
              </span>
            )}
            
            {/* Giver icons */}
            {gift.givers && gift.givers.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center -space-x-1">
                      {gift.givers.slice(0, 3).map((giver, idx) => (
                        <span
                          key={giver.id}
                          className="inline-flex items-center justify-center w-6 h-6 text-sm bg-muted border border-background rounded-full"
                          style={{ zIndex: 3 - idx }}
                        >
                          {giver.icon}
                        </span>
                      ))}
                      {gift.givers.length > 3 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs bg-muted border border-background rounded-full text-muted-foreground">
                          +{gift.givers.length - 3}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Given by: {gift.givers.map(g => g.name).join(', ')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(gift.id);
              }}
              className="h-8 w-8 p-0 touch-target opacity-70 hover:opacity-100"
              aria-label={`Edit ${gift.name}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Micro-toast */}
        {microToast.show && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-background border border-border rounded-md px-3 py-1.5 shadow-md text-xs font-medium animate-in fade-in-0 zoom-in-95 duration-200">
              {microToast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};