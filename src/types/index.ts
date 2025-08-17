export interface Buyer {
  id: string;
  name: string;
  emoji: string;
}

export interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  url?: string;
  tracking?: string;
  assignedTo?: string;
}

export interface Person {
  id: string;
  name: string;
  gifts: Gift[];
  notes: string;
  assignedTo: string | null;
  completed?: boolean;
  manualComplete?: boolean;
}

export interface SearchFilters {
  assignedTo: string;
  completion: 'all' | 'completed' | 'incomplete';
  wrapping: 'all' | 'needs-wrapping' | 'all-wrapped';
  showCompleted: boolean;
  hasGifts: 'all' | 'with-gifts' | 'no-gifts';
}

export interface AppSettings {
  currency: string;
  buyers: Buyer[];
  targetDate?: Date;
}