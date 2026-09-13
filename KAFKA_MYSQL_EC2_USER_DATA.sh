#!/bin/bash
set -euo pipefail

# Amazon Linux 2023: MySQL 8.0 + Kafka 4.3.1 (3 KRaft nodes on one EC2)
exec > >(tee -a /var/log/kafka-mysql-user-data.log) 2>&1

echo "=== Bootstrap started: $(date) ==="

KAFKA_VERSION="4.3.1"
SCALA_VERSION="2.13"
KAFKA_HOME="/home/ec2-user/kafka"
KAFKA_DATA="/home/ec2-user/kafka-data"
KAFKA_CONFIG="${KAFKA_HOME}/config/kraft"
KAFKA_URL="https://downloads.apache.org/kafka/${KAFKA_VERSION}/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz"

MYSQL_ROOT_PASSWORD="MyStrongRootPass123!"
MYSQL_USER="newuser"
MYSQL_USER_PASSWORD="StrongPassword123!"
MYSQL_REPO_RPM="https://repo.mysql.com/mysql80-community-release-el9.rpm"

# ---------------- Base packages ----------------
dnf update -y
dnf install -y java-17-amazon-corretto-headless tar gzip
java -version

# ======================== MySQL 8.0 ========================
echo "=== Installing MySQL 8.0 ==="

rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2023
rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2025

if ! rpm -q mysql80-community-release >/dev/null 2>&1; then
    curl -fL --retry 5 --retry-delay 2 \
        "$MYSQL_REPO_RPM" -o /tmp/mysql80-community-release.rpm

    dnf install -y /tmp/mysql80-community-release.rpm

    rm -f /tmp/mysql80-community-release.rpm
fi

# Current MySQL repository documentation uses the 2025 signing key.
if [[ -f /etc/yum.repos.d/mysql-community.repo ]]; then
    sed -i \
        's#RPM-GPG-KEY-mysql-2023#RPM-GPG-KEY-mysql-2025#g' \
        /etc/yum.repos.d/mysql-community.repo
fi

if [[ -f /etc/yum.repos.d/mysql-community-source.repo ]]; then
    sed -i \
        's#RPM-GPG-KEY-mysql-2023#RPM-GPG-KEY-mysql-2025#g' \
        /etc/yum.repos.d/mysql-community-source.repo
fi

dnf clean all
dnf makecache -y
dnf install -y mysql-community-server

systemctl enable mysqld
systemctl start mysqld

for _ in {1..60}; do

    systemctl is-active --quiet mysqld && \
    [[ -f /var/log/mysqld.log ]] && break

    sleep 2

done

if ! systemctl is-active --quiet mysqld; then

    echo "ERROR: mysqld failed to start"

    systemctl status mysqld --no-pager -l || true

    exit 1

fi

TEMP_PASS=$(grep 'temporary password' \
    /var/log/mysqld.log \
    2>/dev/null \
    | tail -1 \
    | awk '{print $NF}' || true)

if [[ -n "$TEMP_PASS" ]]; then

    mysql \
        --connect-expired-password \
        -u root \
        -p"$TEMP_PASS" <<SQL

ALTER USER 'root'@'localhost'
IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';

SQL

elif mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -e 'SELECT 1;' \
    >/dev/null 2>&1
then

    echo "MySQL root password already configured."

else

    echo "ERROR: Could not initialize MySQL root password."

    exit 1

fi

mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" <<SQL

CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%'
IDENTIFIED BY '${MYSQL_USER_PASSWORD}';

ALTER USER '${MYSQL_USER}'@'%'
IDENTIFIED BY '${MYSQL_USER_PASSWORD}';

GRANT ALL PRIVILEGES ON *.*
TO '${MYSQL_USER}'@'%';

FLUSH PRIVILEGES;

SQL

# Allow MySQL remote connections.
# EC2 Security Group must still allow TCP 3306.
if grep -Eq \
    '^[[:space:]]*bind-address[[:space:]]*=' \
    /etc/my.cnf
then

    sed -i \
        's/^[[:space:]]*bind-address[[:space:]]*=.*/bind-address = 0.0.0.0/' \
        /etc/my.cnf

elif grep -q '^\[mysqld\]' /etc/my.cnf; then

    sed -i \
        '/^\[mysqld\]/a bind-address = 0.0.0.0' \
        /etc/my.cnf

