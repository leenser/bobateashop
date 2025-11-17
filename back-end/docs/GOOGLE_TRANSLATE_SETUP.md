# Google Translate API Setup Guide

## Overview

The translation feature uses Google Cloud Translation API to translate all product names, descriptions, and UI elements from English to Spanish dynamically.

## Features

✅ **Google Translate API Integration** - Uses official Google Cloud Translation API
✅ **Automatic Fallback** - Works without API for development with built-in dictionary
✅ **Caching** - Translations are cached to minimize API calls
✅ **Batch Translation** - Preloads all product translations when switching languages
✅ **Real-time Updates** - UI updates automatically as translations load

## Setup Options

### Option 1: Using Google Translate API (Production)

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID (e.g., `my-tea-pos-project`)

#### Step 2: Enable Translation API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Cloud Translation API"
3. Click **Enable**

#### Step 3: Create Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the service account details:
   - Name: `translation-service`
   - Description: `Service account for POS translation`
4. Click **Create and Continue**
5. Grant role: **Cloud Translation API User**
6. Click **Done**

#### Step 4: Generate JSON Key

1. Find your service account in the list
2. Click on the service account name
3. Go to **Keys** tab
4. Click **Add Key** > **Create New Key**
5. Select **JSON** format
6. Click **Create**
7. Save the JSON file securely (e.g., `google-credentials.json`)

#### Step 5: Configure Backend

Add to `back-end/.env`:

```bash
# Google Translate API - Service Account Method (Recommended)
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/google-credentials.json
```

**Important:** Use absolute path, not relative!

Example:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/Users/yourname/project3/back-end/google-credentials.json
```

#### Step 6: Install Dependencies

```bash
cd back-end
uv sync  # or pip install -r requirements.txt
```

#### Step 7: Test

```bash
cd back-end
uv run main.py
```

You should see:
```
✓ Connected to PostgreSQL (using existing schema)
 * Running on http://0.0.0.0:5001
```

Test the translation endpoint:
```bash
curl -X POST http://localhost:5001/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Brown Sugar Milk Tea", "target": "es"}'
```

Expected response:
```json
{
  "translated": "Té con Leche de Azúcar Morena",
  "source_language": "en",
  "target_language": "es",
  "using_google_api": true
}
```

### Option 2: Using gcloud CLI (Alternative)

If you have `gcloud` CLI installed and authenticated:

1. Authenticate with Google Cloud:
   ```bash
   gcloud auth application-default login
   ```

2. Add to `back-end/.env`:
   ```bash
   GOOGLE_CLOUD_PROJECT=your-project-id
   ```

3. The API will use your authenticated credentials automatically

### Option 3: Development Mode (No API Required)

If neither Google credential is set, the app uses a built-in dictionary with common tea product terms:

- ✅ Works immediately without setup
- ✅ Handles common product names (Brown Sugar, Matcha, Taro, etc.)
- ✅ Word-by-word fallback for compound names
- ❌ Limited to predefined translations

**No configuration needed** - just run the app!

## How It Works

### Backend (`/api/translate`)

1. **Checks for Google API credentials**
   - `GOOGLE_APPLICATION_CREDENTIALS` (service account JSON)
   - `GOOGLE_CLOUD_PROJECT` (gcloud auth)

2. **If Google API is configured:**
   - Uses official Google Cloud Translation API
   - Returns: `{"using_google_api": true}`

3. **If no credentials:**
   - Uses built-in dictionary with 30+ tea terms
   - Word-by-word translation for compound names
   - Returns: `{"using_google_api": false}`

### Frontend Translation Flow

1. **User clicks "Español" button**
2. **Preload Phase:**
   - Fetches all products from database
   - Sends each product name + description to backend API
   - Caches all translations

3. **Render Phase:**
   - Products initially show in English
   - As translations load, UI updates automatically
   - Cached translations are instant on subsequent renders

4. **Switching back to English:**
   - Instant (no API calls needed)

## API Costs

Google Cloud Translation API pricing (as of 2024):

- **Free Tier:** 500,000 characters/month
- **Paid:** $20 per 1 million characters

**Example calculation:**
- 50 products × 30 characters average = 1,500 characters
- 1,000 customer sessions = 1,500,000 characters
- **Cost:** ~$3/month for 1,000 sessions

**Caching reduces costs:**
- First translation: API call
- Subsequent: Served from cache (free)

## Troubleshooting

### Error: "Could not initialize Google Translate client"

**Solution:**
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path is absolute
- Check the JSON file exists and is readable
- Ensure Translation API is enabled in Google Cloud

### Error: "Permission denied"

**Solution:**
- Verify service account has "Cloud Translation API User" role
- Check project billing is enabled
- Ensure API is enabled for the project

### Translations not appearing

**Check:**
1. Backend is running on port 5001
2. No CORS errors in browser console
3. Check backend logs for translation API errors
4. Verify `using_google_api` in API response

**Test endpoint directly:**
```bash
curl -X POST http://localhost:5001/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Test", "target": "es"}'
```

### Fallback dictionary not working

**Check:**
- Translation endpoint is reachable
- Check browser console for errors
- Verify product names match expected format

## Security Best Practices

### DO:
✅ Keep `google-credentials.json` outside of git
✅ Add `google-credentials.json` to `.gitignore`
✅ Use environment variables for paths
✅ Restrict service account permissions to Translation API only
✅ Rotate credentials regularly

### DON'T:
❌ Commit credentials to git
❌ Share credentials publicly
❌ Use same credentials for multiple projects
❌ Grant excessive permissions to service account

## Files Modified

### Backend
- `back-end/pyproject.toml` - Added `google-cloud-translate>=3.11.0`
- `back-end/app/routes/translate_routes.py` - Implemented Google Translate API
- `back-end/.env.example` - Added Google API configuration

### Frontend
- `front-end/src/i18n/productTranslations.ts` - Dynamic API-based translation
- `front-end/src/i18n/translateToSpanish.ts` - Preloads all translations
- `front-end/src/pages/CustomerInterface.tsx` - Listens for translation updates

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Translation endpoint responds: `POST /api/translate`
- [ ] `using_google_api` is `true` (if configured) or `false` (fallback)
- [ ] Click "Español" button in Customer Interface
- [ ] All product names translate
- [ ] All product descriptions translate
- [ ] Categories translate
- [ ] UI elements translate (Cart, Checkout, etc.)
- [ ] Click "English" button - everything reverts
- [ ] No console errors

## Support

### Google Cloud Documentation
- [Translation API Quickstart](https://cloud.google.com/translate/docs/quickstarts)
- [Authentication Guide](https://cloud.google.com/docs/authentication)
- [Pricing Calculator](https://cloud.google.com/products/calculator)

### Common Issues
- [Service Account Setup](https://cloud.google.com/iam/docs/creating-managing-service-accounts)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)

## Next Steps

1. **Set up Google Cloud Project** (15 minutes)
2. **Enable Translation API** (2 minutes)
3. **Create Service Account** (5 minutes)
4. **Download JSON key** (1 minute)
5. **Configure `.env` file** (2 minutes)
6. **Test translation** (5 minutes)

**Total setup time: ~30 minutes**

Or just run in development mode with built-in dictionary - works immediately! 🚀
