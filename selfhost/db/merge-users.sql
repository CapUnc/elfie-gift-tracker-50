-- Copies user accounts from the staging schema lovable_auth (see load-backup.sh)
-- into auth.users and auth.identities, using only the columns both sides have.
-- Password hashes come along, so everyone keeps their password.
do $$
declare
  t text;
  cols text;
  n bigint;
begin
  foreach t in array array['users', 'identities'] loop
    if to_regclass('lovable_auth.' || t) is null then
      raise exception 'Could not read auth.% from the file', t;
    end if;

    select string_agg(quote_ident(c.column_name), ', ' order by c.ordinal_position)
      into cols
      from information_schema.columns c
      join information_schema.columns s
        on s.table_schema = 'lovable_auth'
       and s.table_name = t
       and s.column_name = c.column_name
     where c.table_schema = 'auth'
       and c.table_name = t
       and c.is_generated = 'NEVER'
       and c.is_identity = 'NO';

    execute format(
      'insert into auth.%I (%s) select %s from lovable_auth.%I on conflict do nothing',
      t, cols, cols, t
    );
    get diagnostics n = row_count;
    raise notice 'auth.%: % copied', t, n;
  end loop;

  -- The auth server reads these as plain strings and fails sign-in on NULLs,
  -- which accounts created outside it (or by a newer version) can contain.
  foreach t in array array['confirmation_token', 'recovery_token', 'email_change_token_new',
                           'email_change_token_current', 'email_change', 'phone_change',
                           'phone_change_token', 'reauthentication_token'] loop
    if exists (select 1 from information_schema.columns
                where table_schema = 'auth' and table_name = 'users' and column_name = t) then
      execute format('update auth.users set %I = %L where %I is null', t, '', t);
    end if;
  end loop;
end $$;

drop schema lovable_auth cascade;
