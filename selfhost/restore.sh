#!/usr/bin/env bash
# Loads a Lovable Cloud database export, or a backup made by ./backup.sh, into a
# fresh Elfie install: user accounts (with their passwords), every table and its
# data, and the database functions and security rules the app relies on.
#
# Usage: ./restore.sh ~/Downloads/<export file>
set -euo pipefail
cd "$(dirname "$0")"

file="${1:-}"
if [ -z "$file" ] || [ ! -f "$file" ]; then
  echo "Usage: ./restore.sh <export-or-backup-file>"
  exit 1
fi
[ -f .env ] || { echo "Run ./setup.sh first."; exit 1; }

abs="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"

echo "Starting the database and sign-in service..."
docker compose up -d --wait db auth

docker compose run --rm -T -v "$abs:/import/restore.backup:ro" pgtools \
  bash /scripts/load-backup.sh /import/restore.backup

echo
echo "Starting everything (this can take a minute)..."
docker compose up -d --wait
echo
echo "Done. Open http://localhost:${APP_PORT:-8085} and sign in with your usual email and password."
