import { supabase } from '@/integrations/supabase/client';

/**
 * Make sure a person has their own giver in a household, with the name and emoji
 * they chose. The database only creates one when a profile is first inserted with
 * a household, not when someone joins a household or finishes an interrupted setup.
 */
export async function ensureOwnGiver(profileId: string, householdId: string, name: string, icon: string) {
  const { data: existing, error: findError } = await supabase
    .from('givers')
    .select('id')
    .eq('profile_id', profileId)
    .eq('household_id', householdId)
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;

  const { error } = existing
    ? await supabase.from('givers').update({ name, icon }).eq('id', existing.id)
    : await supabase.from('givers').insert({ household_id: householdId, profile_id: profileId, name, icon });
  if (error) throw error;
}
