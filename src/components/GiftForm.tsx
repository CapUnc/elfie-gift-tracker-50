import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { RippleButton } from './RippleButton';
import { useAnimatedButton } from '@/hooks/useAnimatedButton';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { Save, X, Trash2, Check, Users } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const giftSchema = z.object({
  name: z.string().trim().min(1, 'Gift name is required').max(100, 'Gift name must be less than 100 characters'),
  cost: z.string().regex(/^\d*\.?\d{0,2}$/, 'Invalid cost format').optional().or(z.literal('')),
});

interface Giver {
  id: string;
  name: string;
  icon: string;
  is_virtual?: boolean;
}

interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  trackingNumber?: string;
  carrier?: string;
  assignedTo?: string | null;
  givers?: Giver[];
}

interface GiftFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (giftData: { name: string; cost: string; giverIds: string[] }) => void;
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
  const [openGiverSelect, setOpenGiverSelect] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialValues, setInitialValues] = useState({ name: '', cost: '', giverIds: [] as string[] });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { toast } = useToast();
  const haptic = useHapticFeedback();
  const { execute: saveGift, getVariant, isDisabled } = useAnimatedButton(async () => {
    // Validate input with zod schema (trim inputs first)
    const trimmedName = giftName.trim();
    const trimmedCost = giftCost.trim();
    
    const validation = giftSchema.safeParse({ name: trimmedName, cost: trimmedCost });
    
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }
    
    haptic.success();
    onSubmit({ name: trimmedName, cost: trimmedCost, giverIds: selectedGiverIds });
    resetForm();
  });

  // Initialize form with editing data
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editingGift) {
        const name = editingGift.name;
        const cost = editingGift.cost?.toString() || '';
        const giverIds = editingGift.givers?.map(g => g.id) || [];
        setGiftName(name);
        setGiftCost(cost);
        setSelectedGiverIds(giverIds);
        setInitialValues({ name, cost, giverIds });
      } else {
        setGiftName('');
        setGiftCost('');
        setSelectedGiverIds([]);
        setInitialValues({ name: '', cost: '', giverIds: [] });
      }
      setHasUnsavedChanges(false);
    }
  }, [isOpen, mode, editingGift]);

  // Track unsaved changes
  useEffect(() => {
    const nameChanged = giftName !== initialValues.name;
    const costChanged = giftCost !== initialValues.cost;
    const giversChanged = JSON.stringify(selectedGiverIds.sort()) !== JSON.stringify(initialValues.giverIds.sort());
    setHasUnsavedChanges(nameChanged || costChanged || giversChanged);
  }, [giftName, giftCost, selectedGiverIds, initialValues]);

  const resetForm = () => {
    setGiftName('');
    setGiftCost('');
    setSelectedGiverIds([]);
    setHasUnsavedChanges(false);
    setInitialValues({ name: '', cost: '', giverIds: [] });
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

  const handleDelete = () => {
    if (editingGift && onDelete) {
      onDelete(editingGift.id);
      setShowDeleteDialog(false);
      onClose();
    }
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

          {/* Givers Multi-Select */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Assigned To <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Popover open={openGiverSelect} onOpenChange={setOpenGiverSelect}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openGiverSelect}
                  className="w-full justify-between touch-target"
                >
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4 mr-1" />
                    {selectedGiverIds.length === 0 ? 'Select givers' : `${selectedGiverIds.length} selected`}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search givers..." />
                  <CommandEmpty>No givers found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {availableGivers.map((giver) => (
                      <CommandItem
                        key={giver.id}
                        onSelect={() => {
                          setSelectedGiverIds(prev =>
                            prev.includes(giver.id)
                              ? prev.filter(id => id !== giver.id)
                              : [...prev, giver.id]
                          );
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedGiverIds.includes(giver.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="mr-2">{giver.icon}</span>
                        {giver.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Selected givers badges */}
            {selectedGiverIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedGiverIds.map(giverId => {
                  const giver = availableGivers.find(g => g.id === giverId);
                  if (!giver) return null;
                  return (
                    <Badge key={giverId} variant="secondary" className="gap-1">
                      <span>{giver.icon}</span>
                      {giver.name}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => setSelectedGiverIds(prev => prev.filter(id => id !== giverId))}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4">
            {mode === 'edit' && onDelete && editingGift && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full touch-target"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Gift
                </Button>
                <div className="h-px bg-border my-2" />
              </>
            )}
            
            <div className="flex gap-3">
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
          </div>
        </form>

        {/* Visual indicator for unsaved changes */}
        {hasUnsavedChanges && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-warning rounded-full animate-pulse" />
        )}
      </SheetContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gift</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{editingGift?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};