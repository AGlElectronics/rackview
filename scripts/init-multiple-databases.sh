#!/bin/bash

set -e

function create_user_and_database() {
	local database=$1
	local user=$2
	local password=$3
	echo "Creating user and database '$database'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	    CREATE USER $user WITH PASSWORD '$password';
	    CREATE DATABASE $database;
	    GRANT ALL PRIVILEGES ON DATABASE $database TO $user;
EOSQL
}

# Create metabase database and user
if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
		if [ "$db" = "metabase" ]; then
			create_user_and_database metabase metabase metabase
		fi
	done
	echo "Multiple databases created"
fi
