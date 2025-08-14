import React, { useState } from 'react';
import { StickyNote, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = () => {
    onNotesChange(editingNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingNotes(notes);
    setIsEditing(false);
  };

  const getNotesPreview = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const hasNotes = notes.trim().length > 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Notes indicator and preview */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center gap-2">
          {hasNotes && (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 gap-1.5 text-xs"
              >
                <StickyNote className="h-3 w-3" />
                {!isExpanded && getNotesPreview(notes, 30)}
              </Button>
            </CollapsibleTrigger>
          )}
          
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(true);
                setIsExpanded(true);
              }}
              className="h-6 w-6 p-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
          
          {!hasNotes && !isEditing && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer"
              onClick={() => {
                setIsEditing(true);
                setIsExpanded(true);
              }}
            >
              Add notes
            </Badge>
          )}
        </div>

        <CollapsibleContent className="space-y-2">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder={`Add notes for ${personName}...`}
                className="min-h-20 text-sm"
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
          ) : hasNotes ? (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm whitespace-pre-wrap">{notes}</div>
            </div>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};