/**
 * Giver-related TypeScript types and constants
 * Centralized type definitions for the gift giver system
 */

// Main Giver interface matching database schema
export interface Giver {
  id: string;
  household_id: string;
  name: string;
  icon: string | null;
  display_order: number;
  created_at: string;
  profile_id: string | null;
  is_virtual: boolean;
}

// Partial update type for giver mutations
export type GiverUpdate = Partial<Pick<Giver, 'name' | 'icon' | 'display_order'>>;

// Common giver icons as a const array for type safety
export const COMMON_GIVER_ICONS = [
  '🎁', '👩', '👨', '🎅', '🙋', '👶', 
  '👧', '👦', '🧑', '👴', '👵', '🎄', 
  '⭐', '❤️', '🎉'
] as const;

// Type for giver icon union
export type GiverIcon = typeof COMMON_GIVER_ICONS[number];

// Helper type guards
export const isProfileLinkedGiver = (giver: Giver): boolean => {
  return !giver.is_virtual && giver.profile_id !== null;
};

export const isVirtualGiver = (giver: Giver): boolean => {
  return giver.is_virtual;
};

// Result type for delete operation
export interface DeleteGiverResult {
  canDelete: boolean;
  giftCount: number;
}

// Props interface for components using givers
export interface GiverComponentProps {
  giver: Giver;
  onEdit?: (giver: Giver) => void;
  onDelete?: (giver: Giver) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}
