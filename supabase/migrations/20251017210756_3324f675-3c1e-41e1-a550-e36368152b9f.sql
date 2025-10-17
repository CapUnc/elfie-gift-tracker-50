-- Function to automatically create profiles for Google OAuth users
CREATE OR REPLACE FUNCTION public.handle_google_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only process if this is an OAuth signup
  IF NEW.raw_user_meta_data->>'provider' IS NOT NULL THEN
    -- Check if profile already exists (prevent duplicate key errors)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
      -- Insert profile with data from OAuth provider (Google)
      INSERT INTO public.profiles (id, email, display_name)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
          NEW.raw_user_meta_data->>'full_name',
          NEW.raw_user_meta_data->>'name',
          split_part(NEW.email, '@', 1)
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table to auto-create profiles
CREATE TRIGGER on_google_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_google_user();