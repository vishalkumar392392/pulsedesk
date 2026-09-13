#!/bin/bash
set -euo pipefail

# ============================================================
# Kafka 4.3.1 - 3 node KRaft cluster on ONE EC2 instance
# Amazon Linux 2023
#
# Node 1: Broker 9092 / Controller 9093
# Node 2: Broker 9094 / Controller 9095
# Node 3: Broker 9096 / Controller 9097
#
# Kafka data survives EC2 reboot/stop-start because data is
# stored under /home/ec2-user/kafka-data on the root EBS volume.
# ============================================================

KAFKA_VERSION="4.3.1"
SCALA_VERSION="2.13"

KAFKA_HOME="/home/ec2-user/kafka"
KAFKA_DATA="/home/ec2-user/kafka-data"
KAFKA_CONFIG="${KAFKA_HOME}/config/kraft"

KAFKA_URL="https://downloads.apache.org/kafka/${KAFKA_VERSION}/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz"

INSTALL_LOG="/var/log/kafka-user-data.log"

exec > >(tee -a "$INSTALL_LOG") 2>&1

echo "======================================================"
echo "Kafka EC2 installation started: $(date)"
echo "======================================================"

# ============================================================
# 1. INSTALL JAVA
#
# IMPORTANT:
# Amazon Linux 2023 already contains curl-minimal.
# DO NOT install the full 'curl' package.
# ============================================================

dnf install -y \
    java-17-amazon-corretto-headless \
    tar \
    gzip

echo "Java:"
java -version

echo "Curl:"
curl --version | head -1


# ============================================================
# 2. INSTALL KAFKA
# ============================================================

if [[ ! -x "${KAFKA_HOME}/bin/kafka-server-start.sh" ]]; then

    echo "Downloading Kafka ${KAFKA_VERSION}..."

    rm -f /tmp/kafka.tgz

    curl \
        -fL \
        --retry 5 \
        --retry-delay 3 \
        "${KAFKA_URL}" \
        -o /tmp/kafka.tgz

    cd /home/ec2-user

    rm -rf "kafka_${SCALA_VERSION}-${KAFKA_VERSION}"
    rm -rf "${KAFKA_HOME}"

    tar -xzf /tmp/kafka.tgz

    mv \
        "kafka_${SCALA_VERSION}-${KAFKA_VERSION}" \
        "${KAFKA_HOME}"

    rm -f /tmp/kafka.tgz

else

    echo "Kafka already installed."

fi


# ============================================================
# 3. CREATE PERMANENT STORAGE
# ============================================================

mkdir -p \
    "${KAFKA_DATA}/server-1" \
    "${KAFKA_DATA}/server-2" \
    "${KAFKA_DATA}/server-3" \
    "${KAFKA_CONFIG}"

chown -R ec2-user:ec2-user \
    "${KAFKA_HOME}" \
    "${KAFKA_DATA}"


# ============================================================
# 4. GET EC2 PUBLIC IPv4 USING IMDSv2
# ============================================================

