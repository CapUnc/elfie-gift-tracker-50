// Re-export all types for convenience
export * from '@/types';
export * from '@/constants';
export { DataService } from '@/services/dataService';
export { useAppData } from '@/components/providers/DataProvider';
export { 
  usePeople, 
  useBuyers, 
  useSettings, 
  usePeopleMutations, 
  useSettingsMutations 
} from '@/hooks/useAppData';