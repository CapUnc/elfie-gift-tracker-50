-- Make user_id NOT NULL and add constraint to ensure one buyer per user per household
-- First, handle any existing buyers without user_id (edge case cleanup)
DELETE FROM public.buyers WHERE user_id IS NULL;

-- Add unique constraint to prevent duplicate buyers for same user (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_per_household'
  ) THEN
    ALTER TABLE public.buyers 
    ADD CONSTRAINT unique_user_per_household 
    UNIQUE (household_id, user_id);
  END IF;
END $$;

-- Make user_id required (buyers must be real users)
ALTER TABLE public.buyers
ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies to enforce users can only manage their own buyer records
DROP POLICY IF EXISTS "Users can update their household buyers" ON public.buyers;
DROP POLICY IF EXISTS "Users can delete their household buyers" ON public.buyers;
DROP POLICY IF EXISTS "Users can insert buyers in their household" ON public.buyers;
DROP POLICY IF EXISTS "Users can insert their own buyer record" ON public.buyers;
DROP POLICY IF EXISTS "Users can delete their own buyer record" ON public.buyers;

-- Users can only create buyer records for themselves
CREATE POLICY "Users can insert their own buyer record"
ON public.buyers
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND household_id = get_user_household_id(auth.uid()));

-- Users can only update their own buyer record (keep existing one that already exists)
-- Already exists from previous migration, so no need to recreate

-- Users can only delete their own buyer record
CREATE POLICY "Users can delete their own buyer record"
ON public.buyers
FOR DELETE
TO authenticated
USING (user_id = auth.uid());