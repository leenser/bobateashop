# Database Migration: SQLite to PostgreSQL

## Overview
The Python backend has been migrated from SQLite to PostgreSQL to match the Java implementation. The PostgreSQL schema uses **camelCase** column names instead of snake_case.

## Key Changes

### 1. Database Schema Mapping

The PostgreSQL database uses camelCase column names. Here's the mapping:

| Python Attribute (snake_case) | PostgreSQL Column (camelCase) |
|-------------------------------|------------------------------|
| `base_price` | `baseprice` |
| `is_popular` | `ispopular` |
| `item_name` | `itemname` |
| `current_stock` | `currentstock` |
| `min_threshold` | `minthreshold` |
| `last_restock_date` | `date` |
| `customer_id` | `customerid` |
| `cashier_id` | `cashierid` |
| `order_time` | `ordertime` |
| `order_id` | `orderid` |
| `product_id` | `productid` |
| `line_price` | _not stored in legacy schema (computed in service)_ |
| `employee_code` | `employeecode` |
| `is_active` | `isactive` |
| `hire_date` | `hiredate` |
| `quantity_used` | `quantityused` |
| `inventory_id` | `inventoryid` |
| `amount_paid` | `amountpaid` |
| `payment_method` | `paymentmethod` |
| `payment_time` | `paymenttime` |

### 2. Table Name Changes

- `payments` → `payment` (singular)

### 3. SQL Query Updates

All raw SQL queries have been updated to use:
- **PostgreSQL syntax**: `EXTRACT(HOUR FROM ...)` instead of `STRFTIME(...)`
- **COALESCE** instead of `IFNULL`
- **camelCase** column names throughout

## Configuration

### Environment Variables

Create a `.env` file in the `back-end` directory with your database credentials:

```bash
# Copy from .env.example
cp .env.example .env

# Edit .env with your credentials
DB_USER=your_username
DB_PASSWORD=your_password
```

### Connection Details

- **Host**: `csce-315-db.engr.tamu.edu`
- **Database**: `gang_81_db`
- **Connection String**: `postgresql://{user}:{password}@csce-315-db.engr.tamu.edu/gang_81_db`

### Fallback to SQLite

If no PostgreSQL credentials are provided, the application will automatically fall back to SQLite for local development:
- Database file: `instance/pos_dev.db`
- Tables are created automatically for SQLite

## Files Modified

1. **`app/db/models.py`**
   - Updated all SQLAlchemy column definitions to map Python attributes to camelCase database columns
   - Changed `Payment.__tablename__` from `"payments"` to `"payment"`
   - Changed `InventoryItem.last_restock_date` column name to `"date"`

2. **`app/config.py`**
   - Added PostgreSQL connection configuration
   - Environment variable support for credentials
   - Connection pooling settings for production
   - Automatic fallback to SQLite if no credentials

3. **`app/db/__init__.py`**
   - Modified to only create tables for SQLite
   - PostgreSQL uses existing schema
   - Added connection status logging

4. **`app/routes/reports_routes.py`**
   - Updated all raw SQL queries to PostgreSQL syntax
   - Changed `STRFTIME` to `EXTRACT(HOUR FROM ...)`
   - Changed `IFNULL` to `COALESCE`
   - Updated all column names to camelCase
   - Updated table name `payments` to `payment`

5. **`.env.example`** (new file)
   - Template for database configuration
   - Instructions for setup

## Running the Application

### With PostgreSQL (Production/Team Database)

```bash
# Set environment variables
export DB_USER="your_username"
export DB_PASSWORD="your_password"

# Or use .env file
source .env

# Run the application
python run.py
```

### With SQLite (Local Development)

```bash
# Don't set DB_USER and DB_PASSWORD
# Application will automatically use SQLite

python run.py
```

## Testing the Migration

### 1. Test Database Connection

```bash
# This should show: "✓ Connected to PostgreSQL (using existing schema)"
python run.py
```

### 2. Test API Endpoints

```bash
# Products
curl http://localhost:5000/api/products

# Inventory
curl http://localhost:5000/api/inventory

# Orders
curl http://localhost:5000/api/orders/recent

# Reports
curl http://localhost:5000/api/reports/x-report
```

### 3. Verify Data Integrity

- Check that existing orders appear correctly
- Verify products load with correct prices
- Ensure inventory items display properly
- Test report generation (X-report, Z-report)

## Troubleshooting

### Connection Issues

If you see connection errors:
1. Verify credentials are correct
2. Check VPN connection (if required)
3. Verify database host is reachable: `ping csce-315-db.engr.tamu.edu`
4. Check firewall settings

### Column Name Errors

If you see errors like "column does not exist":
1. Ensure you're using the latest version of `models.py`
2. Verify the actual PostgreSQL schema matches expectations
3. Check if the Java schema has been updated

### Authentication Errors

If authentication fails:
1. Verify DB_USER and DB_PASSWORD are set correctly
2. Check that your database user has proper permissions
3. Try connecting with `psql` to verify credentials work

## Schema Verification

To verify the PostgreSQL schema matches our expectations:

```sql
-- Connect to database
psql -h csce-315-db.engr.tamu.edu -U your_username -d gang_81_db

-- Check column names for product table
\d product

-- Check column names for orders table
\d orders

-- Check column names for orderitem table
\d orderitem
```

## Compatibility Notes

- **Python 3.8+** required
- **psycopg2-binary** 2.9.11+ required (already in requirements.txt)
- **SQLAlchemy** uses column name mapping for backwards compatibility
- All Python code continues to use snake_case attribute names
- Database operations transparently map to camelCase

## Rollback Plan

If you need to roll back to SQLite:

1. Unset PostgreSQL environment variables:
   ```bash
   unset DB_USER DB_PASSWORD DATABASE_URL
   ```

2. Or comment out credentials in `.env`

3. Application will automatically use SQLite

## Next Steps

1. ✅ Update SQLAlchemy models
2. ✅ Update configuration
3. ✅ Update raw SQL queries
4. ✅ Create environment variable template
5. ⏳ Test with actual PostgreSQL database
6. ⏳ Update deployment documentation
7. ⏳ Update CI/CD pipeline (if applicable)

## Support

For issues or questions:
- Check this documentation first
- Review Java `DatabaseManager.java` for schema reference
- Compare with actual PostgreSQL schema using `\d` commands
- Contact team database administrator
