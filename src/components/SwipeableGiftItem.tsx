import React, { useState, useRef, useEffect } from 'react';
import { Trash2, ShoppingCart, Package, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusToggle } from '@/components/ui/status-toggle';
import { formatCurrency } from '@/lib/currency';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import { Gift } from '@/types';

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
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <StatusToggle
              type="purchased"
              checked={gift.purchased}
              onCheckedChange={(checked) => {
                haptic.success();
                setIsHighlighted(true);
                setTimeout(() => setIsHighlighted(false), 2000);
                onUpdate(gift.id, 'purchased', checked as boolean);
              }}
              className="flex-shrink-0"
              aria-label={`${gift.purchased ? 'Mark as not purchased' : 'Mark as purchased'} for ${gift.name}`}
            />
            <StatusToggle
              type="wrapped"
              checked={gift.wrapped}
              onCheckedChange={(checked) => {
                haptic.success();
                setIsHighlighted(true);
                setTimeout(() => setIsHighlighted(false), 2000);
                onUpdate(gift.id, 'wrapped', checked as boolean);
              }}
              className="flex-shrink-0"
              aria-label={`${gift.wrapped ? 'Mark as not wrapped' : 'Mark as wrapped'} for ${gift.name}`}
            />
            <div className="min-w-0 flex-1">
              <div className={cn(
                "font-medium text-sm truncate",
                gift.purchased && "line-through text-muted-foreground"
              )}>
                {gift.name}
              </div>
            </div>
          </div>

          {/* Right Group: Cost + Single Action */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {gift.cost !== null && (
              <span className="text-sm text-muted-foreground font-medium">
                {formatCurrency(gift.cost, currency)}
              </span>
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
      </div>
    </div>
  );
};