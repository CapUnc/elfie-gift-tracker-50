-- Drop the non-working trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Fix the households RLS policy to allow public insert (timing issue fix)
DROP POLICY IF EXISTS "Users can insert households" ON public.households;

CREATE POLICY "Users can insert households"
  ON public.households FOR INSERT
  TO public
  WITH CHECK (true);