# Testing Authentication Flow

This guide helps you test the newly implemented Google OAuth authentication system.

## Prerequisites

Before testing, ensure you have:

1. ✅ Google OAuth credentials configured in `.env`
2. ✅ Database migrations applied (`001_create_users_table.sql`)
3. ✅ Backend server running on port 5001
4. ✅ Frontend development server running on port 5173

## Quick Test Steps

### 1. Verify Backend Setup

```bash
# Test that the backend is running
curl http://localhost:5001/

# Should return:
# {"ok": true, "message": "KungFu Tea POS API is running", "version": "1.0"}

# Test OAuth URL endpoint
curl http://localhost:5001/api/auth/google/url

# Should return something like:
# {
#   "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
#   "state": "some-random-state-token"
# }
```

### 2. Test Frontend Login Flow

1. Navigate to `http://localhost:5173/login`
2. Click "Sign in with Google"
3. You should be redirected to Google's login page
4. Sign in with `reveille.bubbletea@gmail.com` (or any Google account)
5. Grant permissions
6. You should be redirected back to the app

### 3. Verify User Creation

After successful login, check the database:

```sql
-- View all users
SELECT * FROM users;

-- Check specific user
SELECT email, name, role, is_active, created_at
FROM users
WHERE email = 'reveille.bubbletea@gmail.com';
```

### 4. Test Role-Based Access

The user role determines which interface they see:

- **admin/manager**: Redirected to `/manager`
- **cashier**: Redirected to `/cashier`
- **customer**: Redirected to `/customer`

To test different roles:

```sql
-- Update user role
UPDATE users
SET role = 'manager'
WHERE email = 'reveille.bubbletea@gmail.com';

-- Then log out and log back in to see the change
```

### 5. Test API Endpoints

```bash
# First, get a session token by logging in through the UI
# Then copy the token from localStorage (dev tools > Application > Local Storage)

# Get current user
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5001/api/auth/me

# List all users (admin only)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5001/api/auth/users

# Update user role (admin only)
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"role": "manager"}' \
  http://localhost:5001/api/auth/users/1/role

# Logout
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5001/api/auth/logout
```

## Test Scenarios

### Scenario 1: First-Time User Login

**Steps:**
1. Use a Google account that hasn't logged in before
2. Click "Sign in with Google"
3. Complete OAuth flow

**Expected Result:**
- New user created in database with role='customer'
- User redirected to `/customer` interface
- Session token stored in localStorage

**Verify:**
```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 1;
```

### Scenario 2: Returning User Login

**Steps:**
1. Use a Google account that has logged in before
2. Click "Sign in with Google"
3. Complete OAuth flow

**Expected Result:**
- User's `last_login` timestamp updated
- User sees appropriate interface based on their role
- Previous session invalidated, new session created

**Verify:**
```sql
SELECT email, last_login, created_at
FROM users
WHERE email = 'your-test-email@gmail.com';
```

### Scenario 3: Role Change

**Steps:**
1. Login as admin
2. Update another user's role via API
3. Have that user logout and login again

**Expected Result:**
- User's role updated in database
- User sees new interface after re-login

**Verify:**
```bash
# As admin
curl -X PUT \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "cashier"}' \
  http://localhost:5001/api/auth/users/USER_ID/role
```

### Scenario 4: Session Expiration

**Steps:**
1. Login and get a session token
2. Manually modify session expiration in code (for testing)
3. Try to access protected endpoint

**Expected Result:**
- 401 Unauthorized error
- User redirected to login

### Scenario 5: Logout Flow

**Steps:**
1. Login successfully
2. Click logout (or call logout endpoint)
3. Try to access protected page

**Expected Result:**
- Session invalidated
- localStorage cleared
- User redirected to `/login`

## Testing reveille.bubbletea@gmail.com

This email has been pre-configured with admin privileges:

1. **Login**: Navigate to `http://localhost:5173/login`
2. **Sign in**: Click "Sign in with Google"
3. **Authenticate**: Use reveille.bubbletea@gmail.com
4. **Verify Admin Access**:
   - Should be redirected to `/manager`
   - Should see manager dashboard
   - Can access user management endpoints

```sql
-- Verify admin status
SELECT email, role, is_active
FROM users
WHERE email = 'reveille.bubbletea@gmail.com';
-- Should show role='admin'
```

## Common Issues

### Issue: "Google OAuth not configured"

**Cause**: Missing environment variables

**Solution**:
```bash
# Check .env file
cat back-end/.env | grep GOOGLE

# Should show:
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Issue: "Invalid redirect URI"

**Cause**: Mismatch between Google Console and app config

**Solution**:
1. Check Google Cloud Console > Credentials
2. Verify authorized redirect URIs includes exact URL
3. Ensure no trailing slash differences

### Issue: "Invalid state parameter"

**Cause**: State mismatch (possible CSRF attempt or cleared storage)

**Solution**:
1. Clear localStorage
2. Try login flow again
3. Don't navigate away during OAuth flow

### Issue: User created but role not applied

**Cause**: Race condition or database constraint

**Solution**:
```sql
-- Manually set role
UPDATE users
SET role = 'admin'
WHERE email = 'reveille.bubbletea@gmail.com';
```

### Issue: 401 Unauthorized on API calls

**Cause**: Invalid or expired session token

**Solution**:
1. Check Authorization header format: `Bearer <token>`
2. Verify token in localStorage matches session
3. Try logging out and in again

## Performance Testing

### Load Test Session Creation

```bash
# Install Apache Bench (if not already installed)
# brew install httpd (macOS)

# Test auth URL endpoint
ab -n 100 -c 10 http://localhost:5001/api/auth/google/url

# Expected: <100ms per request
```

### Database Performance

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'test@example.com';

-- Should use index idx_users_email
```

## Security Testing

### Test 1: CSRF Protection

Verify state parameter is properly validated:

```bash
# Try to use wrong state parameter
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"code": "some-code", "state": "wrong-state"}' \
  http://localhost:5001/api/auth/google/callback

# Expected: Error about invalid state
```

### Test 2: Token Validation

```bash
# Try to use invalid token
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:5001/api/auth/me

# Expected: 401 Unauthorized
```

### Test 3: Role Escalation Prevention

```bash
# Try to update own role as non-admin
curl -X PUT \
  -H "Authorization: Bearer NON_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}' \
  http://localhost:5001/api/auth/users/OWN_USER_ID/role

# Expected: 401 Unauthorized
```

## Automated Testing

Create test scripts for CI/CD:

```bash
#!/bin/bash
# test_auth.sh

# Test backend health
curl -f http://localhost:5001/ || exit 1

# Test OAuth URL generation
curl -f http://localhost:5001/api/auth/google/url || exit 1

echo "Basic auth tests passed!"
```

## Next Steps

After testing:

1. ✅ Verify all test scenarios pass
2. ✅ Document any issues found
3. ✅ Add automated tests
4. ✅ Configure production OAuth credentials
5. ✅ Set up monitoring and logging
6. ✅ Implement session storage with Redis (for production)

## Support

If you encounter issues:

1. Check backend logs for detailed error messages
2. Inspect browser console for frontend errors
3. Verify database state with SQL queries
4. Review `AUTHENTICATION_SETUP.md` for configuration details
