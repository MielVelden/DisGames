#!/bin/bash
set -e

DATA_DIR=/var/lib/mysql

field() {
    node -e "
        const u = new URL(process.env.DATABASE_URL);
        const map = {
            host: u.hostname,
            port: u.port || '3306',
            user: decodeURIComponent(u.username),
            pass: decodeURIComponent(u.password),
            name: u.pathname.slice(1),
        };
        process.stdout.write(map['$1']);
    "
}

DB_HOST=$(field host)
DB_USER=$(field user)
DB_PASS=$(field pass)
DB_NAME=$(field name)

if [ "$DB_HOST" = "127.0.0.1" ] || [ "$DB_HOST" = "localhost" ]; then
    if [ ! -d "$DATA_DIR/mysql" ]; then
        echo "Initializing bundled MySQL data directory..."
        mysqld --initialize-insecure --user=mysql --datadir="$DATA_DIR"
    fi

    echo "Starting bundled MySQL server..."
    mysqld --user=mysql --datadir="$DATA_DIR" --bind-address=127.0.0.1 &

    until mysqladmin ping --silent -h127.0.0.1 2>/dev/null; do
        sleep 1
    done

    mysql -uroot <<-SQL
        CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
        CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
        GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
        FLUSH PRIVILEGES;
SQL

    if [ -f /app/src/db/schema.sql ]; then
        TABLE_COUNT=$(mysql -uroot -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';")
        if [ "$TABLE_COUNT" -eq 0 ]; then
            echo "Importing initial schema..."
            mysql -uroot "${DB_NAME}" < /app/src/db/schema.sql
        fi
    fi
else
    echo "DATABASE_URL points to external host ${DB_HOST}, skipping bundled MySQL."
fi

exec "$@"
