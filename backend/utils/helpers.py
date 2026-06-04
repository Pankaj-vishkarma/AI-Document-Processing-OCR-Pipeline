import os
import ast
import json
import re
import uuid
import unicodedata
from copy import deepcopy

from flask import jsonify

from utils.constants import ALLOWED_EXTENSIONS
from utils.logger import logger


def allowed_file(filename):
    if "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_EXTENSIONS


def generate_unique_filename(filename):
    extension = filename.rsplit(".", 1)[1].lower()

    unique_name = f"{uuid.uuid4()}.{extension}"

    return unique_name


def get_file_extension(filename):
    return filename.rsplit(".", 1)[1].lower()


def normalize_text(text, replace_pipe=False):

    if text is None:

        return ""

    normalized_text = unicodedata.normalize("NFKC", str(text))

    devanagari_digits = str.maketrans(
        {
            "०": "0",
            "१": "1",
            "२": "2",
            "३": "3",
            "४": "4",
            "५": "5",
            "६": "6",
            "७": "7",
            "८": "8",
            "९": "9",
        }
    )

    normalized_text = normalized_text.translate(devanagari_digits)
    normalized_text = normalized_text.replace("／", "/")
    normalized_text = normalized_text.replace("–", "-")
    normalized_text = normalized_text.replace("—", "-")
    normalized_text = normalized_text.replace("−", "-")
    normalized_text = normalized_text.replace("“", '"')
    normalized_text = normalized_text.replace("”", '"')
    normalized_text = normalized_text.replace("’", "'")
    normalized_text = normalized_text.replace("`", "'")

    if replace_pipe:

        normalized_text = normalized_text.replace("|", "I")

    normalized_text = re.sub(r"[^\x00-\x7F]", "", normalized_text)
    normalized_text = re.sub(r"\s+", " ", normalized_text)

    return normalized_text.strip()


def parse_json_response(response_text, fallback=None):

    if isinstance(response_text, dict):

        return response_text

    if isinstance(response_text, list):

        return response_text

    text = "" if response_text is None else str(response_text)

    text = text.strip()

    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    if not text:

        return deepcopy(fallback) if fallback is not None else {}

    candidate_texts = [text]

    object_start = text.find("{")
    object_end = text.rfind("}")

    if object_start != -1 and object_end != -1 and object_end > object_start:

        candidate_texts.append(text[object_start : object_end + 1])

    array_start = text.find("[")
    array_end = text.rfind("]")

    if array_start != -1 and array_end != -1 and array_end > array_start:

        candidate_texts.append(text[array_start : array_end + 1])

    for candidate in candidate_texts:

        candidate = candidate.strip()

        try:

            parsed = json.loads(candidate)

            if isinstance(parsed, str):

                return parse_json_response(parsed, fallback=fallback)

            return parsed

        except Exception:

            try:

                parsed = ast.literal_eval(candidate)

                if isinstance(parsed, str):

                    return parse_json_response(parsed, fallback=fallback)

                return parsed

            except Exception:

                continue

    return deepcopy(fallback) if fallback is not None else {}


def get_document_or_404(document_id, user_id):

    from flask import jsonify

    from models.document_model import Document

    document = Document.query.filter_by(id=document_id, user_id=user_id).first()

    if not document:

        return (
            None,
            jsonify({"success": False, "message": "Document not found"}),
            404,
        )

    return document, None, None


def handle_server_error(error, message="Internal server error"):

    logger.exception(message, exc_info=error)

    try:
        import traceback

        traceback.print_exception(type(error), error, error.__traceback__)
    except Exception:
        pass

    return jsonify({"success": False, "message": message}), 500
