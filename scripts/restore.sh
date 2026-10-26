#!/usr/bin/env bash
# Restores a dump made by backup.sh.   ./scripts/restore.sh backups/typequest-2026-10-26-0315.sql.gz
# This REPLACES the current data. Stop the api first:  docker compose stop api

set -euo pipefail
cd "$(dirname "$0")/.."

[ $# -eq 1 ] && [ -f "$1" ] || { echo "Usage: $0 <backup.sql.gz>" >&2; exit 1; }

read -r -p "This overwrites the database with $1. Type YES to continue: " answer
[ "$answer" = "YES" ] || { echo "Cancelled."; exit 1; }

gunzip -c "$1" | docker compose exec -T db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" typequest_db'
echo "Restored. Start the api again:  docker compose start api"
