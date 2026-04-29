# Backup & Restore Runbook

## Scope
This runbook covers backup and recovery for the SQLite database used by EAJE WhatsBot.

## Backup Strategy
- **Frequency:** Daily at 02:00 UTC.
- **Retention:** 14 daily backups and 4 weekly backups.
- **Storage:** Local encrypted volume + offsite object storage.

## Create Backup (manual)
```bash
mkdir -p backups
cp db/custom.db "backups/custom-$(date +%F-%H%M%S).db"
sha256sum "backups/custom-$(date +%F-%H%M%S).db"
```

## Verify Backup
```bash
sqlite3 backups/<backup-file>.db "PRAGMA integrity_check;"
```
Expected output: `ok`.

## Restore Procedure
1. Put application in maintenance mode.
2. Stop all app processes writing to DB.
3. Replace active DB file:
```bash
cp backups/<backup-file>.db db/custom.db
```
4. Validate schema and row counts:
```bash
sqlite3 db/custom.db ".tables"
sqlite3 db/custom.db "SELECT COUNT(*) FROM Contact;"
```
5. Start application and run smoke checks.

## Post-Restore Smoke Checks
- `/api/health` returns `ok`.
- `/api/contacts` and `/api/campaigns` return non-500 responses.
- Login flow works with owner account.

## Failure Handling
- If integrity check fails, pick a previous backup and repeat restore.
- If app boot fails after restore, rollback to snapshot taken immediately before restore.
