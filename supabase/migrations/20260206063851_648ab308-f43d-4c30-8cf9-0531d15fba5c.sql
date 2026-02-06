
-- 1. Tighten the households INSERT policy to require authentication
DROP POLICY IF EXISTS "Users can insert households" ON public.households;
CREATE POLICY "Users can insert households"
  ON public.households
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. The profiles SELECT policy already checks household membership via get_user_household_id,
-- but let's ensure it requires authentication explicitly
DROP POLICY IF EXISTS "Users can view profiles in their household" ON public.profiles;
CREATE POLICY "Users can view profiles in their household"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((household_id = get_user_household_id(auth.uid())) OR (id = auth.uid()));
