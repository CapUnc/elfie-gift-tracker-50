-- SECURITY: Update get_household_members to not expose email addresses
-- This prevents email harvesting by household members
-- Only return non-sensitive fields: id, display_name, created_at

DROP FUNCTION IF EXISTS public.get_household_members();

CREATE OR REPLACE FUNCTION public.get_household_members()
RETURNS TABLE(id uuid, display_name text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- SECURITY REQUIREMENT: This function must only return data for the calling user's household
  -- The get_user_household_id() function ensures users can only see members from their own household
  SELECT p.id, p.display_name, p.created_at
  FROM public.profiles p
  WHERE p.household_id = get_user_household_id(auth.uid())
  ORDER BY p.created_at ASC;
$$;