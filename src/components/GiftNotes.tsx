import React, { useState } from 'react';
import { Save, X, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface GiftNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  personName: string;
  className?: string;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

export const GiftNotes: React.FC<GiftNotesProps> = ({
  notes,
  onNotesChange,
  personName,
  className = "",
  isEditing = false,
  onEditStart,
  onEditEnd
}) => {
  const [editingNotes, setEditingNotes] = useState(notes);

  // Update local state when notes prop changes
  React.useEffect(() => {
    setEditingNotes(notes);
  }, [notes]);

  const handleSave = () => {
    onNotesChange(editingNotes);
    onEditEnd?.();
  };

  const handleCancel = () => {
    setEditingNotes(notes);
    onEditEnd?.();
  };

  const handleNotesClick = () => {
    setEditingNotes(notes);
    onEditStart?.();
  };

  const hasNotes = notes.trim().length > 0;

  return (
    <div className={className}>
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editingNotes}
            onChange={(e) => setEditingNotes(e.target.value)}
            placeholder={`Add notes for ${personName}...`}
            className="min-h-16 text-sm resize-none border-muted-foreground/10"
            autoFocus
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              onClick={handleSave}
              className="h-6 px-2 text-xs"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={handleNotesClick}
          className="
            flex items-center gap-2 py-1 px-1 mt-2 cursor-pointer 
            transition-all duration-200 hover:bg-muted/20 rounded
            min-h-[20px]
          "
        >
          <StickyNote className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
          <div className="text-xs text-muted-foreground/80 flex-1 line-clamp-1">
            {hasNotes ? (
              <span className="text-muted-foreground">{notes}</span>
            ) : (
              <span className="italic">
                Add a note for {personName}...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};