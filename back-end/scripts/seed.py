from app import create_app
from app.db import db
from app.db.seed import clear_all, seed

app = create_app('dev')
with app.app_context():
    db.create_all()
    clear_all()
    seed()
    print("DB ready & seeded")
