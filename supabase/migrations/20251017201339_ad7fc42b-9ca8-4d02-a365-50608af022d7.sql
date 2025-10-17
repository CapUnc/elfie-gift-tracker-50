-- Add user_id to buyers table to link buyers to users
ALTER TABLE public.buyers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_buyers_user_id ON public.buyers(user_id);

-- Update RLS policy to allow users to update their own buyer record
CREATE POLICY "Users can update their own buyer record"
ON public.buyers
FOR UPDATE
USING (user_id = auth.uid());