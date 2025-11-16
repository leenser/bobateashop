# Quick Start Guide

## Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

## Step 1: Backend Setup

```bash
cd back-end

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The backend will start on `http://localhost:5000`

## Step 2: Frontend Setup

```bash
cd front-end

# Install dependencies
npm install

# Create .env file (linux/mac)
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key-here
VITE_OPENWEATHER_API_KEY=your-openweather-api-key-here
EOF
# (windows)
@"
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key-here
VITE_OPENWEATHER_API_KEY=your-openweather-api-key-here
"@ | Out-File -FilePath .env -Encoding utf8


# Run the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## Step 3: Access the Application

- **Customer Interface (Kiosk)**: http://localhost:5173/customer
- **Cashier Interface (POS)**: http://localhost:5173/cashier
- **Manager Interface (Dashboard)**: http://localhost:5173/manager
- **Login Page**: http://localhost:5173/login

## Note on API Keys

For development and testing, you can run the application without all API keys configured:

- **Google OAuth2**: Required for Cashier and Manager interfaces
- **Google Translate**: Optional (language selection will not work)
- **OpenWeather**: Optional (weather display will not work)

The Customer Interface (Kiosk) works without authentication and can function without external API keys.

## Testing the Application

1. **Customer Interface**:

   - Navigate to `/customer`
   - Browse products and add to cart
   - Checkout to create an order

2. **Cashier Interface**:

   - Navigate to `/cashier`
   - Sign in with Google OAuth
   - Process orders with different payment methods

3. **Manager Interface**:
   - Navigate to `/manager`
   - Sign in with Google OAuth (manager email)
   - View sales statistics and order history

## Troubleshooting

### Backend not starting

- Check if port 5000 is available
- Verify Python version (3.9+)
- Check if all dependencies are installed

### Frontend not connecting to backend

- Verify backend is running on port 5000
- Check `.env` file has correct `VITE_API_BASE_URL`
- Check browser console for CORS errors

### Authentication not working

- Verify Google OAuth2 Client ID is correct
- Check authorized redirect URIs in Google Cloud Console
- Ensure `reveille.bubbletea@gmail.com` is authorized

### Database errors

- For development, SQLite database will be created automatically
- For production, ensure PostgreSQL is configured correctly
- Check `DATABASE_URL` environment variable