get_public_ip() {

    local token
    local public_ip=""

    token=$(curl \
        -fsS \
        --retry 10 \
        --retry-delay 2 \
        -X PUT \
        -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" \
        http://169.254.169.254/latest/api/token)

    for _ in {1..30}; do

        public_ip=$(curl \
            -fsS \
            -H "X-aws-ec2-metadata-token: ${token}" \
            http://169.254.169.254/latest/meta-data/public-ipv4 \
            2>/dev/null || true)

        if [[ -n "${public_ip}" ]]; then
            echo "${public_ip}"
            return 0
        fi

        sleep 2
    done

    return 1
}


PUBLIC_IP=$(get_public_ip) || {
    echo "ERROR: EC2 Public IPv4 could not be retrieved."
    exit 1
}

echo "EC2 Public IPv4: ${PUBLIC_IP}"


# ============================================================
# 5. CREATE KAFKA CONFIGURATION
# ============================================================

for SPEC in \
    "1:9092:9093" \
    "2:9094:9095" \
    "3:9096:9097"
do

    IFS=: read -r NODE BROKER_PORT CONTROLLER_PORT <<< "${SPEC}"

    cat > "${KAFKA_CONFIG}/server-${NODE}.properties" <<EOF
process.roles=broker,controller
node.id=${NODE}

controller.quorum.voters=1@localhost:9093,2@localhost:9095,3@localhost:9097

listeners=PLAINTEXT://0.0.0.0:${BROKER_PORT},CONTROLLER://0.0.0.0:${CONTROLLER_PORT}
advertised.listeners=PLAINTEXT://${PUBLIC_IP}:${BROKER_PORT}

listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
controller.listener.names=CONTROLLER
inter.broker.listener.name=PLAINTEXT

log.dirs=${KAFKA_DATA}/server-${NODE}

num.network.threads=3
num.io.threads=8

socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600

num.partitions=3
num.recovery.threads.per.data.dir=1

offsets.topic.replication.factor=3

transaction.state.log.replication.factor=3
transaction.state.log.min.isr=2

log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000
EOF

done

chown -R ec2-user:ec2-user "${KAFKA_CONFIG}"


# ============================================================
# 6. CREATE ONE KRAFT CLUSTER ID
# ============================================================

CLUSTER_ID_FILE="${KAFKA_DATA}/cluster.id"

if [[ ! -s "${CLUSTER_ID_FILE}" ]]; then

    sudo -u ec2-user \
        "${KAFKA_HOME}/bin/kafka-storage.sh" \
        random-uuid \
        > "${CLUSTER_ID_FILE}"

fi

KAFKA_CLUSTER_ID=$(tr -d '[:space:]' < "${CLUSTER_ID_FILE}")

chown ec2-user:ec2-user "${CLUSTER_ID_FILE}"

echo "Kafka Cluster ID: ${KAFKA_CLUSTER_ID}"


# ============================================================
# 7. FORMAT STORAGE ONLY THE FIRST TIME
# ============================================================

for NODE in 1 2 3
do

    META_FILE="${KAFKA_DATA}/server-${NODE}/meta.properties"

    if [[ ! -f "${META_FILE}" ]]; then

        echo "Formatting Kafka node ${NODE}..."

        sudo -u ec2-user \
            "${KAFKA_HOME}/bin/kafka-storage.sh" \
            format \
            -t "${KAFKA_CLUSTER_ID}" \
            -c "${KAFKA_CONFIG}/server-${NODE}.properties"

    else

        echo "Node ${NODE} already formatted."

    fi

done


# ============================================================
# 8. CREATE PUBLIC-IP UPDATE SCRIPT
#
# IMPORTANT:
# '#!/bin/bash' MUST BE THE FIRST LINE.
# Do NOT place a blank line after IPSCRIPT.
# ============================================================

cat > /usr/local/bin/update-kafka-public-ip.sh <<'IPSCRIPT'
#!/bin/bash
set -euo pipefail

KAFKA_CONFIG="/home/ec2-user/kafka/config/kraft"

TOKEN=$(curl \
    -fsS \
    --retry 10 \
    --retry-delay 2 \
    -X PUT \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" \
    http://169.254.169.254/latest/api/token)

PUBLIC_IP=""

for _ in {1..30}
do

    PUBLIC_IP=$(curl \
        -fsS \
        -H "X-aws-ec2-metadata-token: ${TOKEN}" \
        http://169.254.169.254/latest/meta-data/public-ipv4 \
        2>/dev/null || true)

    if [[ -n "${PUBLIC_IP}" ]]; then
        break
    fi

    sleep 2

done

if [[ -z "${PUBLIC_IP}" ]]; then

    echo "ERROR: EC2 Public IPv4 could not be retrieved."

    exit 1

fi

echo "Current Public IPv4: ${PUBLIC_IP}"

for SPEC in \
    "1:9092" \
    "2:9094" \
    "3:9096"
do

    IFS=: read -r NODE PORT <<< "${SPEC}"

    sed -i \
        "s|^advertised.listeners=.*|advertised.listeners=PLAINTEXT://${PUBLIC_IP}:${PORT}|" \
        "${KAFKA_CONFIG}/server-${NODE}.properties"

done

echo "Kafka advertised.listeners updated:"

grep \
    '^advertised.listeners=' \
    "${KAFKA_CONFIG}"/server-*.properties
IPSCRIPT

chmod 755 /usr/local/bin/update-kafka-public-ip.sh


# ============================================================
# 9. PUBLIC-IP SYSTEMD SERVICE
# ============================================================

cat > /etc/systemd/system/kafka-ip-update.service <<'EOF'
[Unit]
Description=Update Kafka advertised.listeners with EC2 Public IPv4
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/update-kafka-public-ip.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF


# ============================================================
# 10. CREATE KAFKA SYSTEMD SERVICES
# ============================================================

for NODE in 1 2 3
do

    cat > "/etc/systemd/system/kafka-broker-${NODE}.service" <<EOF
[Unit]
Description=Kafka KRaft Node ${NODE}
Wants=network-online.target
Requires=kafka-ip-update.service
After=network-online.target kafka-ip-update.service

[Service]
Type=simple

User=ec2-user
Group=ec2-user

Environment="KAFKA_HEAP_OPTS=-Xms512m -Xmx512m"

ExecStart=${KAFKA_HOME}/bin/kafka-server-start.sh ${KAFKA_CONFIG}/server-${NODE}.properties

Restart=on-failure
RestartSec=10

KillSignal=SIGTERM
TimeoutStopSec=60
SuccessExitStatus=143

LimitNOFILE=100000

[Install]
WantedBy=multi-user.target
EOF

done


# ============================================================
# 11. ENABLE SERVICES
# ============================================================

systemctl daemon-reload

systemctl enable kafka-ip-update.service

systemctl enable kafka-broker-1.service
systemctl enable kafka-broker-2.service
systemctl enable kafka-broker-3.service


# ============================================================
# 12. UPDATE PUBLIC IP BEFORE KAFKA STARTS
# ============================================================

systemctl start kafka-ip-update.service


# ============================================================
# 13. START ALL THREE KAFKA NODES
# ============================================================

systemctl start \
    kafka-broker-1.service \
    kafka-broker-2.service \
    kafka-broker-3.service


# ============================================================
# 14. WAIT FOR KAFKA
# ============================================================

sleep 15


# ============================================================
# 15. VERIFY
# ============================================================

echo ""
echo "======================================================"
echo "KAFKA SERVICE STATUS"
echo "======================================================"

for NODE in 1 2 3
do

    echo -n "Kafka Node ${NODE}: "

    systemctl is-active \
        "kafka-broker-${NODE}.service" || true

done


echo ""
echo "======================================================"
echo "KAFKA PORTS"
echo "======================================================"

ss -lntp | grep -E ':909[2-7]\b' || true


echo ""
echo "======================================================"
echo "ADVERTISED LISTENERS"
echo "======================================================"

grep \
    '^advertised.listeners=' \
    "${KAFKA_CONFIG}"/server-*.properties


echo ""
echo "======================================================"
echo "KAFKA INSTALLATION COMPLETE"
echo "======================================================"

echo "Kafka Version : ${KAFKA_VERSION}"
echo "Public IP     : ${PUBLIC_IP}"
echo ""
echo "Bootstrap servers:"
echo "${PUBLIC_IP}:9092,${PUBLIC_IP}:9094,${PUBLIC_IP}:9096"
echo ""
echo "Kafka data:"
echo "${KAFKA_DATA}"
echo ""
echo "User Data log:"
echo "${INSTALL_LOG}"
echo ""
echo "Completed: $(date)"
echo "======================================================"