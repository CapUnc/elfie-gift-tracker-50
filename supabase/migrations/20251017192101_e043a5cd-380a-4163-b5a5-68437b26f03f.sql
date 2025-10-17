-- Fix the households INSERT RLS policy to avoid circular dependency
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert households" ON public.households;

-- Create a simpler policy that just checks authentication
-- This allows any authenticated user to create a household during signup
CREATE POLICY "Users can insert households"
  ON public.households 
  FOR INSERT
  TO authenticated
  WITH CHECK (true);