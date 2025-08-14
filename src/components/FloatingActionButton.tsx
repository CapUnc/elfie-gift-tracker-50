import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  className 
}) => {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40",
        "bg-gradient-festive hover:opacity-90 text-white border-2 border-white/20",
        "hover:scale-105 active:scale-95",
        className
      )}
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">Add Person</span>
    </Button>
  );
};

export default FloatingActionButton;