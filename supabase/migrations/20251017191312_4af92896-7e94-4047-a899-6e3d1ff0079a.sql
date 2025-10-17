-- Create households table
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  currency TEXT DEFAULT '$',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create buyers table
CREATE TABLE public.buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create recipients table
CREATE TABLE public.recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  assigned_to UUID REFERENCES public.buyers(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT false,
  manual_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create gifts table
CREATE TABLE public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.recipients(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost NUMERIC,
  purchased BOOLEAN DEFAULT false,
  wrapped BOOLEAN DEFAULT false,
  url TEXT,
  tracking TEXT,
  assigned_to UUID REFERENCES public.buyers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check household membership
CREATE OR REPLACE FUNCTION public.get_user_household_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.profiles WHERE id = _user_id;
$$;

-- RLS Policies for households
CREATE POLICY "Users can view their own household"
  ON public.households FOR SELECT
  TO authenticated
  USING (id = public.get_user_household_id(auth.uid()));

CREATE POLICY "Users can update their own household"
  ON public.households FOR UPDATE
  TO authenticated
  USING (id = public.get_user_household_id(auth.uid()));

CREATE POLICY "Users can insert households"
  ON public.households FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their household"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (household_id = public.get_user_household_id(auth.uid()) OR id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- RLS Policies for buyers
CREATE POLICY "Users can view their household buyers"
  ON public.buyers FOR SELECT
  TO authenticated
  USING (household_id = public.get_user_household_id(auth.uid()));

CREATE POLICY "Users can insert buyers in their household"
  ON public.buyers FOR INSERT
  TO authenticated
  WITH CHECK (household_id = public.get_user_household_id(auth.uid()));

CREATE POLICY "Users can update their household buyers"
  ON public.buyers FOR UPDATE
  TO authenticated
  USING (household_id = public.get_user_household_id(auth.uid()));

CREATE POLICY "Users can delete their household buyers"
  ON public.buyers FOR DELETE
  TO authenticated
  USING (household_id = public.get_user_household_id(auth.uid()));

-- RLS Policies for recipients
CREATE POLICY "Users can view their household recipients"
  ON public.recipients FOR SELECT
  TO authenticated
  USING (household_id = public.get_user_household_id(auth.uid()));

CREATE POLICY "Users can insert recipients in their household"
  ON public.recipients FOR INSERT
  TO authenticated
  WITH CHECK (household_id = public.get_user_household_id(auth.uid()));

CREATE POLICY "Users can update their household recipients"
  ON public.recipients FOR UPDATE
  TO authenticated
  USING (household_id = public.get_user_household_id(auth.uid()));

CREATE POLICY "Users can delete their household recipients"
  ON public.recipients FOR DELETE
  TO authenticated
  USING (household_id = public.get_user_household_id(auth.uid()));

-- RLS Policies for gifts
CREATE POLICY "Users can view their household gifts"
  ON public.gifts FOR SELECT
  TO authenticated
  USING (household_id = public.get_user_household_id(auth.uid()));

CREATE POLICY "Users can insert gifts in their household"
  ON public.gifts FOR INSERT
  TO authenticated
  WITH CHECK (household_id = public.get_user_household_id(auth.uid()));

CREATE POLICY "Users can update their household gifts"
  ON public.gifts FOR UPDATE
  TO authenticated
  USING (household_id = public.get_user_household_id(auth.uid()));

CREATE POLICY "Users can delete their household gifts"
  ON public.gifts FOR DELETE
  TO authenticated
  USING (household_id = public.get_user_household_id(auth.uid()));

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gifts table
CREATE TRIGGER update_gifts_updated_at
  BEFORE UPDATE ON public.gifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.households;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buyers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recipients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gifts;