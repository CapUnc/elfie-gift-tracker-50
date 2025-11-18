import React, { useState } from 'react';
import { Plus, Trash2, Link as LinkIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useRecipientNotes } from '@/hooks/useRecipientNotes';
import { renderNoteContent } from '@/lib/noteUtils';

interface RecipientNotesProps {
  recipientId: string;
  recipientName: string;
  householdId: string;
}

export const RecipientNotes: React.FC<RecipientNotesProps> = ({
  recipientId,
  recipientName,
  householdId,
}) => {
  const { notes, addNote, deleteNote, hasNotes, isAddingNote } = useRecipientNotes(recipientId);
  
  const [isAdding, setIsAdding] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [showLinkFields, setShowLinkFields] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string>('');

  const handleAddNote = () => {
    if (!noteContent.trim()) return;

    addNote({
      content: noteContent.trim(),
      link_url: linkUrl.trim() || undefined,
      link_label: linkLabel.trim() || undefined,
      household_id: householdId,
    });

    setNoteContent('');
    setLinkUrl('');
    setLinkLabel('');
    setShowLinkFields(false);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setNoteContent('');
    setLinkUrl('');
    setLinkLabel('');
    setShowLinkFields(false);
    setIsAdding(false);
  };

  const handleDeleteClick = (noteId: string, content: string) => {
    setDeleteNoteId(noteId);
    setNoteToDelete(content);
  };

  const handleConfirmDelete = () => {
    if (deleteNoteId) {
      deleteNote(deleteNoteId);
      setDeleteNoteId(null);
      setNoteToDelete('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Notes {hasNotes && <span className="text-muted-foreground">({notes.length})</span>}
        </label>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Notes List */}
      {hasNotes && (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative border border-border rounded-lg p-3 bg-card hover:border-muted-foreground/20 transition-colors"
            >
              <div className="flex gap-2">
                <div className="flex-1 text-sm text-foreground">
                  {renderNoteContent(note.content, note.link_url, note.link_label)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDeleteClick(note.id, note.content)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!hasNotes && !isAdding && (
        <div className="text-xs text-muted-foreground italic py-2">
          No notes yet. Click + to add one.
        </div>
      )}

      {/* Add Note Form */}
      {isAdding && (
        <div className="border border-border rounded-lg p-3 bg-muted/5 space-y-3">
          <div>
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={`Add a note for ${recipientName}...`}
              className="min-h-16 text-sm resize-none"
              autoFocus
            />
          </div>

          {/* Link Section */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs w-full justify-start"
              onClick={() => setShowLinkFields(!showLinkFields)}
            >
              {showLinkFields ? (
                <ChevronDown className="h-3 w-3 mr-1" />
              ) : (
                <ChevronRight className="h-3 w-3 mr-1" />
              )}
              <LinkIcon className="h-3 w-3 mr-1" />
              Add Link (optional)
            </Button>

            {showLinkFields && (
              <div className="space-y-2 pl-6">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">URL</label>
                  <Input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="text-sm h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Label (optional)</label>
                  <Input
                    type="text"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    placeholder="Click here"
                    className="text-sm h-8"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!noteContent.trim() || isAddingNote}
              className="h-7 px-3 text-xs"
            >
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isAddingNote}
              className="h-7 px-3 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note?
              <div className="mt-2 p-2 bg-muted rounded text-sm text-foreground">
                "{noteToDelete.slice(0, 100)}{noteToDelete.length > 100 ? '...' : ''}"
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
