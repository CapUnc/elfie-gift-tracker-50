import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';

interface Person {
  id: string;
  name: string;
  gifts: any[];
  notes: string;
  assignedTo: string | null;
  completed?: boolean;
}

interface AlphabetIndexProps {
  people: Person[];
  onLetterClick: (letter: string) => void;
  className?: string;
}

export const AlphabetIndex: React.FC<AlphabetIndexProps> = ({
  people,
  onLetterClick,
  className = ""
}) => {
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    people.forEach(person => {
      const firstLetter = person.name.charAt(0).toUpperCase();
      if (firstLetter.match(/[A-Z]/)) {
        letters.add(firstLetter);
      }
    });
    return Array.from(letters).sort();
  }, [people]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {alphabet.map(letter => {
        const isAvailable = availableLetters.includes(letter);
        return (
          <Button
            key={letter}
            variant="ghost"
            size="sm"
            onClick={() => isAvailable && onLetterClick(letter)}
            disabled={!isAvailable}
            className={`
              h-6 w-6 p-0 text-xs font-medium
              ${isAvailable 
                ? 'text-primary hover:bg-primary/10 hover:text-primary' 
                : 'text-muted-foreground/50 cursor-not-allowed'
              }
            `}
          >
            {letter}
          </Button>
        );
      })}
    </div>
  );
};