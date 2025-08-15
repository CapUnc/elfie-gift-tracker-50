import React from 'react';
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
    <button
      onClick={onClick}
      className={cn(
        "fixed h-[72px] w-[72px] rounded-full overflow-hidden transition-all duration-300 ease-in-out z-40 p-0 border-0 bg-transparent",
        "hover:scale-105 active:scale-95",
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
      <img 
        src="/lovable-uploads/bba46810-45aa-4599-92f1-d17e806f0d34.png" 
        alt="Add people" 
        className="w-full h-full object-cover block"
      />
    </button>
  );
};

export default FloatingActionButton;