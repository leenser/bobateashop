from app import create_app
import os

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed. Environment variables from .env will not be loaded.")
    print("Install with: pip install python-dotenv")

# Get environment from ENV variable, default to dev
# Normalize common environment names to "dev" or "prod"
env_name = os.getenv("FLASK_ENV", "dev").lower()
if env_name in ("production", "prod"):
    env_name = "prod"
elif env_name in ("development", "dev"):
    env_name = "dev"
else:
    # If unrecognized, default to dev
    print(f"Warning: Unknown FLASK_ENV '{env_name}', defaulting to 'dev'")
    env_name = "dev"

app = create_app(env_name=env_name)

if __name__ == "__main__":
    # debug True for dev so React can talk to it easily
    # Use port 5001 to avoid conflict with macOS AirPlay on port 5000
    port = int(os.getenv("PORT", 5001))
    debug = env_name == "dev"
    app.run(host="0.0.0.0", port=port, debug=debug)