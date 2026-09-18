#!/bin/bash

set -euo pipefail

# ============================================================
# PulseDesk EC2 User Data
# ============================================================
# Purpose:
#   Configure a systemd service that updates the PulseDesk
#   backend-dev secret with the EC2 instance's current
#   public IPv4 address on every boot.
#
# Updated Secrets:
#   - PULSEDESK_DB_URL
#   - PULSEDESK_KAFKA_BOOTSTRAP_SERVERS
#
# NOT modified:
#   - PULSEDESK_DB_USERNAME
#   - PULSEDESK_DB_PASSWORD
# ============================================================

REGION="us-east-2"
SECRET_NAME="backend-dev"

SCRIPT_DIR="/opt/pulsedesk"
UPDATE_SCRIPT="${SCRIPT_DIR}/update-secret.sh"
SERVICE_FILE="/etc/systemd/system/pulsedesk-secret-update.service"

echo "============================================================"
echo "PulseDesk EC2 User Data - Starting"
echo "============================================================"

# ------------------------------------------------------------
# 1. Install required packages
# ------------------------------------------------------------

echo "[1/5] Installing required packages..."

if command -v dnf >/dev/null 2>&1; then
    dnf install -y jq
elif command -v yum >/dev/null 2>&1; then
    yum install -y jq
else
    echo "ERROR: Neither dnf nor yum is available."
    exit 1
fi

# ------------------------------------------------------------
# 2. Create PulseDesk directory
# ------------------------------------------------------------

echo "[2/5] Creating PulseDesk directory..."

mkdir -p "${SCRIPT_DIR}"

# ------------------------------------------------------------
# 3. Create secret update script
# ------------------------------------------------------------

echo "[3/5] Creating secret update script..."

cat > "${UPDATE_SCRIPT}" <<'SCRIPT_EOF'
#!/bin/bash

set -euo pipefail

# ============================================================
# PulseDesk Secrets Manager IP Updater
# ============================================================

REGION="us-east-2"
SECRET_NAME="backend-dev"

echo "============================================================"
echo "PulseDesk Secret Update"
echo "============================================================"

# ------------------------------------------------------------
# Get IMDSv2 token
# ------------------------------------------------------------

TOKEN=$(curl -sS -X PUT \
    "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

if [ -z "${TOKEN}" ]; then
    echo "ERROR: Failed to retrieve IMDSv2 token."
    exit 1
fi

# ------------------------------------------------------------
# Get current EC2 Public IPv4
# ------------------------------------------------------------

PUBLIC_IP=$(curl -sS \
    -H "X-aws-ec2-metadata-token: ${TOKEN}" \
    "http://169.254.169.254/latest/meta-data/public-ipv4")

if [ -z "${PUBLIC_IP}" ]; then
    echo "ERROR: Could not retrieve EC2 Public IPv4."
    exit 1
fi

echo "Current EC2 Public IPv4: ${PUBLIC_IP}"

# ------------------------------------------------------------
# Get existing secret
# ------------------------------------------------------------

SECRET=$(aws secretsmanager get-secret-value \
    --secret-id "${SECRET_NAME}" \
    --region "${REGION}" \
    --query 'SecretString' \
    --output text)

if [ -z "${SECRET}" ] || [ "${SECRET}" = "None" ]; then
    echo "ERROR: Could not retrieve secret: ${SECRET_NAME}"
    exit 1
fi

# ------------------------------------------------------------
# Validate that the secret is valid JSON
# ------------------------------------------------------------

if ! echo "${SECRET}" | jq empty >/dev/null 2>&1; then
    echo "ERROR: Secret ${SECRET_NAME} is not valid JSON."
    exit 1
fi

# ------------------------------------------------------------
# Update ONLY the IP-dependent values
# ------------------------------------------------------------

UPDATED_SECRET=$(echo "${SECRET}" | jq \
    --arg db_url "jdbc:mysql://${PUBLIC_IP}:3306/pulsedesk" \
    --arg kafka "${PUBLIC_IP}:9092,${PUBLIC_IP}:9094,${PUBLIC_IP}:9096" \
    '
    .PULSEDESK_DB_URL = $db_url |
    .PULSEDESK_KAFKA_BOOTSTRAP_SERVERS = $kafka
    ')

# ------------------------------------------------------------
# Update Secrets Manager
# ------------------------------------------------------------

aws secretsmanager update-secret \
    --secret-id "${SECRET_NAME}" \
    --secret-string "${UPDATED_SECRET}" \
    --region "${REGION}" \
    >/dev/null

echo "Secrets Manager updated successfully."
echo "Secret: ${SECRET_NAME}"
echo "PULSEDESK_DB_URL updated."
echo "PULSEDESK_KAFKA_BOOTSTRAP_SERVERS updated."

echo "============================================================"
echo "PulseDesk Secret Update - Completed"
echo "============================================================"
SCRIPT_EOF

chmod 700 "${UPDATE_SCRIPT}"

# ------------------------------------------------------------
# 4. Create systemd service
# ------------------------------------------------------------

echo "[4/5] Creating systemd service..."

cat > "${SERVICE_FILE}" <<SERVICE_EOF
[Unit]
Description=Update PulseDesk backend-dev Secrets Manager with EC2 Public IP
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=${UPDATE_SCRIPT}
User=root

[Install]
WantedBy=multi-user.target
SERVICE_EOF

chmod 644 "${SERVICE_FILE}"

# ------------------------------------------------------------
# 5. Enable systemd service
# ------------------------------------------------------------

echo "[5/5] Enabling systemd service..."

systemctl daemon-reload

systemctl enable pulsedesk-secret-update.service

echo "============================================================"
echo "PulseDesk EC2 User Data - Completed"
echo "============================================================"

echo "Systemd service:"
echo "  pulsedesk-secret-update.service"

echo "Update script:"
echo "  ${UPDATE_SCRIPT}"

echo "Secret:"
echo "  ${SECRET_NAME}"

echo "Region:"
echo "  ${REGION}"

echo "The service will execute automatically on every EC2 boot."
echo "============================================================"