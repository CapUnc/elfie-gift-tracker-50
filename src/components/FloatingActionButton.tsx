import React from 'react';
import { Plus } from 'lucide-react';
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
      size="icon"
      className={cn(
        "fixed h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out z-40",
        "bg-gradient-festive hover:opacity-90 text-white border-2 border-white/20",
        "hover:scale-105 active:scale-95",
        // Safe area spacing
        "bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))]",
        // Hide/show animation
        shouldShow 
          ? "translate-y-0 opacity-100" 
          : "translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none",
        className
      )}
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">Add Person</span>
    </Button>
  );
};

export default FloatingActionButton;