-- From supabase/supabase docker/volumes/db/roles.sql (runs once, when the database is first created).
-- The supabase_functions_admin line is dropped: that role comes from the webhooks
-- script, which Elfie doesn't use, and a missing role aborts the database setup.
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
