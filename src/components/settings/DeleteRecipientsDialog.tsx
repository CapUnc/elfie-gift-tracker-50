import React, { useState } from 'react';
import { Search, Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Person {
  id: string;
  name: string;
  gifts: any[];
  notes: string;
  assignedTo: string | null;
}

interface DeleteRecipientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  people: Person[];
  onDeletePeople: (peopleIds: string[]) => void;
}

export function DeleteRecipientsDialog({
  open,
  onOpenChange,
  people,
  onDeletePeople,
}: DeleteRecipientsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const filteredPeople = people.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePersonToggle = (personId: string) => {
    setSelectedPeople((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPeople.length === filteredPeople.length) {
      setSelectedPeople([]);
    } else {
      setSelectedPeople(filteredPeople.map((person) => person.id));
    }
  };

  const handleDelete = () => {
    if (selectedPeople.length === 0) return;
    setShowConfirmation(true);
  };

  const confirmDelete = () => {
    onDeletePeople(selectedPeople);
    setSelectedPeople([]);
    setSearchQuery('');
    setShowConfirmation(false);
    onOpenChange(false);
  };

  const cancelDelete = () => {
    setShowConfirmation(false);
  };

  const handleClose = () => {
    setSelectedPeople([]);
    setSearchQuery('');
    setShowConfirmation(false);
    onOpenChange(false);
  };

  const selectedPeopleData = people.filter((person) =>
    selectedPeople.includes(person.id)
  );

  const totalGifts = selectedPeopleData.reduce(
    (total, person) => total + person.gifts.length,
    0
  );

  if (showConfirmation) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              You are about to permanently delete {selectedPeople.length}{' '}
              recipient{selectedPeople.length !== 1 ? 's' : ''}:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <ScrollArea className="max-h-32">
              <div className="space-y-2">
                {selectedPeopleData.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{person.name}</span>
                    <span className="text-muted-foreground">
                      {person.gifts.length} gift{person.gifts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive font-medium">
                This will permanently delete:
              </p>
              <ul className="text-sm text-destructive mt-1 space-y-1">
                <li>• {totalGifts} total gift{totalGifts !== 1 ? 's' : ''}</li>
                <li>• All notes and assignments</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="min-h-[44px] sm:min-h-auto"
            >
              Delete {selectedPeople.length} Recipient{selectedPeople.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Delete Recipients</DialogTitle>
          <DialogDescription>
            Select recipients to delete. This will permanently remove them and all
            associated gifts and notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search recipients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select All / Actions */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={
                  filteredPeople.length > 0 &&
                  selectedPeople.length === filteredPeople.length
                }
                onCheckedChange={handleSelectAll}
                aria-label="Select all recipients"
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                Select All ({filteredPeople.length})
              </label>
            </div>
            
            {selectedPeople.length > 0 && (
              <Badge variant="secondary">
                {selectedPeople.length} selected
              </Badge>
            )}
          </div>

          {/* Recipients List */}
          <ScrollArea className="max-h-80 border rounded-md">
            <div className="p-4 space-y-3">
              {filteredPeople.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No recipients found.' : 'No recipients to delete.'}
                </p>
              ) : (
                filteredPeople.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`person-${person.id}`}
                      checked={selectedPeople.includes(person.id)}
                      onCheckedChange={() => handlePersonToggle(person.id)}
                      aria-label={`Select ${person.name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`person-${person.id}`}
                          className="font-medium cursor-pointer truncate"
                        >
                          {person.name}
                        </label>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {person.gifts.length} gift{person.gifts.length !== 1 ? 's' : ''}
                          </span>
                          {person.assignedTo && (
                            <Badge variant="outline" className="text-xs">
                              {person.assignedTo}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {person.notes && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          Notes: {person.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={selectedPeople.length === 0}
            className="min-h-[44px] sm:min-h-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete {selectedPeople.length > 0 ? selectedPeople.length : ''} 
            {selectedPeople.length === 1 ? ' Recipient' : ' Recipients'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}