else

    printf \
        '\n[mysqld]\nbind-address = 0.0.0.0\n' \
        >> /etc/my.cnf

fi

systemctl restart mysqld

sleep 3

if ! systemctl is-active --quiet mysqld; then

    echo "ERROR: mysqld failed after configuration"

    systemctl status mysqld --no-pager -l || true

    exit 1

fi

mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    -e 'SELECT VERSION() AS mysql_version;'


# ======================== Kafka 4.3.1 ========================

echo "=== Installing Kafka ${KAFKA_VERSION} ==="

if [[ ! -x "${KAFKA_HOME}/bin/kafka-server-start.sh" ]]; then

    curl \
        -fL \
        --retry 5 \
        --retry-delay 3 \
        "$KAFKA_URL" \
        -o /tmp/kafka.tgz

    cd /home/ec2-user

    rm -rf \
        "kafka_${SCALA_VERSION}-${KAFKA_VERSION}" \
        "$KAFKA_HOME"

    tar -xzf /tmp/kafka.tgz

    mv \
        "kafka_${SCALA_VERSION}-${KAFKA_VERSION}" \
        "$KAFKA_HOME"

    rm -f /tmp/kafka.tgz

fi


# ---------------- Persistent Kafka storage ----------------

mkdir -p \
    "$KAFKA_DATA/server-1" \
    "$KAFKA_DATA/server-2" \
    "$KAFKA_DATA/server-3" \
    "$KAFKA_CONFIG"

chown -R \
    ec2-user:ec2-user \
    "$KAFKA_HOME" \
    "$KAFKA_DATA"


# ---------------- EC2 Public IP ----------------

