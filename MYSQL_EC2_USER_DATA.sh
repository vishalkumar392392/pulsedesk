#!/bin/bash
set -euo pipefail

# ============================================================
# MySQL 8.0 Installation - Amazon Linux 2023
# ============================================================

MYSQL_ROOT_PASSWORD="MyStrongRootPass123!"
MYSQL_USER="newuser"
MYSQL_USER_PASSWORD="StrongPassword123!"

MYSQL_REPO_RPM="https://repo.mysql.com/mysql80-community-release-el9.rpm"

INSTALL_LOG="/var/log/mysql-user-data.log"

exec > >(tee -a "$INSTALL_LOG") 2>&1

echo "======================================================"
echo "MySQL installation started: $(date)"
echo "======================================================"


# ============================================================
# 1. UPDATE SYSTEM
# ============================================================

dnf update -y


# ============================================================
# 2. INSTALL REQUIRED PACKAGES
# ============================================================

dnf install -y \
    wget


# ============================================================
# 3. INSTALL MYSQL 8.0 REPOSITORY
# ============================================================

if ! rpm -q mysql80-community-release >/dev/null 2>&1; then

    echo "Installing MySQL 8.0 repository..."

    wget -O /tmp/mysql80-community-release.rpm \
        "${MYSQL_REPO_RPM}"

    dnf install -y \
        /tmp/mysql80-community-release.rpm

    rm -f /tmp/mysql80-community-release.rpm

else

    echo "MySQL repository already installed."

fi


# ============================================================
# 4. IMPORT MYSQL GPG KEY
# ============================================================

rpm --import \
    https://repo.mysql.com/RPM-GPG-KEY-mysql-2023


# ============================================================
# 5. INSTALL MYSQL SERVER
# ============================================================

if ! rpm -q mysql-community-server >/dev/null 2>&1; then

    echo "Installing MySQL Community Server..."

    dnf install -y mysql-community-server

else

    echo "MySQL Server already installed."

fi


# ============================================================
# 6. ENABLE AND START MYSQL
# ============================================================

systemctl enable mysqld
systemctl start mysqld


# ============================================================
# 7. WAIT UNTIL MYSQL IS READY
# ============================================================

echo "Waiting for MySQL to start..."

for i in {1..30}
do

    if mysqladmin ping --silent 2>/dev/null; then
        echo "MySQL is ready."
        break
    fi

    sleep 2

done


# ============================================================
# 8. CONFIGURE MYSQL ROOT PASSWORD
# ============================================================

TEMP_PASS=""

if [[ -f /var/log/mysqld.log ]]; then

    TEMP_PASS=$(grep 'temporary password' \
        /var/log/mysqld.log \
        | tail -1 \
        | awk '{print $NF}' || true)

fi


if [[ -n "${TEMP_PASS}" ]]; then

    echo "Temporary MySQL root password detected."

    mysql \
        --connect-expired-password \
        -u root \
        -p"${TEMP_PASS}" <<EOF

ALTER USER 'root'@'localhost'
IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';

FLUSH PRIVILEGES;

EOF

else

    echo "No temporary password found."

    echo "Checking whether root password is already configured..."

    if mysql \
        -u root \
        -p"${MYSQL_ROOT_PASSWORD}" \
        -e "SELECT 1;" \
        >/dev/null 2>&1
    then

        echo "Root password already configured."

    else

        echo "ERROR: Unable to configure MySQL root account."
        exit 1

    fi

fi


# ============================================================
# 9. CREATE APPLICATION USER
#
# IMPORTANT:
# We do NOT create root@'%'.
# Use a dedicated remote application user instead.
# ============================================================

mysql \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD}" <<EOF

CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%'
IDENTIFIED BY '${MYSQL_USER_PASSWORD}';

ALTER USER '${MYSQL_USER}'@'%'
IDENTIFIED BY '${MYSQL_USER_PASSWORD}';

GRANT ALL PRIVILEGES ON *.*
TO '${MYSQL_USER}'@'%';

FLUSH PRIVILEGES;

EOF


# ============================================================
# 10. CONFIGURE MYSQL TO ACCEPT REMOTE CONNECTIONS
# ============================================================

MYSQL_CONFIG="/etc/my.cnf"

if grep -q '^bind-address' "${MYSQL_CONFIG}"; then

    sed -i \
        's/^bind-address.*/bind-address = 0.0.0.0/' \
        "${MYSQL_CONFIG}"

else

    if grep -q '^\[mysqld\]' "${MYSQL_CONFIG}"; then

        sed -i \
            '/^\[mysqld\]/a bind-address = 0.0.0.0' \
            "${MYSQL_CONFIG}"

    else

        cat >> "${MYSQL_CONFIG}" <<EOF

[mysqld]
bind-address = 0.0.0.0

EOF

    fi

fi


# ============================================================
# 11. RESTART MYSQL
# ============================================================

systemctl restart mysqld


# ============================================================
# 12. VERIFY MYSQL SERVICE
# ============================================================

sleep 5

if systemctl is-active --quiet mysqld; then

    echo "MySQL service is running."

else

    echo "ERROR: MySQL service failed."
    systemctl status mysqld --no-pager -l
    exit 1

fi


# ============================================================
# 13. VERIFY MYSQL LOGIN
# ============================================================

mysql \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD}" \
    -e "SELECT VERSION() AS mysql_version;"


# ============================================================
# 14. SHOW CREATED USER
# ============================================================

mysql \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD}" \
    -e "
SELECT
    user,
    host,
    plugin
FROM mysql.user
WHERE user IN ('root','${MYSQL_USER}');
"


# ============================================================
# 15. SHOW MYSQL LISTENING PORT
# ============================================================

echo ""
echo "======================================================"
echo "MYSQL PORT"
echo "======================================================"

ss -lntp | grep ':3306' || true


echo ""
echo "======================================================"
echo "MYSQL INSTALLATION COMPLETE"
echo "======================================================"

echo "MySQL service : mysqld"
echo "MySQL port    : 3306"
echo "Remote user   : ${MYSQL_USER}"
echo "Config        : ${MYSQL_CONFIG}"
echo "Log           : ${INSTALL_LOG}"
echo ""
echo "Completed: $(date)"
echo "======================================================"