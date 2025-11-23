-- Update create_user_household_and_profile function to auto-create Santa
CREATE OR REPLACE FUNCTION public.create_user_household_and_profile(_user_id uuid, _email text, _display_name text, _currency text DEFAULT '$'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _household_id uuid;
BEGIN
  -- Only allow users to create their own household
  IF _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check if household already exists
  SELECT household_id INTO _household_id
  FROM public.profiles
  WHERE id = _user_id;

  IF _household_id IS NOT NULL THEN
    RETURN _household_id;
  END IF;

  -- Create household
  INSERT INTO public.households (name, currency)
  VALUES ('My Household', _currency)
  RETURNING id INTO _household_id;

  -- Create or update profile
  INSERT INTO public.profiles (id, household_id, email, display_name)
  VALUES (_user_id, _household_id, _email, _display_name)
  ON CONFLICT (id) DO UPDATE
  SET household_id = EXCLUDED.household_id,
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name;

  -- Create default "Santa" virtual giver as an example
  INSERT INTO public.givers (household_id, name, icon, display_order, is_virtual)
  VALUES (
    _household_id,
    'Santa',
    '🎅',
    1,
    true
  );

  RETURN _household_id;
END;
$function$;

-- Add Santa to existing households that don't have one
INSERT INTO public.givers (household_id, name, icon, display_order, is_virtual)
SELECT 
  h.id,
  'Santa',
  '🎅',
  COALESCE((SELECT MAX(display_order) + 1 FROM public.givers WHERE household_id = h.id), 0),
  true
FROM public.households h
WHERE NOT EXISTS (
  SELECT 1 FROM public.givers g 
  WHERE g.household_id = h.id 
  AND g.name = 'Santa'
);