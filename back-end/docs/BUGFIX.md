# Bug Fix: FLASK_ENV Environment Variable Handling

## Issue

```
ValueError: Unknown env_name: development
```

**Error occurred when**: Running `uv run main.py` or `python main.py`

**Root cause**: The `.env` file contained `FLASK_ENV=development`, but `main.py` only recognized `"production"` and defaulted to `"dev"`. It didn't handle the full word `"development"`.

## Solution

Updated `main.py` to normalize common Flask environment names:

### Before
```python
env_name = os.getenv("FLASK_ENV", "dev")
if env_name == "production":
    env_name = "prod"
```

### After
```python
env_name = os.getenv("FLASK_ENV", "dev").lower()
if env_name in ("production", "prod"):
    env_name = "prod"
elif env_name in ("development", "dev"):
    env_name = "dev"
else:
    print(f"Warning: Unknown FLASK_ENV '{env_name}', defaulting to 'dev'")
    env_name = "dev"
```

## What Changed

1. **Added `.lower()`** - Handles any case: `Development`, `DEVELOPMENT`, `development`
2. **Tuple matching** - Recognizes both short and long forms: `dev`, `development`, `prod`, `production`
3. **Fallback handling** - Unknown values default to `dev` with a warning

## Recognized Values

| Input | Normalized To |
|-------|---------------|
| `development`, `Development`, `DEVELOPMENT` | `dev` |
| `dev`, `Dev`, `DEV` | `dev` |
| `production`, `Production`, `PRODUCTION` | `prod` |
| `prod`, `Prod`, `PROD` | `prod` |
| Any other value | `dev` (with warning) |

## Testing

All environment variations now work correctly:

```bash
# All these work:
FLASK_ENV=development python main.py
FLASK_ENV=dev python main.py
FLASK_ENV=production python main.py
FLASK_ENV=prod python main.py

# Unknown values default to dev with warning:
FLASK_ENV=staging python main.py
# Output: Warning: Unknown FLASK_ENV 'staging', defaulting to 'dev'
```

## Files Modified

- `back-end/main.py` - Fixed environment normalization logic
- `back-end/.env.example` - Added comment clarifying valid values

## Impact

✅ **Zero breaking changes** - All existing configurations still work
✅ **More flexible** - Now accepts Flask's standard `development`/`production` names
✅ **Better error handling** - Unknown values default to `dev` instead of crashing
✅ **Case insensitive** - Works with any capitalization

## How to Use

Simply run the application normally:

```bash
python main.py
```

Or with uv:

```bash
uv run main.py
```

The app will automatically:
1. Load `.env` file
2. Normalize `FLASK_ENV=development` to `dev`
3. Connect to PostgreSQL using credentials from `.env`
4. Start on port 5001

## Verification

Run the application and you should see:
```
✓ Connected to PostgreSQL (using existing schema)
* Running on http://0.0.0.0:5001
```

Instead of the previous error:
```
ValueError: Unknown env_name: development ❌
```
