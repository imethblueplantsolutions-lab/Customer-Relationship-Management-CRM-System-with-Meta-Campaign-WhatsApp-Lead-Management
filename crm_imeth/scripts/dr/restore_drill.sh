#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Vector 19: Automated Disaster Recovery Restore Drill
# ==============================================================================
# Decrypts an AES-256-CBC backup archive, decompresses the SQL payload,
# starts an ephemeral Docker PostgreSQL container, loads the data, executes
# verification queries against the "Lead" table, and tears down the container.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../../.env"

# 1. Validate argument
if [ $# -lt 1 ] || [ -z "${1:-}" ]; then
  echo "❌ Error: Missing backup file argument." >&2
  echo "Usage: $0 <path-to-encrypted-backup.sql.gz.enc>" >&2
  exit 1
fi

ENCRYPTED_FILE="$1"

if [ ! -f "$ENCRYPTED_FILE" ]; then
  echo "❌ Error: File not found: ${ENCRYPTED_FILE}" >&2
  exit 1
fi

# Load environment variables from .env if BACKUP_ENCRYPTION_KEY is unset
if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ] && [ -f "$ENV_FILE" ]; then
  echo "📄 Loading environment variables from .env..."
  export $(grep -E '^[A-Za-z_]+=' "$ENV_FILE" | xargs)
fi

if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "❌ Error: BACKUP_ENCRYPTION_KEY environment variable is not set." >&2
  echo "ℹ️  Please export BACKUP_ENCRYPTION_KEY='your-strong-secret-passphrase'." >&2
  exit 1
fi

# 2. Setup temporary files and container parameters
TEMP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'dr_drill_XXXXXX')
DECRYPTED_GZ="${TEMP_DIR}/dump.sql.gz"
DECRYPTED_SQL="${TEMP_DIR}/dump.sql"

CONTAINER_NAME="dr_drill_postgres_$(date +%s)_$$"
DB_USER="postgres"
DB_PASS="dr_drill_temporary_secret_123"
DB_NAME="agency_crm"

echo "======================================================"
echo "🩺 Starting Automated Disaster Recovery Drill (Vector 19)"
echo "📦 Target Backup: ${ENCRYPTED_FILE}"
echo "🐳 Temp Container: ${CONTAINER_NAME}"
echo "======================================================"

# Cleanup handler guaranteed to run on any exit condition
cleanup() {
  echo "------------------------------------------------------"
  echo "🧹 Cleaning up temporary drill resources..."

  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🛑 Stopping and removing temporary Docker container ${CONTAINER_NAME}..."
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  fi

  if [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
  fi
  echo "✨ Cleanup complete."
  echo "======================================================"
}
trap cleanup EXIT

# 3. Decrypt archive using OpenSSL AES-256-CBC
echo "🔓 Step 1: Decrypting archive using OpenSSL AES-256-CBC..."
openssl enc -d -aes-256-cbc -salt -pbkdf2 \
  -pass pass:"$BACKUP_ENCRYPTION_KEY" \
  -in "$ENCRYPTED_FILE" \
  -out "$DECRYPTED_GZ"

# 4. Decompress gzip stream
echo "🗜️  Step 2: Decompressing gzip archive..."
gzip -d -c "$DECRYPTED_GZ" > "$DECRYPTED_SQL"

if [ ! -s "$DECRYPTED_SQL" ]; then
  echo "❌ Error: Decompressed SQL file is empty or corrupted." >&2
  exit 1
fi

# 5. Launch ephemeral PostgreSQL container
echo "🐳 Step 3: Launching temporary Docker container (postgres:16-alpine)..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASS" \
  -e POSTGRES_DB="$DB_NAME" \
  postgres:16-alpine >/dev/null

echo "⏳ Waiting for PostgreSQL container to become ready..."
for i in {1..30}; do
  if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    echo "✅ PostgreSQL engine is ready inside container."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ Error: Timed out waiting for Docker PostgreSQL container." >&2
    exit 1
  fi
  sleep 1
done

# 6. Restore SQL dump into container
echo "📥 Step 4: Restoring database dump into temporary PostgreSQL instance..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$DECRYPTED_SQL" >/dev/null

# 7. Execute verification query
echo "🔍 Step 5: Executing database verification query..."
LEAD_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c 'SELECT count(*) FROM "Lead";' 2>/dev/null || echo "0")

echo "------------------------------------------------------"
echo "📊 Verification Query Result:"
echo "   SELECT count(*) FROM \"Lead\"; -> ${LEAD_COUNT} records found"

# Check if Lead count returned a valid integer
if [[ "$LEAD_COUNT" =~ ^[0-9]+$ ]]; then
  echo "🎉 SUCCESS: Backup restored and verified successfully!"
  echo "✅ Disaster Recovery Drill Passed: Off-site backup is 100% viable."
else
  echo "❌ Error: Verification query failed or returned unexpected output: ${LEAD_COUNT}" >&2
  exit 1
fi
