import { createContext, useContext, ReactNode } from 'react';
import { useHousehold as useHouseholdHook } from '@/hooks/useHousehold';
import { useAuthContext } from './AuthContext';

interface HouseholdContextType {
  householdId: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const HouseholdProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const household = useHouseholdHook(user?.id);
  return <HouseholdContext.Provider value={household}>{children}</HouseholdContext.Provider>;
};

export const useHouseholdContext = (): HouseholdContextType => {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHouseholdContext must be used within a HouseholdProvider');
  }
  return context;
};
