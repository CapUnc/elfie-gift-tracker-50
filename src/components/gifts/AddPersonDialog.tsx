import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

interface AddPersonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPerson: (name: string) => Promise<void>;
}

const AddPersonDialog: React.FC<AddPersonDialogProps> = ({
  isOpen,
  onOpenChange,
  onAddPerson,
}) => {
  const [newPersonName, setNewPersonName] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleAdd = async () => {
    if (newPersonName.trim()) {
      await onAddPerson(newPersonName.trim());
      setNewPersonName('');
      setUnsavedChanges(false);
    }
  };

  const handleClose = () => {
    if (unsavedChanges && newPersonName.trim()) {
      setShowCancelDialog(true);
    } else {
      onOpenChange(false);
      setNewPersonName('');
      setUnsavedChanges(false);
    }
  };

  const handleDiscard = () => {
    onOpenChange(false);
    setNewPersonName('');
    setUnsavedChanges(false);
    setShowCancelDialog(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Add Person</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Person's name"
              value={newPersonName}
              onChange={(e) => {
                setNewPersonName(e.target.value);
                setUnsavedChanges(e.target.value.trim() !== '');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleAdd} className="min-h-[44px]">
                Add Person
              </Button>
              <Button variant="outline" onClick={handleClose} className="min-h-[44px]">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to cancel?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AddPersonDialog;
