import React, { useState } from 'react';
import { Save, X, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface GiftNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  personName: string;
  className?: string;
}

export const GiftNotes: React.FC<GiftNotesProps> = ({
  notes,
  onNotesChange,
  personName,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingNotes, setEditingNotes] = useState(notes);

  const handleSave = () => {
    onNotesChange(editingNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingNotes(notes);
    setIsEditing(false);
  };

  const handleNotesClick = () => {
    setEditingNotes(notes);
    setIsEditing(true);
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
            className="min-h-20 text-sm resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="h-7 px-3"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-7 px-3"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={handleNotesClick}
          className={`
            bg-muted/30 border border-muted-foreground/20 rounded-lg p-3 cursor-pointer 
            transition-all duration-200 hover:bg-muted/50 hover:border-muted-foreground/30
            min-h-[44px] flex items-center gap-2
          `}
        >
          <StickyNote className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="text-sm flex-1">
            {hasNotes ? (
              <span className="text-foreground">{notes}</span>
            ) : (
              <span className="text-muted-foreground italic">
                Add a note for {personName}...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};