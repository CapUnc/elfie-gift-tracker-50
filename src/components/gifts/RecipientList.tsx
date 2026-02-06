import React from 'react';
import { Gift as GiftIcon } from 'lucide-react';
import { AlphabetIndex } from '@/components/AlphabetIndex';
import { RecipientCard } from './RecipientCard';
import type { Gift, Person } from '@/types/gift';

interface RecipientNoteRecord {
  id: string;
  recipient_id: string;
  [key: string]: unknown;
}

interface RecipientListProps {
  people: Person[];
  allPeopleCount: number;
  expandedPersonId: string | null;
  highlightedItems: Set<string>;
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
  onScrollToLetter: (letter: string) => void;
}

const RecipientList: React.FC<RecipientListProps> = ({
  people,
  allPeopleCount,
  expandedPersonId,
  highlightedItems,
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
  onScrollToLetter,
}) => {
  return (
    <div className="flex gap-4 max-w-full overflow-hidden">
      {people.length > 10 && (
        <div className="hidden lg:block flex-shrink-0">
          <AlphabetIndex people={people} onLetterClick={onScrollToLetter} />
        </div>
      )}

      <div className="flex-1 space-y-4 min-w-0">
        {people.length === 0 ? (
          <div className="text-center py-12">
            <GiftIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No people found</h3>
            <p className="text-sm text-muted-foreground">
              {allPeopleCount === 0
                ? 'Add your first person to start tracking gifts'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          people.map((person) => (
            <RecipientCard
              key={person.id}
              person={person}
              isExpanded={expandedPersonId === person.id}
              isHighlighted={highlightedItems.has(`person-${person.id}`)}
              currency={currency}
              householdId={householdId}
              allNotes={allNotes}
              onToggleExpand={onToggleExpand}
              onAddGift={onAddGift}
              onEditGift={onEditGift}
              onUpdateGiftStatus={onUpdateGiftStatus}
              onDeleteGift={onDeleteGift}
              onMarkAllPurchased={onMarkAllPurchased}
              onMarkAllWrapped={onMarkAllWrapped}
              onToggleComplete={onToggleComplete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RecipientList;
