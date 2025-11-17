from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        from . import models  # make sure models are registered

        # Only create tables if using SQLite (local dev fallback)
        # PostgreSQL tables should already exist from Java schema
        if "sqlite" in app.config.get("SQLALCHEMY_DATABASE_URI", ""):
            db.create_all()
            print("✓ SQLite tables created/verified")
        else:
            print("✓ Connected to PostgreSQL (using existing schema)")