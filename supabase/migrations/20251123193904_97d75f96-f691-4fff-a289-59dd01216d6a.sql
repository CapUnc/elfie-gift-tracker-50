-- Phase 1: Create givers table
CREATE TABLE public.givers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🎁',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(household_id, name)
);

-- RLS Policies for givers
ALTER TABLE public.givers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their household givers"
  ON public.givers FOR SELECT
  TO authenticated
  USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert givers in their household"
  ON public.givers FOR INSERT
  TO authenticated
  WITH CHECK (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their household givers"
  ON public.givers FOR UPDATE
  TO authenticated
  USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their household givers"
  ON public.givers FOR DELETE
  TO authenticated
  USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

-- Indexes for givers
CREATE INDEX idx_givers_household_id ON public.givers(household_id);
CREATE INDEX idx_givers_display_order ON public.givers(household_id, display_order);

-- Phase 1: Create gift_givers junction table
CREATE TABLE public.gift_givers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL REFERENCES public.givers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(gift_id, giver_id)
);

-- RLS Policies for gift_givers
ALTER TABLE public.gift_givers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their household gift givers"
  ON public.gift_givers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gifts 
      WHERE gifts.id = gift_givers.gift_id 
      AND gifts.household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert gift givers in their household"
  ON public.gift_givers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gifts 
      WHERE gifts.id = gift_givers.gift_id 
      AND gifts.household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete their household gift givers"
  ON public.gift_givers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gifts 
      WHERE gifts.id = gift_givers.gift_id 
      AND gifts.household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Indexes for gift_givers
CREATE INDEX idx_gift_givers_gift_id ON public.gift_givers(gift_id);
CREATE INDEX idx_gift_givers_giver_id ON public.gift_givers(giver_id);

-- Phase 1: Add is_placeholder column to gifts
ALTER TABLE public.gifts ADD COLUMN is_placeholder BOOLEAN DEFAULT false NOT NULL;

-- Index for filtering placeholders
CREATE INDEX idx_gifts_is_placeholder ON public.gifts(household_id, is_placeholder) 
  WHERE is_placeholder = true;

-- Phase 1: Create gift_templates table
CREATE TABLE public.gift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_cost NUMERIC(10, 2),
  default_giver_ids UUID[] DEFAULT '{}',
  tag_color TEXT DEFAULT '#3b82f6',
  tag_icon TEXT DEFAULT '🏷️',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(household_id, name)
);

-- RLS Policies for gift_templates
ALTER TABLE public.gift_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their household templates"
  ON public.gift_templates FOR SELECT
  TO authenticated
  USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert templates in their household"
  ON public.gift_templates FOR INSERT
  TO authenticated
  WITH CHECK (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their household templates"
  ON public.gift_templates FOR UPDATE
  TO authenticated
  USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their household templates"
  ON public.gift_templates FOR DELETE
  TO authenticated
  USING (household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid()));

-- Index for templates
CREATE INDEX idx_gift_templates_household_id ON public.gift_templates(household_id);

-- Phase 1: Add template_id column to gifts
ALTER TABLE public.gifts ADD COLUMN template_id UUID REFERENCES public.gift_templates(id) ON DELETE SET NULL;

-- Index for filtering by template
CREATE INDEX idx_gifts_template_id ON public.gifts(template_id) WHERE template_id IS NOT NULL;

-- Create default givers for existing households
INSERT INTO public.givers (household_id, name, icon, display_order)
SELECT 
  h.id,
  giver.name,
  giver.icon,
  giver.display_order
FROM public.households h
CROSS JOIN (
  VALUES 
    ('Mom', '👩', 0),
    ('Dad', '👨', 1),
    ('Santa', '🎅', 2),
    ('Me', '🙋', 3)
) AS giver(name, icon, display_order)
ON CONFLICT (household_id, name) DO NOTHING;