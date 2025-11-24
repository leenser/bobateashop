#!/bin/bash
# Quick script to create users table

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Creating users table in PostgreSQL database..."

# Run the migration script
PGPASSWORD="1vqoKXMC" psql -h csce-315-db.engr.tamu.edu -U gang_81 -d gang_81_db -f migrations/001_create_users_table.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Users table created successfully!${NC}"

    # Verify table exists
    echo ""
    echo "Verifying table creation..."
    PGPASSWORD="1vqoKXMC" psql -h csce-315-db.engr.tamu.edu -U gang_81 -d gang_81_db -c "\d users"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Table verified!${NC}"
    else
        echo -e "${RED}✗ Could not verify table${NC}"
    fi
else
    echo -e "${RED}✗ Failed to create users table${NC}"
    exit 1
fi

echo ""
echo "You can now test OAuth login at http://localhost:5173/login"
