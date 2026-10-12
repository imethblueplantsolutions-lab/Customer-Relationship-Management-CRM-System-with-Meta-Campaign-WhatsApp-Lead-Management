#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Vector 18: Automated Off-Site Disaster Recovery Backup
# ==============================================================================
# Extracts Railway PostgreSQL database via pg_dump, compresses with gzip,
# and encrypts the payload using OpenSSL AES-256-CBC with PBKDF2 key derivation.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../../.env"

# Load environment variables from .env if present and not already set
if [ -f "$ENV_FILE" ]; then
  if [ -z "${DATABASE_URL:-}" ] || [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    echo "📄 Loading environment variables from .env..."
    # Export only valid key=value lines, ignoring comments and blanks
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^\s*$' | xargs -0 2>/dev/null || grep -E '^[A-Za-z_]+=' "$ENV_FILE" | xargs)
  fi
fi

# 1. Validate required environment variables
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set." >&2
  exit 1
fi

if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "❌ Error: BACKUP_ENCRYPTION_KEY environment variable is not set." >&2
  echo "ℹ️  Please set BACKUP_ENCRYPTION_KEY='your-strong-secret-passphrase'." >&2
  exit 1
fi

# 2. Setup backup destination directory and filename
BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/../../backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="crm_backup_${TIMESTAMP}.sql.gz.enc"
OUTPUT_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

echo "======================================================"
echo "🚀 Starting Automated Railway PostgreSQL Backup"
echo "🕒 Timestamp : $(date -u +"%Y-%m-%d %H:%M:%SZ")"
echo "📁 Destination: ${OUTPUT_PATH}"
echo "======================================================"

# 3. Stream pg_dump -> gzip -> openssl AES-256-CBC directly into encrypted file
echo "📦 Step 1: Extracting database schema and data with pg_dump..."
echo "🗜️  Step 2: Compressing SQL dump stream via gzip..."
echo "🔐 Step 3: Encrypting archive with OpenSSL AES-256-CBC (PBKDF2)..."

pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip -9 \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:"$BACKUP_ENCRYPTION_KEY" -out "$OUTPUT_PATH"

# 4. Verify output file exists and is not empty
if [ ! -s "$OUTPUT_PATH" ]; then
  echo "❌ Error: Backup failed. Output file is missing or empty." >&2
  rm -f "$OUTPUT_PATH"
  exit 1
fi

FILE_SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)
echo "------------------------------------------------------"
echo "✅ Backup successfully created and encrypted!"
echo "📦 File: ${OUTPUT_PATH}"
echo "📊 Size: ${FILE_SIZE}"
echo "🔒 Algorithm: AES-256-CBC (PBKDF2)"
echo "======================================================"
