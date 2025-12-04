from flask import Flask
from .config import get_config
from .routes.products_routes import products_bp
from .routes.inventory_routes import inventory_bp
from .routes.employees_routes import employees_bp
from .routes.orders_routes import orders_bp
from .routes.reports_routes import reports_bp
from .routes.meta_routes import meta_bp
from .routes.translate_routes import translate_bp
from .routes.auth_routes import auth_bp
from .utils.errors import register_error_handlers
from .db import init_db
from flask_cors import CORS

def create_app(env_name: str = "dev"):
    app = Flask(__name__)
    app.config.from_mapping(get_config(env_name))
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # initialize db (engine/session etc.)
    init_db(app)

    # register blueprints under /api/*
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(employees_bp, url_prefix="/api/employees")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(meta_bp, url_prefix="/api/meta")
    app.register_blueprint(translate_bp, url_prefix="/api/translate")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    # centralize error -> JSON
    register_error_handlers(app)

    # Add root route for health check
    @app.route('/')
    def root():
        return {"ok": True, "message": "KungFu Tea POS API is running", "version": "1.0"}, 200

    return app