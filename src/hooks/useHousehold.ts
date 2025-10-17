import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useHousehold = (userId: string | undefined) => {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const setupHousehold = async () => {
      try {
        // Check if user has a profile with household
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('household_id')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profile?.household_id) {
          setHouseholdId(profile.household_id);
          setLoading(false);
          return;
        }

        // No household yet - migrate from localStorage or create new
        await migrateLocalDataToCloud(userId);
        
        // Re-fetch profile to get household_id
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('household_id')
          .eq('id', userId)
          .single();

        setHouseholdId(newProfile?.household_id || null);
      } catch (error: any) {
        console.error('Error setting up household:', error);
        toast({
          title: "Error",
          description: "Failed to set up household. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    setupHousehold();
  }, [userId, toast]);

  const migrateLocalDataToCloud = async (userId: string) => {
    try {
      // Read localStorage data
      const localPeople = localStorage.getItem('christmas-gifts-2025');
      const localBuyers = localStorage.getItem('christmas-gifts-buyers');

      // Wait briefly for database trigger to complete household and profile creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch the automatically created household
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.household_id) {
        throw new Error('Household not found. Please try refreshing the page.');
      }

      const householdId = profile.household_id;

      // Migrate buyers
      if (localBuyers) {
        const buyers = JSON.parse(localBuyers);
        const buyersToInsert = buyers.map((buyer: any) => ({
          household_id: householdId,
          name: buyer.name,
          emoji: buyer.emoji,
        }));

        const { data: insertedBuyers, error: buyersError } = await supabase
          .from('buyers')
          .insert(buyersToInsert)
          .select();

        if (buyersError) throw buyersError;

        // Migrate people and gifts
        if (localPeople) {
          const people = JSON.parse(localPeople);
          
          for (const person of people) {
            // Find buyer ID by name if assigned
            let assignedBuyerId = null;
            if (person.assignedTo) {
              const buyer = insertedBuyers?.find(b => b.name === person.assignedTo);
              assignedBuyerId = buyer?.id || null;
            }

            // Insert recipient
            const { data: recipient, error: recipientError } = await supabase
              .from('recipients')
              .insert({
                household_id: householdId,
                name: person.name,
                notes: person.notes || '',
                assigned_to: assignedBuyerId,
                completed: person.completed || false,
                manual_complete: person.manualComplete || false,
              })
              .select()
              .single();

            if (recipientError) throw recipientError;

            // Insert gifts for this recipient
            if (person.gifts && person.gifts.length > 0) {
              const giftsToInsert = person.gifts.map((gift: any) => {
                let giftAssignedBuyerId = null;
                if (gift.assignedTo) {
                  const buyer = insertedBuyers?.find(b => b.name === gift.assignedTo);
                  giftAssignedBuyerId = buyer?.id || null;
                }

                return {
                  household_id: householdId,
                  recipient_id: recipient.id,
                  name: gift.name,
                  cost: gift.cost || null,
                  purchased: gift.purchased || false,
                  wrapped: gift.wrapped || false,
                  url: gift.url || null,
                  tracking: gift.tracking || null,
                  assigned_to: giftAssignedBuyerId,
                };
              });

              const { error: giftsError } = await supabase
                .from('gifts')
                .insert(giftsToInsert);

              if (giftsError) throw giftsError;
            }
          }
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('christmas-gifts-2025');
      localStorage.removeItem('christmas-gifts-buyers');
      localStorage.removeItem('christmas-gifts-currency');

      toast({
        title: "Data Migrated",
        description: "Your data has been successfully moved to the cloud!",
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      throw error;
    }
  };

  return { householdId, loading };
};
