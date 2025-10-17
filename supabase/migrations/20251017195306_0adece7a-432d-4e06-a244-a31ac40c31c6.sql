-- Create invite_codes table for household invitations
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  used BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Policies for invite_codes
CREATE POLICY "Users can view their household invite codes"
  ON public.invite_codes FOR SELECT
  TO authenticated
  USING (household_id = get_user_household_id(auth.uid()));

CREATE POLICY "Users can create invite codes for their household"
  ON public.invite_codes FOR INSERT
  TO authenticated
  WITH CHECK (household_id = get_user_household_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Anyone can view valid invite codes by code"
  ON public.invite_codes FOR SELECT
  TO authenticated
  USING (NOT used AND expires_at > now());

-- Function to generate invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _household_id UUID;
  _code TEXT;
BEGIN
  -- Get user's household
  SELECT household_id INTO _household_id
  FROM public.profiles
  WHERE id = auth.uid();

  IF _household_id IS NULL THEN
    RAISE EXCEPTION 'User has no household';
  END IF;

  -- Generate unique 8-character code
  _code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

  -- Insert invite code
  INSERT INTO public.invite_codes (household_id, code, created_by)
  VALUES (_household_id, _code, auth.uid());

  RETURN _code;
END;
$$;

-- Function to join household using invite code
CREATE OR REPLACE FUNCTION public.join_household_by_code(_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _household_id UUID;
  _invite_id UUID;
BEGIN
  -- Find valid invite code
  SELECT id, household_id INTO _invite_id, _household_id
  FROM public.invite_codes
  WHERE code = _code
    AND NOT used
    AND expires_at > now();

  IF _household_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Update user's profile to join household
  UPDATE public.profiles
  SET household_id = _household_id
  WHERE id = auth.uid();

  -- Mark invite as used
  UPDATE public.invite_codes
  SET used = true
  WHERE id = _invite_id;

  RETURN _household_id;
END;
$$;

-- Function to get household members
CREATE OR REPLACE FUNCTION public.get_household_members()
RETURNS TABLE (
  id UUID,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email, p.display_name, p.created_at
  FROM public.profiles p
  WHERE p.household_id = get_user_household_id(auth.uid())
  ORDER BY p.created_at ASC;
$$;