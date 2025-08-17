export const STORAGE_KEYS = {
  PEOPLE: 'christmas-gifts-2025',
  CURRENCY: 'christmas-gifts-currency',
  BUYERS: 'christmas-gifts-buyers',
  TARGET_DATE: 'christmas-gifts-target-date'
} as const;

export const DEFAULT_BUYERS = [
  { id: '1', name: 'Matt', emoji: '👨' },
  { id: '2', name: 'Maddie', emoji: '👩' }
];

export const DEFAULT_CURRENCY = '$';

export const DEFAULT_FILTERS = {
  assignedTo: 'all',
  completion: 'all' as const,
  wrapping: 'all' as const,
  showCompleted: false,
  hasGifts: 'all' as const
};