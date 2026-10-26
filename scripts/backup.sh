#!/usr/bin/env bash
# Dumps the database to backups/typequest-YYYY-MM-DD-HHMM.sql.gz and deletes
# dumps older than 30 days (the privacy policy promises backups are overwritten
# within 30 days).
#
#   ./scripts/backup.sh
#
# Run it every night from cron (crontab -e):
#   15 3 * * * cd /opt/typequest && ./scripts/backup.sh >> backups/backup.log 2>&1
#
# Copy the backups folder OFF this machine too (another server, object storage),
# or a dead disk takes the backups with it.

set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p backups
file="backups/typequest-$(date +%F-%H%M).sql.gz"

docker compose exec -T db sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines typequest_db' \
  | gzip > "$file"

# An empty dump means something went wrong.
if [ "$(stat -c%s "$file")" -lt 1000 ]; then
  echo "Backup looks too small, keeping it for inspection: $file" >&2
  exit 1
fi

find backups -name 'typequest-*.sql.gz' -mtime +30 -delete
echo "Backup written: $file"
