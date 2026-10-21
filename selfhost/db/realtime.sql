-- From supabase/supabase docker/volumes/db/realtime.sql (runs once, when the database is first created).
\set pguser `echo "$POSTGRES_USER"`

create schema if not exists _realtime;
alter schema _realtime owner to :pguser;
