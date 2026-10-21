#!/usr/bin/env bash
# First-time setup: writes .env with fresh secrets for this computer.
# Safe to re-run; it never overwrites an existing .env.
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .env ]; then
  echo ".env already exists, keeping it (your database is locked with those secrets)."
  exit 0
fi

command -v openssl >/dev/null || { echo "openssl is required"; exit 1; }

b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

# HS256 JWT for a Postgres role, signed with JWT_SECRET, valid for 10 years.
make_jwt() {
  local now exp header payload sig
  now=$(date +%s)
  exp=$((now + 10 * 365 * 24 * 3600))
  header=$(printf '{"alg":"HS256","typ":"JWT"}' | b64url)
  payload=$(printf '{"role":"%s","iss":"supabase","iat":%s,"exp":%s}' "$1" "$now" "$exp" | b64url)
  sig=$(printf '%s.%s' "$header" "$payload" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | b64url)
  printf '%s.%s.%s' "$header" "$payload" "$sig"
}

POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 32)
ANON_KEY=$(make_jwt anon)
SECRET_KEY_BASE=$(openssl rand -hex 32)
REALTIME_DB_ENC_KEY=$(openssl rand -hex 8)

umask 077
cat > .env <<EOF
# Created by ./setup.sh. Keep this file private and don't delete it:
# the database only works with these exact secrets.
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SECRET_KEY_BASE=$SECRET_KEY_BASE
REALTIME_DB_ENC_KEY=$REALTIME_DB_ENC_KEY

# Port Elfie is served on, on this computer.
APP_PORT=8085

# Set to true once everyone has an account, to stop anyone else signing up.
# Apply with: docker compose up -d
DISABLE_SIGNUP=false

# Your public address, e.g. https://your-mac.tail1234.ts.net
# Only needed if you turn on Google sign-in.
SITE_URL=http://localhost:8085

# Optional Google sign-in (see SELF-HOSTING.md).
GOOGLE_ENABLED=false
GOOGLE_CLIENT_ID=
GOOGLE_SECRET=
EOF

mkdir -p backups
echo "Created .env with new secrets."
echo "Next: docker compose up -d --build"
