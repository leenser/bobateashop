# How to Run the Bubble Tea POS Application

## Prerequisites

- Python 3.12+ installed
- Node.js and npm installed
- Database file will be created automatically (SQLite for dev)

## Step 1: Install Backend Dependencies

You have two options:

### Option A: Using `uv` (recommended based on your project setup)

```bash
cd back-end/
uv sync
```

### Option B: Using `pip`

```bash
cd back-end/
pip install -r requirements.txt
```

## Step 2: Seed the Database (First Time Only)

This populates the database with sample products, inventory, and cashiers:

```bash
cd back-end/
PYTHONPATH=. python scripts/seed.py
```

Or if using `uv`:

```bash
cd back-end/
PYTHONPATH=. uv run python scripts/seed.py
```

## Step 3: Start the Backend Server

The backend runs on **port 5001**:

```bash
cd back-end/
python main.py
```

Or if using `uv`:

```bash
cd back-end/
uv run python main.py
```

You should see output like:

```
 * Running on http://0.0.0.0:5001
 * Debug mode: on
```

**Keep this terminal window open!**

## Step 4: Install Frontend Dependencies (First Time Only)

Open a **new terminal window**:

```bash
cd front-end/
npm install
```

## Step 5: Start the Frontend Development Server

```bash
cd front-end/
npm run dev
```

You should see output like:

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Keep this terminal window open too!**

## Step 6: Access the Application

Open your browser and navigate to:

- **Customer View (Default)**: http://localhost:5173/
- **Cashier View**: http://localhost:5173/cashier
- **Manager View**: http://localhost:5173/manager

Or use the **Admin button** in the bottom-left corner to switch between views.

## Summary

You need **2 terminal windows** running simultaneously:

1. **Terminal 1** (Backend): `cd back-end && python main.py`
2. **Terminal 2** (Frontend): `cd front-end && npm run dev`

## Troubleshooting

- **Port 5001 already in use**: Make sure no other process is using port 5001
- **Port 5173 already in use**: Vite will automatically try the next available port
- **Database errors**: Run the seed script again: `PYTHONPATH=. python scripts/seed.py`
- **Module not found errors**: Make sure you've installed all dependencies in both frontend and backend

## Quick Start (After Initial Setup)

Once everything is set up, you only need to run:

**Terminal 1:**

```bash
cd back-end && python main.py
```

**Terminal 2:**

```bash
cd front-end && npm run dev
```
