#!/usr/bin/env bash
# Runs inside the pgtools container; started by ../restore.sh.
#
# Restores from a pg_dump custom-format file (a Lovable Cloud export or one of
# our own backups):
#   1. user accounts: auth.users and auth.identities are loaded into a staging
#      schema, then merged into this server's auth tables using only the columns
#      both sides have, so Supabase version differences don't matter;
#   2. everything in the public schema (tables, data, functions, policies,
#      triggers, realtime publication membership), plus triggers on auth tables;
#   3. after-restore.sql: realtime check, API schema reload, summary.
set -euo pipefail

F="$1"
LOG=/tmp/restore-errors.log
export PGOPTIONS='-c client_min_messages=warning'
: > "$LOG"

step() { printf '\n==> %s\n' "$*"; }

step "Reading $(basename "$F")"
pg_restore --list "$F" > /tmp/toc.txt

if [ "$(psql -tAc "select to_regclass('public.households') is not null")" = "t" ]; then
  echo "This Elfie database already has data in it, so nothing was changed."
  echo "To start over (this deletes everything in it): docker compose down -v"
  exit 2
fi

if ! grep -qE ' TABLE DATA auth users ' /tmp/toc.txt; then
  echo "This file has no user accounts in it."
  echo "Use the full database export from Lovable (Cloud > Overview > Advanced settings > Export data)."
  exit 3
fi

step "Copying user accounts"
dropdb --if-exists lovable_import
createdb lovable_import
psql -q -d lovable_import -c 'create schema auth'
pg_restore -d lovable_import -n auth -t users -t identities --no-owner --no-privileges "$F" 2>>"$LOG" || true
psql -q -d lovable_import -c 'alter schema auth rename to lovable_auth'
pg_dump -d lovable_import -n lovable_auth --no-owner --no-privileges \
  | psql -q -v ON_ERROR_STOP=1 -d postgres > /dev/null
dropdb lovable_import
psql -q -v ON_ERROR_STOP=1 -f /scripts/merge-users.sql

step "Restoring tables, data, functions and security rules"
# -L restores in the order of the list, so keep the archive's own order: the
# public schema first, then triggers on auth tables (they call public functions).
grep -E '^[0-9]+; [0-9]+ [0-9]+ [A-Z][A-Z ]* public ' /tmp/toc.txt > /tmp/restore.list || true
grep -E '^[0-9]+; [0-9]+ [0-9]+ TRIGGER auth ' /tmp/toc.txt >> /tmp/restore.list || true
pg_restore -d postgres -L /tmp/restore.list "$F" 2>>"$LOG" || true

step "Finishing up"
psql -q -v ON_ERROR_STOP=1 -f /scripts/after-restore.sql

if grep -q 'error:' "$LOG"; then
  echo
  echo "Some steps reported problems. Usually harmless, but if the app misbehaves,"
  echo "these lines say what went wrong:"
  grep -A2 'error:' "$LOG" | grep -v '^--$' | head -40
fi
