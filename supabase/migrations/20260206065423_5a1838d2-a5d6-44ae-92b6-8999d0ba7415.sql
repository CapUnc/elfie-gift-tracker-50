
-- Fix recipient_notes policies: change from public to authenticated role
DROP POLICY IF EXISTS "Users can view their household recipient notes" ON public.recipient_notes;
CREATE POLICY "Users can view their household recipient notes"
  ON public.recipient_notes
  FOR SELECT
  TO authenticated
  USING (household_id = get_user_household_id(auth.uid()));

DROP POLICY IF EXISTS "Users can insert notes in their household" ON public.recipient_notes;
CREATE POLICY "Users can insert notes in their household"
  ON public.recipient_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (household_id = get_user_household_id(auth.uid()));

DROP POLICY IF EXISTS "Users can update their household recipient notes" ON public.recipient_notes;
CREATE POLICY "Users can update their household recipient notes"
  ON public.recipient_notes
  FOR UPDATE
  TO authenticated
  USING (household_id = get_user_household_id(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their household recipient notes" ON public.recipient_notes;
CREATE POLICY "Users can delete their household recipient notes"
  ON public.recipient_notes
  FOR DELETE
  TO authenticated
  USING (household_id = get_user_household_id(auth.uid()));
