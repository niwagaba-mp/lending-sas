#!/bin/bash
# backup.sh - Automated PostgreSQL Dump & AWS S3 Upload for SMOS
# Set via crontab: 0 2 * * * /path/to/smos/scripts/backup.sh

set -e

# Load environment variables
source ../.env

# Configuration
BACKUP_DIR="/tmp/smos_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="smos_db_backup_$TIMESTAMP.sql.gz"
ENCRYPTED_FILENAME="$FILENAME.gpg"
S3_BUCKET="s3://smos-database-backups-production"

echo "==========================================="
echo "SMOS Automated Backup Pipeline started at $(date)"
echo "==========================================="

mkdir -p $BACKUP_DIR

echo "1. Creating pg_dump snapshot from Docker container..."
docker exec smos_db_prod pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/$FILENAME

echo "2. Encrypting backup with GPG symmetric cipher..."
# DB_BACKUP_PASSPHRASE must be set in .env
gpg --batch --yes --passphrase "$DB_BACKUP_PASSPHRASE" --symmetric --cipher-algo AES256 -o $BACKUP_DIR/$ENCRYPTED_FILENAME $BACKUP_DIR/$FILENAME

echo "3. Uploading to secure AWS S3 bucket..."
aws s3 cp $BACKUP_DIR/$ENCRYPTED_FILENAME $S3_BUCKET/$ENCRYPTED_FILENAME --storage-class STANDARD_IA

echo "4. Cleaning up local temporary files..."
rm $BACKUP_DIR/$FILENAME
rm $BACKUP_DIR/$ENCRYPTED_FILENAME

echo "✅ Backup Pipeline Complete at $(date)"
echo "File securely stored: $S3_BUCKET/$ENCRYPTED_FILENAME"
