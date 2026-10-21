-- From supabase/supabase docker/volumes/db/jwt.sql (runs once, when the database is first created).
\set jwt_exp `echo "$JWT_EXP"`

ALTER DATABASE postgres SET "app.settings.jwt_exp" TO :'jwt_exp';
