from flask import Blueprint, jsonify, request
from app.utils.errors import BadRequestError
import requests

translate_bp = Blueprint("translate", __name__)

# MyMemory Translation API (Free, no API key required)
MYMEMORY_API_URL = "https://api.mymemory.translated.net/get"

@translate_bp.post("")
@translate_bp.post("/")
def translate_text():
    """
    Translation endpoint using MyMemory Translation API (free).

    Request body:
    {
        "text": "Text to translate",
        "target": "es" (optional, defaults to Spanish),
        "source": "en" (optional, defaults to English)
    }

    Response:
    {
        "translated": "Translated text",
        "source_language": "en",
        "target_language": "es"
    }
    """
    data = request.get_json()

    if not data:
        raise BadRequestError("Request body is required")

    text = data.get("text")
    target = data.get("target", "es")
    source = data.get("source", "en")

    if not text:
        raise BadRequestError("'text' field is required")

    try:
        # Call MyMemory Translation API
        params = {
            "q": text,
            "langpair": f"{source}|{target}"
        }

        response = requests.get(MYMEMORY_API_URL, params=params, timeout=5)
        response.raise_for_status()

        result = response.json()

        # Check if translation was successful
        if result.get("responseStatus") == 200 or result.get("responseData"):
            translated_text = result["responseData"]["translatedText"]

            return jsonify({
                "translated": translated_text,
                "source_language": source,
                "target_language": target
            }), 200
        else:
            error_msg = result.get("responseDetails", "Translation failed")
            print(f"Translation API error: {error_msg}")
            raise BadRequestError(f"Translation failed: {error_msg}")

    except requests.exceptions.Timeout:
        error_msg = "Translation API request timed out"
        print(f"ERROR: {error_msg}")
        raise BadRequestError(error_msg)
    except requests.exceptions.RequestException as e:
        error_msg = f"Translation API request failed: {str(e)}"
        print(f"ERROR: {error_msg}")
        raise BadRequestError(error_msg)
    except Exception as e:
        error_msg = f"Unexpected error during translation: {str(e)}"
        print(f"ERROR: {error_msg}")
        raise BadRequestError(error_msg)
