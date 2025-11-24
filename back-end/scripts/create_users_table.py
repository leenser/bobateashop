#!/usr/bin/env python3
"""
Script to create users table in PostgreSQL database
Run this from the back-end directory: python create_users_table.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("❌ psycopg2 not installed. Installing...")
    os.system("pip install psycopg2-binary")
    import psycopg2
    from psycopg2 import sql

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv not installed. Using environment variables only.")

# Get database credentials from environment
DB_HOST = os.getenv("DB_HOST", "csce-315-db.engr.tamu.edu")
DB_NAME = os.getenv("DB_NAME", "gang_81_db")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

if not DB_USER or not DB_PASSWORD:
    print("❌ Error: DB_USER and DB_PASSWORD must be set in .env file")
    sys.exit(1)

# SQL to create users table
CREATE_TABLE_SQL = """
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    picture VARCHAR(500),
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'cashier', 'manager', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert authorized user with admin role
INSERT INTO users (email, name, role, is_active, created_at, last_login)
VALUES (
    'reveille.bubbletea@gmail.com',
    'Reveille',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin', is_active = true;
"""

VERIFY_TABLE_SQL = """
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
"""

def create_users_table():
    """Create users table in PostgreSQL database"""
    print(f"🔌 Connecting to database: {DB_HOST}/{DB_NAME}")

    try:
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )

        conn.autocommit = True
        cursor = conn.cursor()

        print("✓ Connected successfully!")
        print("\n📝 Creating users table...")

        # Execute table creation SQL
        cursor.execute(CREATE_TABLE_SQL)

        print("✓ Users table created successfully!")

        # Verify table structure
        print("\n🔍 Verifying table structure...")
        cursor.execute(VERIFY_TABLE_SQL)
        columns = cursor.fetchall()

        if columns:
            print("✓ Table structure verified:")
            print("\n  Column Name       | Data Type          | Nullable | Default")
            print("  " + "-" * 70)
            for col in columns:
                col_name, data_type, nullable, default = col
                default_str = str(default)[:30] if default else "None"
                print(f"  {col_name:16} | {data_type:18} | {nullable:8} | {default_str}")
        else:
            print("⚠️  Could not verify table structure")

        # Check if reveille user was created
        print("\n👤 Checking for admin user...")
        cursor.execute("SELECT email, role FROM users WHERE email = 'reveille.bubbletea@gmail.com'")
        user = cursor.fetchone()

        if user:
            print(f"✓ Admin user found: {user[0]} with role '{user[1]}'")
        else:
            print("⚠️  Admin user not found")

        cursor.close()
        conn.close()

        print("\n✅ Database setup complete!")
        print("\nYou can now test OAuth login at: http://localhost:5173/login")

        return True

    except psycopg2.Error as e:
        print(f"\n❌ Database error: {e}")
        print(f"\nError details:")
        print(f"  - Error code: {e.pgcode}")
        print(f"  - Error message: {e.pgerror}")
        return False

    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("  Users Table Creation Script")
    print("=" * 70)
    print()

    success = create_users_table()

    if not success:
        sys.exit(1)
