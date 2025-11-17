#!/usr/bin/env python3
"""
Test script to verify PostgreSQL database connection and schema compatibility.
Run this after setting up your .env file to ensure everything works.
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect

def test_connection():
    """Test database connection and basic queries."""

    # Get database credentials
    db_host = os.getenv("DB_HOST", "csce-315-db.engr.tamu.edu")
    db_name = os.getenv("DB_NAME", "gang_81_db")
    db_user = os.getenv("DB_USER", "")
    db_password = os.getenv("DB_PASSWORD", "")

    if not db_user or not db_password:
        print("❌ ERROR: Database credentials not provided")
        print("   Set DB_USER and DB_PASSWORD environment variables")
        print("   Or create a .env file with these values")
        return False

    database_url = f"postgresql://{db_user}:{db_password}@{db_host}/{db_name}"

    try:
        print(f"🔗 Connecting to: {db_host}/{db_name}")
        print(f"   User: {db_user}")
        print()

        engine = create_engine(database_url)

        with engine.connect() as conn:
            print("✅ Connection successful!")
            print()

            # Test basic query
            print("📊 Testing basic queries...")
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"   PostgreSQL version: {version.split(',')[0]}")
            print()

            # Check if tables exist
            print("📋 Checking required tables...")
            inspector = inspect(engine)
            tables = inspector.get_table_names()

            required_tables = ['product', 'inventory', 'orders', 'orderitem',
                             'cashier', 'payment', 'productinventory', 'z_closure']

            for table in required_tables:
                if table in tables:
                    print(f"   ✅ {table}")
                else:
                    print(f"   ❌ {table} - NOT FOUND")
            print()

            # Verify camelCase columns in product table
            print("🔍 Verifying camelCase column names in 'product' table...")
            columns = inspector.get_columns('product')
            expected_columns = ['id', 'name', 'baseprice', 'category', 'ispopular', 'description']

            actual_columns = [col['name'] for col in columns]
            for col in expected_columns:
                if col in actual_columns:
                    print(f"   ✅ {col}")
                else:
                    print(f"   ❌ {col} - NOT FOUND")
            print()

            # Test a simple query
            print("🧪 Testing sample query...")
            result = conn.execute(text("SELECT COUNT(*) FROM product"))
            count = result.fetchone()[0]
            print(f"   Products in database: {count}")

            result = conn.execute(text("SELECT COUNT(*) FROM orders"))
            count = result.fetchone()[0]
            print(f"   Orders in database: {count}")

            result = conn.execute(text("SELECT COUNT(*) FROM inventory"))
            count = result.fetchone()[0]
            print(f"   Inventory items: {count}")
            print()

            print("✅ All tests passed! Database is ready to use.")
            return True

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print()
        print("Troubleshooting:")
        print("  1. Verify your credentials are correct")
        print("  2. Check VPN connection (if required)")
        print("  3. Ensure database host is reachable")
        print("  4. Verify you have access to the database")
        return False

if __name__ == "__main__":
    # Try to load .env file if python-dotenv is available
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("📁 Loaded environment variables from .env file")
        print()
    except ImportError:
        print("💡 Tip: Install python-dotenv to load .env files automatically")
        print("   pip install python-dotenv")
        print()

    success = test_connection()
    sys.exit(0 if success else 1)