get_public_ip() {

    local token
    local ip=""

    token=$(curl \
        -fsS \
        --retry 10 \
        --retry-delay 2 \
        -X PUT \
        -H 'X-aws-ec2-metadata-token-ttl-seconds: 21600' \
        http://169.254.169.254/latest/api/token)

    for _ in {1..30}; do

        ip=$(curl \
            -fsS \
            -H "X-aws-ec2-metadata-token: $token" \
            http://169.254.169.254/latest/meta-data/public-ipv4 \
            2>/dev/null || true)

        if [[ -n "$ip" ]]; then

            echo "$ip"

            return 0

        fi

        sleep 2

    done

    return 1
}


PUBLIC_IP=$(get_public_ip) || {

    echo "ERROR: EC2 Public IPv4 unavailable."

    exit 1

}

echo "EC2 Public IPv4: $PUBLIC_IP"


# ---------------- Kafka configurations ----------------

for SPEC in \
    1:9092:9093 \
    2:9094:9095 \
    3:9096:9097
do

    IFS=: read -r \
        NODE \
        BROKER_PORT \
        CONTROLLER_PORT <<< "$SPEC"

    cat > \
        "$KAFKA_CONFIG/server-${NODE}.properties" <<EOF
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

chown -R \
    ec2-user:ec2-user \
    "$KAFKA_CONFIG"


# ---------------- Kafka Cluster ID ----------------

CLUSTER_ID_FILE="$KAFKA_DATA/cluster.id"

if [[ ! -s "$CLUSTER_ID_FILE" ]]; then

    runuser \
        -u ec2-user \
        -- \
        "$KAFKA_HOME/bin/kafka-storage.sh" \
        random-uuid \
        > "$CLUSTER_ID_FILE"

fi

KAFKA_CLUSTER_ID=$(tr \
    -d '[:space:]' \
    < "$CLUSTER_ID_FILE")

chown \
    ec2-user:ec2-user \
    "$CLUSTER_ID_FILE"

echo "Kafka Cluster ID: $KAFKA_CLUSTER_ID"


# ---------------- Format Kafka storage ----------------

for NODE in 1 2 3
do

    META_FILE="$KAFKA_DATA/server-${NODE}/meta.properties"

    if [[ ! -f "$META_FILE" ]]; then

        runuser \
            -u ec2-user \
            -- \
            "$KAFKA_HOME/bin/kafka-storage.sh" \
            format \
            -t "$KAFKA_CLUSTER_ID" \
            -c "$KAFKA_CONFIG/server-${NODE}.properties"

    fi

done


# ============================================================
# Kafka public-IP updater
#
# IMPORTANT:
# #!/bin/bash must be the FIRST line of generated file.
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
    -H 'X-aws-ec2-metadata-token-ttl-seconds: 21600' \
    http://169.254.169.254/latest/api/token)

PUBLIC_IP=""

for _ in {1..30}; do

    PUBLIC_IP=$(curl \
        -fsS \
        -H "X-aws-ec2-metadata-token: $TOKEN" \
        http://169.254.169.254/latest/meta-data/public-ipv4 \
        2>/dev/null || true)

    [[ -n "$PUBLIC_IP" ]] && break

    sleep 2

done

if [[ -z "$PUBLIC_IP" ]]; then

    echo "ERROR: Public IPv4 unavailable."

    exit 1

fi

for SPEC in \
    1:9092 \
    2:9094 \
    3:9096
do

    IFS=: read -r NODE PORT <<< "$SPEC"

    sed -i \
        "s|^advertised.listeners=.*|advertised.listeners=PLAINTEXT://${PUBLIC_IP}:${PORT}|" \
        "$KAFKA_CONFIG/server-${NODE}.properties"

done

echo "Kafka advertised.listeners updated to $PUBLIC_IP"

grep \
    '^advertised.listeners=' \
    "$KAFKA_CONFIG"/server-*.properties
IPSCRIPT

chmod 755 \
    /usr/local/bin/update-kafka-public-ip.sh


# ---------------- IP update systemd service ----------------

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


# ---------------- Kafka systemd services ----------------

for NODE in 1 2 3
do

    cat > \
        "/etc/systemd/system/kafka-broker-${NODE}.service" <<EOF
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


# ---------------- Enable/start Kafka ----------------

systemctl daemon-reload

systemctl enable \
    kafka-ip-update.service \
    kafka-broker-1.service \
    kafka-broker-2.service \
    kafka-broker-3.service

systemctl start \
    kafka-ip-update.service

systemctl start \
    kafka-broker-1.service \
    kafka-broker-2.service \
    kafka-broker-3.service


# ============================================================
# WAIT FOR ACTUAL KAFKA RESPONSE
# ============================================================

KAFKA_READY=0

for _ in {1..60}; do

    if "$KAFKA_HOME/bin/kafka-topics.sh" \
        --bootstrap-server localhost:9092 \
        --list \
        >/dev/null 2>&1
    then

        KAFKA_READY=1

        break

    fi

    sleep 2

done


if [[ "$KAFKA_READY" -ne 1 ]]; then

    echo "ERROR: Kafka did not become ready."

    systemctl status \
        kafka-broker-1 \
        kafka-broker-2 \
        kafka-broker-3 \
        --no-pager \
        -l || true

    exit 1

fi


# ============================================================
# VERIFY ALL SERVICES
# ============================================================

for SERVICE in \
    mysqld \
    kafka-broker-1 \
    kafka-broker-2 \
    kafka-broker-3
do

    if ! systemctl is-active \
        --quiet \
        "$SERVICE"
    then

        echo "ERROR: $SERVICE is not active."

        systemctl status \
            "$SERVICE" \
            --no-pager \
            -l || true

        exit 1

    fi

done


# ============================================================
# VERIFY REQUIRED PORTS
# ============================================================

for PORT in \
    3306 \
    9092 \
    9093 \
    9094 \
    9095 \
    9096 \
    9097
do

    if ! ss -lnt \
        | awk '{print $4}' \
        | grep -Eq "(^|:)${PORT}$"
    then

        echo "ERROR: Required port ${PORT} is not listening."

        exit 1

    fi

done


# ============================================================
# SUCCESS
# ============================================================

echo ""
echo "======================================================"
echo "INSTALLATION COMPLETE"
echo "======================================================"

echo "MySQL:"
echo "  TCP 3306"
echo "  Remote user: ${MYSQL_USER}"

echo ""

echo "Kafka:"
echo "  Broker 1 : ${PUBLIC_IP}:9092"
echo "  Controller 1 : 9093"

echo "  Broker 2 : ${PUBLIC_IP}:9094"
echo "  Controller 2 : 9095"

echo "  Broker 3 : ${PUBLIC_IP}:9096"
echo "  Controller 3 : 9097"

echo ""

echo "Kafka bootstrap servers:"
echo "${PUBLIC_IP}:9092,${PUBLIC_IP}:9094,${PUBLIC_IP}:9096"

echo ""

echo "Combined log:"
echo "/var/log/kafka-mysql-user-data.log"

echo ""

echo "Completed: $(date)"

echo "======================================================"