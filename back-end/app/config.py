import os

def get_config(env_name: str):
    # Get PostgreSQL connection details from environment or use defaults
    # These credentials should match your team's database setup
    db_host = os.getenv("DB_HOST", "csce-315-db.engr.tamu.edu")
    db_name = os.getenv("DB_NAME", "gang_81_db")
    db_user = os.getenv("DB_USER", "")  # Set via environment variable
    db_password = os.getenv("DB_PASSWORD", "")  # Set via environment variable

    # For backwards compatibility, allow explicit DATABASE_URL override
    database_url = os.getenv("DATABASE_URL")

    if env_name == "dev":
        # Use PostgreSQL for development (matching Java implementation)
        if not database_url:
            if db_user and db_password:
                database_url = f"postgresql://{db_user}:{db_password}@{db_host}/{db_name}"
            else:
                # Fallback to SQLite for local development if no credentials provided
                database_url = "sqlite:///pos_dev.db"

        return {
            "SQLALCHEMY_DATABASE_URI": database_url,
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
            "SQLALCHEMY_ENGINE_OPTIONS": {
                "pool_pre_ping": True,  # Verify connections before using
                "pool_recycle": 300,  # Recycle connections after 5 minutes
            }
        }

    # prod example -> use Postgres (matches Java's Postgres idea)
    if env_name == "prod":
        if not database_url:
            if db_user and db_password:
                database_url = f"postgresql://{db_user}:{db_password}@{db_host}/{db_name}"
            else:
                raise ValueError("Database credentials not provided. Set DB_USER and DB_PASSWORD environment variables.")

        return {
            "SQLALCHEMY_DATABASE_URI": database_url,
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
            "SQLALCHEMY_ENGINE_OPTIONS": {
                "pool_pre_ping": True,
                "pool_recycle": 300,
                "pool_size": 10,
                "max_overflow": 20,
            }
        }

    raise ValueError(f"Unknown env_name: {env_name}")