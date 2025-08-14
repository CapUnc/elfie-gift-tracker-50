import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { RippleButton } from './RippleButton';
import { useAnimatedButton } from '@/hooks/useAnimatedButton';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { Save, X } from 'lucide-react';

interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  trackingNumber?: string;
  carrier?: string;
  assignedTo?: string | null;
}

interface GiftFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (giftData: { name: string; cost: string }) => void;
  personName: string;
  currency: string;
  editingGift?: Gift | null;
  mode?: 'add' | 'edit';
}

export const GiftForm: React.FC<GiftFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  personName,
  currency,
  editingGift,
  mode = 'add'
}) => {
  const [giftName, setGiftName] = useState('');
  const [giftCost, setGiftCost] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialValues, setInitialValues] = useState({ name: '', cost: '' });
  
  const { toast } = useToast();
  const haptic = useHapticFeedback();
  const { execute: saveGift, getVariant, isDisabled } = useAnimatedButton(async () => {
    if (!giftName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a gift name.",
        variant: "destructive"
      });
      return;
    }
    
    haptic.success();
    onSubmit({ name: giftName, cost: giftCost });
    resetForm();
  });

  // Initialize form with editing data
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editingGift) {
        const name = editingGift.name;
        const cost = editingGift.cost?.toString() || '';
        setGiftName(name);
        setGiftCost(cost);
        setInitialValues({ name, cost });
      } else {
        setGiftName('');
        setGiftCost('');
        setInitialValues({ name: '', cost: '' });
      }
      setHasUnsavedChanges(false);
    }
  }, [isOpen, mode, editingGift]);

  // Track unsaved changes
  useEffect(() => {
    const nameChanged = giftName !== initialValues.name;
    const costChanged = giftCost !== initialValues.cost;
    setHasUnsavedChanges(nameChanged || costChanged);
  }, [giftName, giftCost, initialValues]);

  const resetForm = () => {
    setGiftName('');
    setGiftCost('');
    setHasUnsavedChanges(false);
    setInitialValues({ name: '', cost: '' });
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      // Simple confirmation via toast
      toast({
        title: "Unsaved changes",
        description: "Your changes will be lost. Close anyway?",
        action: (
          <Button
            variant="destructive" 
            size="sm"
            onClick={handleForceClose}
          >
            Discard
          </Button>
        )
      });
      return;
    }
    
    resetForm();
    onClose();
  };

  const handleForceClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveGift();
  };

  const isFormValid = giftName.trim().length > 0;
  const title = mode === 'edit' ? 'Edit Gift' : `Add Gift for ${personName}`;
  const submitLabel = mode === 'edit' ? 'Update Gift' : 'Save Gift';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] sm:h-auto sm:max-w-md sm:rounded-t-lg"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">{title}</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gift-name" className="text-sm font-medium">
              Gift Name
            </Label>
            <Input
              id="gift-name"
              type="text"
              placeholder="Enter gift name..."
              value={giftName}
              onChange={(e) => setGiftName(e.target.value)}
              className="touch-target"
              autoFocus
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gift-cost" className="text-sm font-medium">
              Cost ({currency})
            </Label>
            <Input
              id="gift-cost"
              type="number"
              placeholder="0.00"
              value={giftCost}
              onChange={(e) => setGiftCost(e.target.value)}
              step="0.01"
              min="0"
              className="touch-target"
              autoComplete="off"
            />
            {giftCost && !isNaN(parseFloat(giftCost)) && (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(parseFloat(giftCost), currency)}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 touch-target"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            
            <RippleButton
              type="submit"
              variant={getVariant()}
              disabled={isDisabled || !isFormValid}
              className="flex-1 touch-target"
            >
              <Save className="w-4 h-4 mr-2" />
              {submitLabel}
            </RippleButton>
          </div>
        </form>

        {/* Visual indicator for unsaved changes */}
        {hasUnsavedChanges && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-warning rounded-full animate-pulse" />
        )}
      </SheetContent>
    </Sheet>
  );
};