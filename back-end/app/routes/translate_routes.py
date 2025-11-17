from flask import Blueprint, jsonify, request
from app.utils.errors import BadRequestError

translate_bp = Blueprint("translate", __name__)

@translate_bp.post("/")
def translate():
    """
    Simple translation endpoint that returns the text as-is.
    In production, this would integrate with Google Translate API or similar.
    For now, it just echoes back the text to allow the frontend to work.
    """
    data = request.get_json()

    if not data:
        raise BadRequestError("Request body is required")

    text = data.get("text")
    target = data.get("target", "es")

    if not text:
        raise BadRequestError("'text' field is required")

    # For now, just return the original text
    # In production, you would call a translation API here
    return jsonify({
        "translated": text,
        "source_language": "en",
        "target_language": target
    }), 200
