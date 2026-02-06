// Canonical shared types for the gift tracking domain.
// All components should import from here instead of defining local interfaces.

export interface Giver {
  id: string;
  name: string;
  icon: string;
  is_virtual?: boolean;
  household_id?: string;
  profile_id?: string;
}

export interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  url?: string | null;
  tracking?: string | null;
  assigned_to?: string | null;
  is_placeholder?: boolean;
  recipient_id: string;
  household_id?: string;
  created_at?: string;
  updated_at?: string;
  givers?: Giver[];
}

export interface Recipient {
  id: string;
  name: string;
  notes: string;
  assigned_to: string | null;
  completed: boolean;
  manual_complete: boolean;
  household_id?: string;
  created_at?: string;
}

export interface Person {
  id: string;
  name: string;
  gifts: Gift[];
  notes: string;
  completed?: boolean;
  manualComplete?: boolean;
}

export interface SearchFilters {
  assignedTo: string;
  completion: 'all' | 'completed' | 'incomplete';
  wrapping: 'all' | 'needs-wrapping' | 'all-wrapped';
  showCompleted: boolean;
  hasGifts: 'all' | 'with-gifts' | 'no-gifts';
  costStatus: 'all' | 'missing-cost';
}

export interface SortConfig {
  key: 'name' | 'cost' | 'progress';
  direction: 'asc' | 'desc';
}
