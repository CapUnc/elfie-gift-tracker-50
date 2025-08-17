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
        className="max-h-[calc(100vh-env(keyboard-inset-height,0px))] h-auto min-h-[60vh] sm:h-auto sm:max-w-md sm:rounded-t-lg flex flex-col"
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
              Cost
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                {currency}
              </span>
              <Input
                id="gift-cost"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={giftCost}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers, decimals, and one decimal point
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setGiftCost(value);
                  }
                }}
                onBlur={() => {
                  // Format on blur if valid number
                  if (giftCost && !isNaN(parseFloat(giftCost))) {
                    const formatted = parseFloat(giftCost).toFixed(2);
                    setGiftCost(formatted);
                  }
                }}
                className="pl-8 touch-target"
                autoComplete="off"
              />
            </div>
            {/* Helper text only for validation errors */}
            {giftCost && isNaN(parseFloat(giftCost)) && (
              <p className="text-xs text-destructive">Numbers only</p>
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