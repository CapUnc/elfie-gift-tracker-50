import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
  isVisible?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  className,
  isVisible = true
}) => {
  const { scrollDirection, isAtTop } = useScrollDirection();

  // Show FAB when explicitly visible, at top, or scrolling up
  const shouldShow = isVisible && (isAtTop || scrollDirection === 'up');

  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={cn(
        "fixed h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out z-40",
        "hover:scale-105 active:scale-95 border border-border bg-background",
        // Safe area spacing
        "bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))]",
        // Hide/show animation
        shouldShow 
          ? "translate-y-0 opacity-100" 
          : "translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none",
        className
      )}
      aria-label="Add people"
    >
      <img src="/lovable-uploads/4b621e2c-54dd-4bff-ab87-5b825b9559f0.png" alt="Add People" className="h-7 w-7" />
    </Button>
  );
};

export default FloatingActionButton;