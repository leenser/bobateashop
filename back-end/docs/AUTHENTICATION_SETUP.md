# Authentication Setup Guide

## Overview

This application now uses Google OAuth 2.0 for user authentication. Users can sign in with their Google account, and the system supports role-based access control (customer, cashier, manager, admin).

## Features

- **Google OAuth 2.0 Authentication**: Secure login with Google accounts
- **Role-Based Access Control**: Different permissions for customers, cashiers, managers, and admins
- **Session Management**: Secure session tokens with expiration
- **Database User Storage**: User information stored in PostgreSQL
- **Authorized Email**: reveille.bubbletea@gmail.com is configured for access

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:5173/auth/callback`
     - For production: `https://your-domain.com/auth/callback`
   - Save the Client ID and Client Secret

### 2. Backend Configuration

1. Copy the example environment file:
   ```bash
   cd back-end
   cp .env.example .env
   ```

2. Edit `.env` and add your Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
   ```

3. Install dependencies (if not already installed):
   ```bash
   pip install requests
   # or with uv
   uv pip install requests
   ```

4. Create the users table in your database:
   ```sql
   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       email VARCHAR(255) UNIQUE NOT NULL,
       name VARCHAR(255),
       google_id VARCHAR(255) UNIQUE,
       picture VARCHAR(500),
       role VARCHAR(50) DEFAULT 'customer',
       is_active BOOLEAN DEFAULT true,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

5. (Optional) Set initial user roles:
   ```sql
   -- Make reveille.bubbletea@gmail.com an admin
   INSERT INTO users (email, role, is_active)
   VALUES ('reveille.bubbletea@gmail.com', 'admin', true)
   ON CONFLICT (email) DO UPDATE SET role = 'admin';
   ```

### 3. Frontend Configuration

1. Create a `.env` file in the `front-end` directory (if not exists):
   ```env
   VITE_API_URL=http://localhost:5001
   ```

2. The frontend is already configured to use the OAuth flow

### 4. Running the Application

1. Start the backend:
   ```bash
   cd back-end
   python main.py
   ```

2. Start the frontend:
   ```bash
   cd front-end
   npm run dev
   ```

3. Navigate to `http://localhost:5173/login`

4. Click "Sign in with Google" and authenticate with your Google account

## API Endpoints

### Authentication Endpoints

- `GET /api/auth/google/url` - Get Google OAuth authorization URL
- `POST /api/auth/google/callback` - Handle OAuth callback and create session
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout current user
- `PUT /api/auth/users/:id/role` - Update user role (admin only)
- `GET /api/auth/users` - List all users (admin only)

### Example Usage

```javascript
// Get Google auth URL
const response = await fetch('http://localhost:5001/api/auth/google/url');
const { auth_url } = await response.json();

// Get current user
const response = await fetch('http://localhost:5001/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const user = await response.json();
```

## User Roles

- **customer**: Default role for new users, can access customer interface
- **cashier**: Can access cashier POS interface
- **manager**: Can access manager dashboard
- **admin**: Full access, can manage user roles

## Security Features

- OAuth 2.0 authorization code flow
- State parameter for CSRF protection
- Session tokens with 7-day expiration
- Secure session storage (use Redis in production)
- Email verification through Google
- Role-based access control

## Production Considerations

1. **Session Storage**: Replace in-memory session storage with Redis
   ```python
   import redis
   redis_client = redis.Redis(host='localhost', port=6379, db=0)
   ```

2. **HTTPS**: Use HTTPS in production for secure token transmission

3. **Environment Variables**: Store sensitive credentials in secure environment variable management (e.g., AWS Secrets Manager, HashiCorp Vault)

4. **Rate Limiting**: Add rate limiting to prevent abuse

5. **Session Timeout**: Configure appropriate session timeout based on security requirements

6. **Logging**: Add audit logging for authentication events

## Troubleshooting

### "Google OAuth not configured" Error
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart the backend server after updating environment variables

### "Invalid redirect URI" Error
- Check that the redirect URI in Google Cloud Console matches `GOOGLE_REDIRECT_URI` in `.env`
- Ensure the URI is exactly the same (including protocol and port)

### User Role Not Applied
- Check that the user exists in the database
- Use the admin endpoint to update user roles
- Verify the user is logging in with the correct email

### Session Expired
- Sessions expire after 7 days
- Ask the user to log in again
- Consider implementing refresh tokens for longer sessions

## Support

For issues or questions:
1. Check the backend logs for detailed error messages
2. Verify Google Cloud Console configuration
3. Ensure database tables are created correctly
4. Test with a simple OAuth flow outside the application
