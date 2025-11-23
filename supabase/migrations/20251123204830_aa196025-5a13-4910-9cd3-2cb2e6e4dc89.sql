-- Add profile_id and is_virtual columns to givers table
ALTER TABLE public.givers
ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN is_virtual BOOLEAN NOT NULL DEFAULT false;

-- Create index for better query performance
CREATE INDEX idx_givers_profile_id ON public.givers(profile_id);

-- Create function to automatically create a giver when a profile is created
CREATE OR REPLACE FUNCTION public.create_giver_for_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _household_id UUID;
  _max_order INTEGER;
BEGIN
  -- Get the household_id from the new profile
  _household_id := NEW.household_id;
  
  -- Only create giver if profile has a household
  IF _household_id IS NOT NULL THEN
    -- Get max display_order for this household
    SELECT COALESCE(MAX(display_order), -1) INTO _max_order
    FROM public.givers
    WHERE household_id = _household_id;
    
    -- Create a giver linked to this profile
    INSERT INTO public.givers (household_id, profile_id, name, icon, display_order, is_virtual)
    VALUES (
      _household_id,
      NEW.id,
      COALESCE(NEW.display_name, split_part(NEW.email, '@', 1)),
      '🎁',
      _max_order + 1,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create giver on profile insert
CREATE TRIGGER on_profile_created_create_giver
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_giver_for_profile();

-- Create function to sync profile name changes to giver
CREATE OR REPLACE FUNCTION public.sync_profile_to_giver()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update linked giver's name when profile display_name changes
  IF OLD.display_name IS DISTINCT FROM NEW.display_name THEN
    UPDATE public.givers
    SET name = COALESCE(NEW.display_name, split_part(NEW.email, '@', 1))
    WHERE profile_id = NEW.id AND is_virtual = false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync profile updates to giver
CREATE TRIGGER on_profile_updated_sync_giver
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_giver();

-- Migration: Link existing profiles to givers
-- First, try to match existing givers to profiles by name
UPDATE public.givers g
SET profile_id = p.id,
    is_virtual = false
FROM public.profiles p
WHERE g.household_id = p.household_id
  AND g.name = p.display_name
  AND g.profile_id IS NULL;

-- Mark remaining givers as virtual (not linked to any profile)
UPDATE public.givers
SET is_virtual = true
WHERE profile_id IS NULL;

-- Create givers for profiles that don't have one yet
INSERT INTO public.givers (household_id, profile_id, name, icon, display_order, is_virtual)
SELECT 
  p.household_id,
  p.id,
  COALESCE(p.display_name, split_part(p.email, '@', 1)),
  '🎁',
  COALESCE((SELECT MAX(display_order) + 1 FROM public.givers WHERE household_id = p.household_id), 0),
  false
FROM public.profiles p
WHERE p.household_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.givers g WHERE g.profile_id = p.id
  );