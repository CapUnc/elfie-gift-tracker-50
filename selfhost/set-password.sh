#!/usr/bin/env bash
# Sets someone's password: for anyone who used to sign in with Google, or who
# forgot theirs (there's no mail server, so "reset by email" isn't available).
#
# Usage: ./set-password.sh person@example.com 'their new password'
set -euo pipefail
cd "$(dirname "$0")"

email="${1:-}"
password="${2:-}"
if [ -z "$email" ] || [ -z "$password" ]; then
  echo "Usage: ./set-password.sh <email> '<new password>'"
  exit 1
fi
if [ "${#password}" -lt 6 ]; then
  echo "Passwords need at least 6 characters."
  exit 1
fi

docker compose run --rm -T pgtools psql -q -tA -v ON_ERROR_STOP=1 \
  -v email="$email" -v password="$password" <<'SQL'
with updated as (
  update auth.users
     set encrypted_password = extensions.crypt(:'password', extensions.gen_salt('bf')),
         updated_at = now()
   where lower(email) = lower(:'email')
  returning email
)
select case when count(*) = 0 then 'No account found for ' || :'email'
            else 'Password updated for ' || min(email) end
  from updated;
SQL
