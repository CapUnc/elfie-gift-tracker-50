-- Create recipient_notes table
CREATE TABLE public.recipient_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.recipients(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  content text NOT NULL,
  link_url text,
  link_label text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_recipient_notes_recipient_id ON public.recipient_notes(recipient_id);
CREATE INDEX idx_recipient_notes_household_id ON public.recipient_notes(household_id);

-- Enable Row Level Security
ALTER TABLE public.recipient_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their household recipient notes
CREATE POLICY "Users can view their household recipient notes"
  ON public.recipient_notes FOR SELECT
  USING (household_id = get_user_household_id(auth.uid()));

-- RLS Policy: Users can insert notes in their household
CREATE POLICY "Users can insert notes in their household"
  ON public.recipient_notes FOR INSERT
  WITH CHECK (household_id = get_user_household_id(auth.uid()));

-- RLS Policy: Users can update their household recipient notes
CREATE POLICY "Users can update their household recipient notes"
  ON public.recipient_notes FOR UPDATE
  USING (household_id = get_user_household_id(auth.uid()));

-- RLS Policy: Users can delete their household recipient notes
CREATE POLICY "Users can delete their household recipient notes"
  ON public.recipient_notes FOR DELETE
  USING (household_id = get_user_household_id(auth.uid()));

-- Trigger for updated_at timestamp
CREATE TRIGGER update_recipient_notes_updated_at
  BEFORE UPDATE ON public.recipient_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing notes from recipients.notes to recipient_notes table
INSERT INTO public.recipient_notes (recipient_id, household_id, content, display_order)
SELECT 
  id,
  household_id,
  notes,
  0
FROM public.recipients
WHERE notes IS NOT NULL AND notes != '';