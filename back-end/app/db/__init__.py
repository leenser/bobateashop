from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    # in dev, we can create tables automatically
    with app.app_context():
        from . import models  # make sure models are registered
        db.create_all()