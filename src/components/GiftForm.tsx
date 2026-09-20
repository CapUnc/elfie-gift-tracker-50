import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RippleButton } from './RippleButton';
import { useAnimatedButton } from '@/hooks/useAnimatedButton';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Trash2, Check, HelpCircle } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import type { Gift, Giver } from '@/types/gift';

const giftSchema = z.object({
  name: z.string().trim().min(1, 'Gift name is required').max(100, 'Gift name must be less than 100 characters'),
  cost: z.string().regex(/^\d*\.?\d{0,2}$/, 'Invalid cost format').optional().or(z.literal('')),
});

interface GiftFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (giftData: { name: string; cost: string; giverIds: string[]; isPlaceholder: boolean }) => void;
  onDelete?: (giftId: string) => void;
  personName: string;
  currency: string;
  editingGift?: Gift | null;
  mode?: 'add' | 'edit';
  availableGivers?: Giver[];
}

export const GiftForm: React.FC<GiftFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  personName,
  currency,
  editingGift,
  mode = 'add',
  availableGivers = []
}) => {
  const [giftName, setGiftName] = useState('');
  const [giftCost, setGiftCost] = useState('');
  const [selectedGiverIds, setSelectedGiverIds] = useState<string[]>([]);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialValues, setInitialValues] = useState({ name: '', cost: '', giverIds: [] as string[], isPlaceholder: false });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { toast } = useToast();
  const haptic = useHapticFeedback();
  const { execute: saveGift, getVariant, isDisabled } = useAnimatedButton(async () => {
    const trimmedName = giftName.trim();
    const trimmedCost = giftCost.trim();
    const validation = giftSchema.safeParse({ name: trimmedName, cost: trimmedCost });
    if (!validation.success) {
      toast({ title: "Validation Error", description: validation.error.errors[0].message, variant: "destructive" });
      return;
    }
    haptic.success();
    onSubmit({ name: trimmedName, cost: trimmedCost, giverIds: selectedGiverIds, isPlaceholder });
    resetForm();
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editingGift) {
        const name = editingGift.name;
        const cost = editingGift.cost?.toString() || '';
        const giverIds = editingGift.givers?.map(g => g.id) || [];
        const placeholder = editingGift.is_placeholder || false;
        setGiftName(name);
        setGiftCost(cost);
        setSelectedGiverIds(giverIds);
        setIsPlaceholder(placeholder);
        setInitialValues({ name, cost, giverIds, isPlaceholder: placeholder });
      } else {
        setGiftName('');
        setGiftCost('');
        setSelectedGiverIds([]);
        setIsPlaceholder(false);
        setInitialValues({ name: '', cost: '', giverIds: [], isPlaceholder: false });
      }
      setHasUnsavedChanges(false);
    }
  }, [isOpen, mode, editingGift]);

  useEffect(() => {
    const nameChanged = giftName !== initialValues.name;
    const costChanged = giftCost !== initialValues.cost;
    const giversChanged = JSON.stringify(selectedGiverIds.sort()) !== JSON.stringify(initialValues.giverIds.sort());
    const placeholderChanged = isPlaceholder !== initialValues.isPlaceholder;
    setHasUnsavedChanges(nameChanged || costChanged || giversChanged || placeholderChanged);
  }, [giftName, giftCost, selectedGiverIds, isPlaceholder, initialValues]);

  const resetForm = () => {
    setGiftName('');
    setGiftCost('');
    setSelectedGiverIds([]);
    setIsPlaceholder(false);
    setHasUnsavedChanges(false);
    setInitialValues({ name: '', cost: '', giverIds: [], isPlaceholder: false });
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      toast({
        title: "Unsaved changes",
        description: "Your changes will be lost. Close anyway?",
        action: (<Button variant="destructive" size="sm" onClick={handleForceClose}>Discard</Button>)
      });
      return;
    }
    resetForm();
    onClose();
  };

  const handleForceClose = () => { resetForm(); onClose(); };

  const handleDelete = () => {
    if (editingGift && onDelete) {
      onDelete(editingGift.id);
      setShowDeleteDialog(false);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); saveGift(); };
  const isFormValid = giftName.trim().length > 0;
  const title = mode === 'edit' ? 'Edit Gift' : `Add Gift for ${personName}`;
  const submitLabel = mode === 'edit' ? 'Update Gift' : 'Save Gift';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="max-h-[calc(100vh-env(keyboard-inset-height,0px))] h-auto min-h-[60vh] sm:h-auto sm:max-w-md sm:rounded-t-lg flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">{title}</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gift-name" className="text-sm font-medium">Gift Name</Label>
            <Input id="gift-name" type="text" placeholder={isPlaceholder ? "Unknown Gift" : "Enter gift name..."} value={giftName} onChange={(e) => setGiftName(e.target.value)} className="touch-target" autoFocus autoComplete="off" />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="is-placeholder" checked={isPlaceholder} onCheckedChange={(checked) => { setIsPlaceholder(checked as boolean); if (checked && !giftName) setGiftName("Unknown Gift"); }} />
            <Label htmlFor="is-placeholder" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span>I don't know what gift yet (placeholder)</span>
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gift-cost" className="text-sm font-medium">Cost</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">{currency}</span>
              <Input id="gift-cost" type="text" inputMode="decimal" placeholder="0.00" value={giftCost}
                onChange={(e) => { const value = e.target.value; if (value === '' || /^\d*\.?\d*$/.test(value)) setGiftCost(value); }}
                onBlur={() => { if (giftCost && !isNaN(parseFloat(giftCost))) setGiftCost(parseFloat(giftCost).toFixed(2)); }}
                className="pl-8 touch-target" autoComplete="off"
              />
            </div>
            {giftCost && isNaN(parseFloat(giftCost)) && <p className="text-xs text-destructive">Numbers only</p>}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Givers <span className="text-muted-foreground">(Optional)</span></Label>
              <p className="text-xs text-muted-foreground mt-1">Who is buying this gift? Tap one or more.</p>
            </div>
            {availableGivers.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableGivers.map((giver) => {
                  const isSelected = selectedGiverIds.includes(giver.id);
                  return (
                    <button key={giver.id} type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedGiverIds(prev => prev.includes(giver.id) ? prev.filter(id => id !== giver.id) : [...prev, giver.id])}
                      className={cn("relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all touch-target", isSelected ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50 hover:bg-muted/50")}
                    >
                      <span className="text-2xl">{giver.icon}</span>
                      <span className="text-xs font-medium text-center line-clamp-1">{giver.name}</span>
                      {isSelected && <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5"><Check className="h-3 w-3" /></div>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">No givers yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add the people who buy gifts in Settings &rarr; Givers, then you can tag them here.
                </p>
              </div>
            )}
            {selectedGiverIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedGiverIds.map(giverId => {
                  const giver = availableGivers.find(g => g.id === giverId);
                  if (!giver) return null;
                  return (
                    <Badge key={giverId} variant="secondary" className="gap-1">
                      <span>{giver.icon}</span>{giver.name}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setSelectedGiverIds(prev => prev.filter(id => id !== giverId))} />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4">
            {mode === 'edit' && onDelete && editingGift && (
              <>
                <Button type="button" variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full touch-target">
                  <Trash2 className="h-4 w-4 mr-2" />Delete Gift
                </Button>
                <div className="h-px bg-border my-2" />
              </>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 touch-target"><X className="w-4 h-4 mr-2" />Cancel</Button>
              <RippleButton type="submit" variant={getVariant()} disabled={isDisabled || !isFormValid} className="flex-1 touch-target"><Save className="w-4 h-4 mr-2" />{submitLabel}</RippleButton>
            </div>
          </div>
        </form>

        {hasUnsavedChanges && <div className="absolute top-2 right-2 w-2 h-2 bg-warning rounded-full animate-pulse" />}
      </SheetContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gift</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{editingGift?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};
