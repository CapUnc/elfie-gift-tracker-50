import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { RippleButton } from './RippleButton';
import { useAnimatedButton } from '@/hooks/useAnimatedButton';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Trash2 } from 'lucide-react';
import { z } from 'zod';
import type { Giver } from '@/hooks/useGivers';
import type { GiftTemplate } from '@/hooks/useGiftTemplates';

const giftSchema = z.object({
  name: z.string().trim().min(1, 'Gift name is required').max(100, 'Gift name must be less than 100 characters'),
  cost: z.string().regex(/^\d*\.?\d{0,2}$/, 'Invalid cost format').optional().or(z.literal('')),
});

interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  is_placeholder?: boolean;
  template_id?: string | null;
  givers?: Array<{ id: string; name: string; icon: string }>;
}

interface GiftFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (giftData: { 
    name: string; 
    cost: string; 
    isPlaceholder: boolean;
    templateId?: string;
    giverIds: string[];
  }) => void;
  onDelete?: (giftId: string) => void;
  updateGift?: (personId: string, giftId: string, updatedGift: Partial<Gift>) => void;
  personName: string;
  currency: string;
  editingGift?: Gift | null;
  mode?: 'add' | 'edit';
  givers: Giver[];
  templates: GiftTemplate[];
}

export const GiftForm: React.FC<GiftFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  updateGift,
  personName,
  currency,
  editingGift,
  mode = 'add',
  givers,
  templates
}) => {
  // Ensure givers and templates are always arrays
  const safeGivers = Array.isArray(givers) ? givers : [];
  const safeTemplates = Array.isArray(templates) ? templates : [];
  
  const [giftName, setGiftName] = useState('');
  const [giftCost, setGiftCost] = useState('');
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');
  const [selectedGiverIds, setSelectedGiverIds] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialValues, setInitialValues] = useState({ 
    name: '', 
    cost: '', 
    isPlaceholder: false,
    templateId: 'none',
    giverIds: [] as string[]
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { toast } = useToast();
  const haptic = useHapticFeedback();
  const { execute: saveGift, getVariant, isDisabled } = useAnimatedButton(async () => {
    console.log('🔵 [GiftForm] saveGift called with state:', {
      giftName,
      giftCost,
      isPlaceholder,
      selectedGiverIds,
      mode
    });
    
    // For placeholder gifts, name is optional
    const trimmedName = giftName.trim();
    const trimmedCost = giftCost.trim();
    
    if (!isPlaceholder) {
      const validation = giftSchema.safeParse({ name: trimmedName, cost: trimmedCost });
      
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive"
        });
        return;
      }
    } else if (trimmedCost && !/^\d*\.?\d{0,2}$/.test(trimmedCost)) {
      toast({
        title: "Validation Error",
        description: "Invalid cost format",
        variant: "destructive"
      });
      return;
    }
    
    const submitData = { 
      name: isPlaceholder && !trimmedName ? 'TBD Gift' : trimmedName, 
      cost: trimmedCost,
      isPlaceholder,
      templateId: selectedTemplateId !== 'none' ? selectedTemplateId : undefined,
      giverIds: selectedGiverIds
    };
    
    console.log('🟢 [GiftForm] Submitting gift with data:', submitData);
    
    haptic.success();
    onSubmit(submitData);
    resetForm();
  });

  // Initialize form with editing data
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && editingGift) {
        const name = editingGift.name || '';
        const cost = editingGift.cost?.toString() || '';
        const placeholder = editingGift.is_placeholder ?? false;
        const templateId = editingGift.template_id || 'none';
        const giverIds = Array.isArray(editingGift.givers) 
          ? editingGift.givers.map(g => g.id) 
          : [];
        
        setGiftName(name);
        setGiftCost(cost);
        setIsPlaceholder(placeholder);
        setSelectedTemplateId(templateId);
        setSelectedGiverIds(giverIds);
        setInitialValues({ name, cost, isPlaceholder: placeholder, templateId, giverIds });
      } else {
        setGiftName('');
        setGiftCost('');
        setIsPlaceholder(false);
        setSelectedTemplateId('none');
        setSelectedGiverIds([]);
        setInitialValues({ name: '', cost: '', isPlaceholder: false, templateId: 'none', giverIds: [] });
      }
      setHasUnsavedChanges(false);
    }
  }, [isOpen, mode, editingGift]);

  // Track unsaved changes
  useEffect(() => {
    const nameChanged = giftName !== initialValues.name;
    const costChanged = giftCost !== initialValues.cost;
    const placeholderChanged = isPlaceholder !== initialValues.isPlaceholder;
    const templateChanged = selectedTemplateId !== initialValues.templateId;
    const giversChanged = JSON.stringify(selectedGiverIds) !== JSON.stringify(initialValues.giverIds);
    setHasUnsavedChanges(nameChanged || costChanged || placeholderChanged || templateChanged || giversChanged);
  }, [giftName, giftCost, isPlaceholder, selectedTemplateId, selectedGiverIds, initialValues]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    if (templateId !== 'none') {
      const template = safeTemplates.find(t => t.id === templateId);
      if (template) {
        setGiftName(template.name);
        setGiftCost(template.default_cost?.toString() || '');
        setSelectedGiverIds(template.default_giver_ids || []);
      }
    }
  };

  const resetForm = () => {
    setGiftName('');
    setGiftCost('');
    setIsPlaceholder(false);
    setSelectedTemplateId('none');
    setSelectedGiverIds([]);
    setHasUnsavedChanges(false);
    setInitialValues({ name: '', cost: '', isPlaceholder: false, templateId: 'none', giverIds: [] });
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
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

  const toggleGiver = (giverId: string) => {
    console.log('🟡 [GiftForm] toggleGiver called with:', giverId);
    console.log('🟡 [GiftForm] Current selectedGiverIds:', selectedGiverIds);
    
    setSelectedGiverIds(prev => {
      const newIds = prev.includes(giverId) 
        ? prev.filter(id => id !== giverId)
        : [...prev, giverId];
      
      console.log('🟡 [GiftForm] New selectedGiverIds:', newIds);
      return newIds;
    });
  };

  const isFormValid = isPlaceholder || giftName.trim().length > 0;
  const title = mode === 'edit' ? 'Edit Gift' : `Add Gift for ${personName}`;
  const submitLabel = mode === 'edit' ? 'Update Gift' : 'Save Gift';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent 
        side="bottom" 
        className="max-h-[90vh] h-auto overflow-y-auto sm:max-w-md sm:rounded-t-lg flex flex-col"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">{title}</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pb-6">
          {mode === 'add' && safeTemplates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="template-select" className="text-sm font-medium">
                Use Template (optional)
              </Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="No template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {safeTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.tag_icon} {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === 'edit' && editingGift?.template_id && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Badge variant="secondary">Template</Badge>
              <span className="text-sm flex-1">
                {safeTemplates.find(t => t.id === editingGift.template_id)?.name || 'Unknown Template'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTemplateId('none');
                  updateGift?.(editingGift.id, editingGift.id, { template_id: null });
                }}
                className="h-8 px-2"
              >
                Remove
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-placeholder"
              checked={isPlaceholder}
              onCheckedChange={(checked) => setIsPlaceholder(!!checked)}
            />
            <label htmlFor="is-placeholder" className="text-sm cursor-pointer">
              This is a placeholder (gift not decided yet)
            </label>
          </div>

          {isPlaceholder && (
            <p className="text-xs text-muted-foreground">
              Placeholder gifts can be converted to real gifts later. They won't count towards completion.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="gift-name" className="text-sm font-medium">
              Gift Name {isPlaceholder && <span className="text-muted-foreground">(optional)</span>}
            </Label>
            <Input
              id="gift-name"
              type="text"
              placeholder={isPlaceholder ? "TBD Gift" : "Enter gift name..."}
              value={giftName}
              onChange={(e) => setGiftName(e.target.value)}
              className="touch-target"
              autoFocus={!isPlaceholder}
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
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setGiftCost(value);
                  }
                }}
                onBlur={() => {
                  if (giftCost && !isNaN(parseFloat(giftCost))) {
                    const formatted = parseFloat(giftCost).toFixed(2);
                    setGiftCost(formatted);
                  }
                }}
                className="pl-8 touch-target"
                autoComplete="off"
              />
            </div>
          </div>

          {safeGivers.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">From</Label>
              <div className="grid grid-cols-2 gap-2">
                {safeGivers.map(giver => (
                  <div
                    key={giver.id}
                    className={cn(
                      "flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all",
                      selectedGiverIds.includes(giver.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGiver(giver.id);
                    }}
                  >
                    <Checkbox
                      id={`giver-${giver.id}`}
                      checked={selectedGiverIds.includes(giver.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-lg">{giver.icon}</span>
                    <span className="text-sm font-medium flex-1">{giver.name}</span>
                  </div>
                ))}
              </div>
              {selectedGiverIds.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Select at least one giver for this gift
                </p>
              )}
            </div>
          )}

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
