-- Drop the obsolete buyers table now that we've migrated to givers
DROP TABLE IF EXISTS public.buyers CASCADE;