import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Person } from '@/types/gift';

interface CompletionDialogState {
  isOpen: boolean;
  person: Person | null;
  incompleteParts: { purchased: number; wrapped: number };
}

interface CompletionDialogProps {
  state: CompletionDialogState;
  onClose: () => void;
  onMarkCompleteAnyway: (person: Person) => void;
  onCompleteAllGifts: (person: Person) => void;
}

const CompletionDialog: React.FC<CompletionDialogProps> = ({
  state,
  onClose,
  onMarkCompleteAnyway,
  onCompleteAllGifts,
}) => {
  return (
    <AlertDialog open={state.isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete Person</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>{state.person?.name} still has:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {state.incompleteParts.purchased > 0 && (
                <li>
                  {state.incompleteParts.purchased} gift
                  {state.incompleteParts.purchased > 1 ? 's' : ''} not purchased
                </li>
              )}
              {state.incompleteParts.wrapped > 0 && (
                <li>
                  {state.incompleteParts.wrapped} gift
                  {state.incompleteParts.wrapped > 1 ? 's' : ''} not wrapped
                </li>
              )}
            </ul>
            <p className="text-sm">
              Would you like to mark all remaining gifts as purchased and wrapped, or just mark as
              complete anyway?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <Button
            variant="outline"
            onClick={() => {
              if (state.person) onMarkCompleteAnyway(state.person);
              onClose();
            }}
          >
            Mark Complete Anyway
          </Button>
          <AlertDialogAction
            onClick={() => {
              if (state.person) onCompleteAllGifts(state.person);
              onClose();
            }}
          >
            Complete All Gifts
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CompletionDialog;
