#!/usr/bin/env bash
# Saves a copy of the whole database into backups/ and keeps the newest 30.
# To bring one back on a fresh install: ./restore.sh backups/<file>
set -euo pipefail
cd "$(dirname "$0")"

mkdir -p backups
name="elfie-$(date +%Y-%m-%d-%H%M).backup"
docker compose run --rm -T pgtools pg_dump -Fc -f "/backups/$name"
echo "Saved backups/$name"

ls -1t backups/elfie-*.backup | tail -n +31 | while read -r old; do rm -f "$old"; done
