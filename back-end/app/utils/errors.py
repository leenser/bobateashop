from flask import jsonify

class NotFoundError(Exception):
    """Raise this in services when something (like a product or cashier) isn't found."""
    pass

class BadRequestError(Exception):
    """Raise this in services when the client sent invalid or missing data."""
    pass

def register_error_handlers(app):
    # 404-style business errors from our code
    @app.errorhandler(NotFoundError)
    def handle_not_found(err):
        return jsonify({
            "error": "not_found",
            "message": str(err),
        }), 404

    # 400-style validation / bad input errors
    @app.errorhandler(BadRequestError)
    def handle_bad_request(err):
        return jsonify({
            "error": "bad_request",
            "message": str(err),
        }), 400

    # Catch-all safety net so React always gets JSON, not an HTML traceback
    @app.errorhandler(Exception)
    def handle_generic_error(err):
        # For debugging during dev, it's nice to see the actual exception in terminal:
        print("UNHANDLED EXCEPTION:", repr(err))

        return jsonify({
            "error": "internal_error",
            "message": "internal server error",
        }), 500
