-- Run by load-backup.sh after the data is in.

-- Live updates: the app listens for changes on these tables.
do $$
declare
  t text;
begin
  foreach t in array array['recipients', 'gifts', 'gift_givers', 'givers'] loop
    if to_regclass('public.' || t) is not null and not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Let the REST API pick up the new tables straight away.
notify pgrst, 'reload schema';

\echo
\echo 'What was restored:'
select 'user accounts' as "table", count(*) as "rows" from auth.users
union all
select table_name::text,
       (xpath('/row/c/text()',
              query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text::bigint
  from information_schema.tables
 where table_schema = 'public' and table_type = 'BASE TABLE';

\echo 'These accounts only ever used "Continue with Google", so they have no password yet.'
\echo 'Give each one with: ./set-password.sh <email> ''<new password>'''
select email as "needs a password" from auth.users
 where coalesce(encrypted_password, '') = '' order by email;
