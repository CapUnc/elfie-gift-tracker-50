import React from 'react';
import { Edit2, ShoppingCart, Package, Trash2, Plus, CheckCircle } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

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

interface GiftContextMenuProps {
  gift: Gift;
  children: React.ReactNode;
  onEdit: () => void;
  onTogglePurchased: () => void;
  onToggleWrapped: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
}

export const GiftContextMenu: React.FC<GiftContextMenuProps> = ({
  gift,
  children,
  onEdit,
  onTogglePurchased,
  onToggleWrapped,
  onDelete,
  onDuplicate
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onEdit}>
          <Edit2 className="mr-2 h-4 w-4" />
          Edit Gift
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={onTogglePurchased}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {gift.purchased ? 'Mark as Not Purchased' : 'Mark as Purchased'}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onToggleWrapped}>
          <Package className="mr-2 h-4 w-4" />
          {gift.wrapped ? 'Mark as Not Wrapped' : 'Mark as Wrapped'}
        </ContextMenuItem>
        
        {onDuplicate && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDuplicate}>
              <Plus className="mr-2 h-4 w-4" />
              Duplicate Gift
            </ContextMenuItem>
          </>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Gift
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

interface PersonContextMenuProps {
  children: React.ReactNode;
  onAddGift: () => void;
  onEditNotes: () => void;
  onEditAssignment: () => void;
  onMarkAllPurchased: () => void;
  onMarkAllWrapped: () => void;
  onMarkComplete: () => void;
  hasGifts: boolean;
  isComplete: boolean;
}

export const PersonContextMenu: React.FC<PersonContextMenuProps> = ({
  children,
  onAddGift,
  onEditNotes,
  onEditAssignment,
  onMarkAllPurchased,
  onMarkAllWrapped,
  onMarkComplete,
  hasGifts,
  isComplete
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onAddGift}>
          <Plus className="mr-2 h-4 w-4" />
          Add Gift
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={onEditNotes}>
          <Edit2 className="mr-2 h-4 w-4" />
          Edit Notes
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onEditAssignment}>
          <Edit2 className="mr-2 h-4 w-4" />
          Edit Assignment
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={onMarkComplete}>
          <CheckCircle className="mr-2 h-4 w-4" />
          {isComplete ? 'Mark Not Complete' : 'Mark Complete'}
        </ContextMenuItem>
        
        {hasGifts && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onMarkAllPurchased}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Mark All as Purchased
            </ContextMenuItem>
            
            <ContextMenuItem onClick={onMarkAllWrapped}>
              <Package className="mr-2 h-4 w-4" />
              Mark All as Wrapped
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};