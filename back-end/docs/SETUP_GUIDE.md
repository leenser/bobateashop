# PostgreSQL Backend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd back-end
pip install -r requirements.txt
```

### 2. Configure Database

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` and set your database credentials:

```bash
DB_USER=your_username
DB_PASSWORD=your_password
```

### 3. Test Connection

Run the test script to verify your database connection:

```bash
python test_db_connection.py
```

You should see output like:
```
✅ Connection successful!
✅ All tests passed! Database is ready to use.
```

### 4. Start the Server

```bash
python main.py
```

The server will start on `http://localhost:5001`

## Environment Variables

### Required for PostgreSQL

- `DB_USER` - Your PostgreSQL username
- `DB_PASSWORD` - Your PostgreSQL password

### Optional Configuration

- `DB_HOST` - Database host (default: `csce-315-db.engr.tamu.edu`)
- `DB_NAME` - Database name (default: `gang_81_db`)
- `DATABASE_URL` - Full connection string (overrides individual settings)
- `FLASK_ENV` - Environment mode: `dev` or `production` (default: `dev`)
- `PORT` - Server port (default: `5001`)

## Testing the API

### Health Check

```bash
curl http://localhost:5001/
```

Expected response:
```json
{
  "ok": true,
  "message": "KungFu Tea POS API is running",
  "version": "1.0"
}
```

### Products

```bash
curl http://localhost:5001/api/products
```

### Inventory

```bash
curl http://localhost:5001/api/inventory
```

### Orders

```bash
curl http://localhost:5001/api/orders/recent
```

### Reports

```bash
# X-Report (current shift)
curl http://localhost:5001/api/reports/x-report

# Z-Report (end of day)
curl -X POST http://localhost:5001/api/reports/z-report \
  -H "Content-Type: application/json" \
  -d '{"reset": false}'
```

## Troubleshooting

### Connection Failed

**Problem**: Cannot connect to database

**Solutions**:
1. Verify credentials in `.env` file
2. Check VPN connection (if required)
3. Test with `psql`:
   ```bash
   psql -h csce-315-db.engr.tamu.edu -U your_username -d gang_81_db
   ```
4. Ensure `psycopg2-binary` is installed

### Column Does Not Exist

**Problem**: SQL error about missing columns

**Solutions**:
1. Verify you have the latest code
2. Check actual database schema:
   ```sql
   \d product
   \d orders
   \d orderitem
   ```
3. Ensure column names are camelCase in PostgreSQL

### Import Errors

**Problem**: Module not found errors

**Solutions**:
1. Ensure virtual environment is activated
2. Reinstall dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Port Already in Use

**Problem**: Port 5001 is already in use

**Solutions**:
1. Kill the existing process:
   ```bash
   lsof -ti:5001 | xargs kill
   ```
2. Or use a different port:
   ```bash
   PORT=5002 python main.py
   ```

## Development vs Production

### Development Mode (SQLite Fallback)

If you don't set `DB_USER` and `DB_PASSWORD`, the app will automatically use SQLite for local development:

```bash
# Unset PostgreSQL credentials
unset DB_USER DB_PASSWORD

# Run with SQLite
python main.py
```

Database file will be created at: `instance/pos_dev.db`

### Production Mode (PostgreSQL Required)

Set environment to production:

```bash
export FLASK_ENV=production
export DB_USER=your_username
export DB_PASSWORD=your_password

python main.py
```

## API Documentation

### Base URL
- Development: `http://localhost:5001`
- API Prefix: `/api`

### Endpoints

#### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Inventory
- `GET /api/inventory` - List all inventory items
- `GET /api/inventory/low-stock` - List low stock items
- `POST /api/inventory` - Add inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

#### Orders
- `GET /api/orders` - List orders (with pagination)
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders` - Create new order
- `GET /api/orders/recent` - Recent transactions
- `GET /api/orders/:id/receipt` - Get order receipt
- `POST /api/orders/:id/refund` - Refund order

#### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Add employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

#### Reports
- `GET /api/reports/x-report` - Current shift report
- `POST /api/reports/z-report` - End of day report
- `GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` - Sales summary
- `GET /api/reports/weekly-items` - Weekly item sales
- `GET /api/reports/daily-top?days=7` - Daily top sellers

## Database Schema

The PostgreSQL database uses **camelCase** column names. The SQLAlchemy models automatically map Python's snake_case attributes to the database's camelCase columns.

### Example Mapping

Python code:
```python
product = Product.query.filter_by(is_popular=True).first()
price = product.base_price
```

SQL generated:
```sql
SELECT * FROM product WHERE ispopular = true LIMIT 1;
-- Access: baseprice column
```

## Support

- See `DATABASE_MIGRATION.md` for detailed migration documentation
- Run `python test_db_connection.py` to diagnose connection issues
- Check application logs for detailed error messages
