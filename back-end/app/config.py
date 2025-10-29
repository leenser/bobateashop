import os

def get_config(env_name: str):
    # later you can branch by env_name if you want sqlite for dev and postgres for prod
    if env_name == "dev":
        return {
            "SQLALCHEMY_DATABASE_URI": os.getenv(
                "DATABASE_URL",
                "sqlite:///pos_dev.db"  # local default (like Java's sqlite mode)
            ),
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        }

    # prod example -> use Postgres (matches Java's Postgres idea)
    if env_name == "prod":
        return {
            "SQLALCHEMY_DATABASE_URI": os.getenv(
                "DATABASE_URL",
                "postgresql://user:pass@host:5432/boba_pos"
            ),
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        }

    raise ValueError(f"Unknown env_name: {env_name}")