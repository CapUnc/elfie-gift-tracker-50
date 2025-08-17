import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Person, Buyer, AppSettings } from '@/types';
import { DataService } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';

const QUERY_KEYS = {
  PEOPLE: ['people'] as const,
  BUYERS: ['buyers'] as const,
  SETTINGS: ['settings'] as const,
};

export const usePeople = () => {
  return useQuery({
    queryKey: QUERY_KEYS.PEOPLE,
    queryFn: DataService.getPeople,
    staleTime: 0, // Always consider data stale for localStorage
  });
};

export const useBuyers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.BUYERS,
    queryFn: DataService.getBuyers,
    staleTime: 0,
  });
};

export const useSettings = () => {
  return useQuery({
    queryKey: QUERY_KEYS.SETTINGS,
    queryFn: DataService.getSettings,
    staleTime: 0,
  });
};

export const usePeopleMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updatePeople = useMutation({
    mutationFn: (people: Person[]) => {
      DataService.savePeople(people);
      return Promise.resolve(people);
    },
    onSuccess: (people) => {
      queryClient.setQueryData(QUERY_KEYS.PEOPLE, people);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    },
  });

  const addPerson = useMutation({
    mutationFn: (person: Omit<Person, 'id'>) => {
      const currentPeople = DataService.getPeople();
      const newPerson: Person = {
        ...person,
        id: Date.now().toString(),
      };
      const updatedPeople = [...currentPeople, newPerson];
      DataService.savePeople(updatedPeople);
      return Promise.resolve(updatedPeople);
    },
    onSuccess: (people) => {
      queryClient.setQueryData(QUERY_KEYS.PEOPLE, people);
      toast({
        title: "Success",
        description: "Person added successfully",
      });
    },
  });

  const updatePerson = useMutation({
    mutationFn: ({ personId, updates }: { personId: string; updates: Partial<Person> }) => {
      const currentPeople = DataService.getPeople();
      const updatedPeople = currentPeople.map(person =>
        person.id === personId ? { ...person, ...updates } : person
      );
      DataService.savePeople(updatedPeople);
      return Promise.resolve(updatedPeople);
    },
    onSuccess: (people) => {
      queryClient.setQueryData(QUERY_KEYS.PEOPLE, people);
    },
  });

  const deletePerson = useMutation({
    mutationFn: (personId: string) => {
      const currentPeople = DataService.getPeople();
      const updatedPeople = currentPeople.filter(person => person.id !== personId);
      DataService.savePeople(updatedPeople);
      return Promise.resolve(updatedPeople);
    },
    onSuccess: (people) => {
      queryClient.setQueryData(QUERY_KEYS.PEOPLE, people);
      toast({
        title: "Success",
        description: "Person deleted successfully",
      });
    },
  });

  return {
    updatePeople,
    addPerson,
    updatePerson,
    deletePerson,
  };
};

export const useSettingsMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateSettings = useMutation({
    mutationFn: (settings: Partial<AppSettings>) => {
      DataService.saveSettings(settings);
      return Promise.resolve(DataService.getSettings());
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(QUERY_KEYS.SETTINGS, settings);
      // Also update individual queries if they exist
      if (settings.buyers) {
        queryClient.setQueryData(QUERY_KEYS.BUYERS, settings.buyers);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  return { updateSettings };
};