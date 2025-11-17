# Quick Start Guide - Run the Bubble Tea POS

## 🚀 Running the Application

You need **2 terminal windows** - one for the backend, one for the frontend.

---

## Terminal 1: Start the Backend Server

```bash
# Navigate to backend directory
cd back-end

# Install dependencies (first time only)
pip install -r requirements.txt
# OR if you're using uv:
# uv sync

# Seed the database (first time only, or to reset data)
PYTHONPATH=. python scripts/seed.py

# Start the Flask server
python main.py
```

**✅ You should see:**

```
 * Running on http://0.0.0.0:5001
 * Debug mode: on
```

**⚠️ Keep this terminal open!** The backend must be running for the frontend to work.

---

## Terminal 2: Start the Frontend Server

Open a **NEW terminal window** (keep Terminal 1 running):

```bash
# Navigate to frontend directory
cd front-end

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

**✅ You should see:**

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

**⚠️ Keep this terminal open too!**

---

## 🌐 Access the Application

Open your browser and go to:

- **http://localhost:5173/**

The app will automatically connect to the backend on port 5001.

---

## ✅ Verify Backend Connection

1. **Check backend is running**: Look at Terminal 1 - you should see Flask running
2. **Test in browser**: Open http://localhost:5173/ - you should see products loading
3. **Check browser console**: Press F12 → Console tab. You should see API calls to `/api/products/all`
4. **Test API directly**: Visit http://localhost:5001/api/meta/health - should return `{"ok": true}`

---

## 🔧 Connection Details

- **Backend API**: http://localhost:5001/api
- **Frontend Dev Server**: http://localhost:5173
- **Proxy**: Vite automatically forwards `/api/*` requests to the backend
- **CORS**: Enabled on backend to allow frontend requests

---

## 🐛 Troubleshooting

### Backend won't start

- **Port 5001 in use**: Kill the process using port 5001
  ```bash
  # macOS/Linux
  lsof -ti:5001 | xargs kill -9
  ```
- **Module not found**: Install dependencies: `pip install -r requirements.txt`
- **Database error**: Run seed script: `PYTHONPATH=. python scripts/seed.py`

### Frontend can't connect to backend

- **Backend not running**: Make sure Terminal 1 is running `python main.py`
- **Wrong port**: Verify backend is on port 5001 (check Terminal 1 output)
- **CORS error**: Backend has CORS enabled, but if issues persist, check `back-end/app/__init__.py`

### No products showing

- **Database not seeded**: Run `PYTHONPATH=. python scripts/seed.py` in Terminal 1
- **Backend error**: Check Terminal 1 for error messages
- **Network error**: Open browser DevTools (F12) → Network tab → Look for failed requests

---

## 📝 Quick Commands Reference

**First time setup:**

```bash
# Backend
cd back-end
pip install -r requirements.txt
PYTHONPATH=. python scripts/seed.py

# Frontend
cd front-end
npm install
```

**Every time you run the app:**

```bash
# Terminal 1
cd back-end && python main.py

# Terminal 2
cd front-end && npm run dev
```

---

## 🎯 What to Expect

1. **Customer View** (default): Browse products, customize, add to cart, checkout
2. **Cashier View**: Select cashier, process orders, view cart
3. **Manager View**: View orders, inventory, reports, manage cashiers
4. **Settings Button** (bottom left): Toggle dark mode, adjust text size
5. **Admin Button** (bottom left): Switch between views

---

## ✨ Features Available

- ✅ Product browsing and customization
- ✅ Shopping cart functionality
- ✅ Order processing
- ✅ Cashier selection
- ✅ Manager dashboard with reports
- ✅ Dark mode toggle
- ✅ Text size adjustment
- ✅ View switching

---

**Need help?** Check the browser console (F12) and backend terminal for error messages!
