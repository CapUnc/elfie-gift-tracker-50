
CREATE INDEX IF NOT EXISTS idx_gifts_household_recipient ON public.gifts (household_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_recipients_household ON public.recipients (household_id);
CREATE INDEX IF NOT EXISTS idx_profiles_household ON public.profiles (household_id);
CREATE INDEX IF NOT EXISTS idx_gift_givers_gift ON public.gift_givers (gift_id);
CREATE INDEX IF NOT EXISTS idx_gift_givers_giver ON public.gift_givers (giver_id);
CREATE INDEX IF NOT EXISTS idx_givers_household ON public.givers (household_id);
CREATE INDEX IF NOT EXISTS idx_recipient_notes_household ON public.recipient_notes (household_id);
CREATE INDEX IF NOT EXISTS idx_recipient_notes_recipient ON public.recipient_notes (recipient_id);
