-- Create trigger function to automatically set up household and profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household_id uuid;
BEGIN
  -- Create household for new user
  INSERT INTO public.households (name, currency)
  VALUES ('My Household', '$')
  RETURNING id INTO new_household_id;
  
  -- Create profile linked to household
  INSERT INTO public.profiles (id, household_id, email, display_name)
  VALUES (
    NEW.id,
    new_household_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to automatically create household and profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();