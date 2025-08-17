import React, { createContext, useContext, ReactNode } from 'react';
import { Person, Buyer, AppSettings } from '@/types';
import { usePeople, useBuyers, useSettings, usePeopleMutations, useSettingsMutations } from '@/hooks/useAppData';

interface DataContextType {
  // Data
  people: Person[];
  buyers: Buyer[];
  settings: AppSettings;
  
  // Loading states
  isPeopleLoading: boolean;
  isBuyersLoading: boolean;
  isSettingsLoading: boolean;
  
  // Mutations
  updatePeople: ReturnType<typeof usePeopleMutations>['updatePeople'];
  addPerson: ReturnType<typeof usePeopleMutations>['addPerson'];
  updatePerson: ReturnType<typeof usePeopleMutations>['updatePerson'];
  deletePerson: ReturnType<typeof usePeopleMutations>['deletePerson'];
  updateSettings: ReturnType<typeof useSettingsMutations>['updateSettings'];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useAppData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { data: people = [], isLoading: isPeopleLoading } = usePeople();
  const { data: buyers = [], isLoading: isBuyersLoading } = useBuyers();
  const { data: settings = { currency: '$', buyers: [] }, isLoading: isSettingsLoading } = useSettings();
  
  const peopleMutations = usePeopleMutations();
  const settingsMutations = useSettingsMutations();

  const value: DataContextType = {
    people,
    buyers,
    settings,
    isPeopleLoading,
    isBuyersLoading,
    isSettingsLoading,
    ...peopleMutations,
    ...settingsMutations,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};