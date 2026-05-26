from flask import Blueprint
from flask import jsonify
from flask import request
import os

from models.document_model import Document
from models.database import db

from services.image_preprocessor import (
    ImagePreprocessor,
)
from services.ocr_engine import OCREngine
from services.pdf_processor import PDFProcessor

from middlewares.auth_middleware import (
    auth_required,
)

preprocess_bp = Blueprint(
    "preprocess",
    __name__,
)

preprocessor = ImagePreprocessor()
ocr_engine = OCREngine()
pdf_processor = PDFProcessor()


def _public_upload_image(document):

    if document.filename:

        return f"/uploads/{document.filename}"

    if document.upload_path:

        return f"/uploads/{os.path.basename(document.upload_path)}"

    return ""


def _public_processed_image(processed_path):

    if not processed_path:

        return ""

    normalized_processed_path = str(processed_path).replace("\\", "/")

    return f"/processed/{os.path.basename(normalized_processed_path)}"


def _get_source_image_path(document):

    if not document:

        return None

    if document.file_type and document.file_type.lower() == "pdf":

        pdf_pages = pdf_processor.convert_pdf_to_images(document.upload_path)

        if not pdf_pages:

            return None

        return pdf_pages[0]["image_path"]

    return document.upload_path


def _public_source_image(document, source_path):

    if not source_path:

        return ""

    if document.file_type and document.file_type.lower() == "pdf":

        return _public_processed_image(source_path)

    return _public_upload_image(document)


def _get_options(data):

    options = data.get("options") or {}

    return options or preprocessor.get_default_options()


def _serialize_response(
    document, preprocess_result, include_ocr=False, ocr_result=None
):

    response = {
        "success": True,
        "original_image": _public_source_image(
            document,
            preprocess_result.get("source_path"),
        ),
        "processed_image": _public_processed_image(preprocess_result["processed_path"]),
        "options": preprocess_result["preprocessing_options"],
        "resolution": preprocess_result.get("resolution_info"),
    }

    if include_ocr and ocr_result is not None:

        response.update(
            {
                "ocr_text": ocr_result.get("full_text", ""),
                "ocr_coordinates": ocr_result.get("results", []),
                "average_confidence": ocr_result.get("average_confidence", 0),
                "total_text_regions": ocr_result.get("total_text_regions", 0),
            }
        )

    return response


@preprocess_bp.route(
    "/api/preprocess/source/<int:document_id>",
    methods=["GET"],
)
@auth_required()
def get_preprocessing_source(
    current_user_id,
    document_id,
):

    try:

        document = Document.query.filter_by(
            id=document_id,
            user_id=current_user_id,
        ).first()

        if not document:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Document not found",
                    }
                ),
                404,
            )

        source_path = _get_source_image_path(document)

        if not source_path:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Source image not available",
                    }
                ),
                400,
            )

        return jsonify(
            {
                "success": True,
                "source_image": _public_source_image(document, source_path),
                "source_path": source_path,
            }
        )

    except Exception as error:

        return (
            jsonify(
                {
                    "success": False,
                    "message": str(error),
                }
            ),
            500,
        )


@preprocess_bp.route(
    "/api/preprocess/preview",
    methods=["POST"],
)
@auth_required()
def preview_preprocessing(
    current_user_id,
):

    try:

        data = request.get_json()

        if not data:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Request body missing",
                    }
                ),
                400,
            )

        document_id = data.get("document_id")

        options = _get_options(data)

        if not document_id:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "document_id required",
                    }
                ),
                400,
            )

        document = Document.query.filter_by(
            id=document_id,
            user_id=current_user_id,
        ).first()

        if not document:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Document not found",
                    }
                ),
                404,
            )

        source_path = _get_source_image_path(document)

        if not source_path:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Source image not available",
                    }
                ),
                400,
            )

        preprocess_result = preprocessor.preprocess_image(
            source_path,
            options,
        )

        preprocess_result["source_path"] = source_path

        document.preprocessed_path = preprocess_result["processed_path"]

        document.preprocessing_options = options

        db.session.commit()

        return jsonify(_serialize_response(document, preprocess_result))

    except Exception as error:

        return (
            jsonify(
                {
                    "success": False,
                    "message": str(error),
                }
            ),
            500,
        )


@preprocess_bp.route(
    "/api/preprocess/apply",
    methods=["POST"],
)
@auth_required()
def apply_preprocessing(
    current_user_id,
):

    try:

        data = request.get_json()

        if not data:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Request body missing",
                    }
                ),
                400,
            )

        document_id = data.get("document_id")

        options = _get_options(data)

        if not document_id:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "document_id required",
                    }
                ),
                400,
            )

        document = Document.query.filter_by(
            id=document_id,
            user_id=current_user_id,
        ).first()

        if not document:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Document not found",
                    }
                ),
                404,
            )

        source_path = _get_source_image_path(document)

        if not source_path:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Source image not available",
                    }
                ),
                400,
            )

        preprocess_result = preprocessor.preprocess_image(
            source_path,
            options,
        )

        preprocess_result["source_path"] = source_path

        document.preprocessed_path = preprocess_result["processed_path"]

        document.preprocessing_options = options

        db.session.commit()

        return jsonify(
            {
                **_serialize_response(document, preprocess_result),
                "message": "Preprocessing applied",
            }
        )

    except Exception as error:

        return (
            jsonify(
                {
                    "success": False,
                    "message": str(error),
                }
            ),
            500,
        )


@preprocess_bp.route(
    "/api/preprocess/reprocess",
    methods=["POST"],
)
@auth_required()
def reprocess_preprocessing(
    current_user_id,
):

    try:

        data = request.get_json()

        if not data:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Request body missing",
                    }
                ),
                400,
            )

        document_id = data.get("document_id")

        options = _get_options(data)

        if not document_id:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "document_id required",
                    }
                ),
                400,
            )

        document = Document.query.filter_by(
            id=document_id,
            user_id=current_user_id,
        ).first()

        if not document:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Document not found",
                    }
                ),
                404,
            )

        source_path = _get_source_image_path(document)

        if not source_path:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Source image not available",
                    }
                ),
                400,
            )

        preprocess_result = preprocessor.preprocess_image(
            source_path,
            options,
        )

        preprocess_result["source_path"] = source_path

        ocr_result = ocr_engine.extract_text(
            preprocess_result["processed_path"],
        )

        document.preprocessed_path = preprocess_result["processed_path"]
        document.preprocessing_options = options
        document.processed_path = preprocess_result["processed_path"]
        document.ocr_text = ocr_result.get("full_text", "")
        document.ocr_coordinates = ocr_result.get("results", [])
        document.extracted_data = {
            "raw_text": ocr_result.get("full_text", ""),
        }
        document.confidence_score = ocr_result.get("average_confidence", 0)
        document.status = "completed"

        db.session.commit()

        return jsonify(
            {
                **_serialize_response(
                    document,
                    preprocess_result,
                    include_ocr=True,
                    ocr_result=ocr_result,
                ),
                "message": "OCR reprocessed on preprocessed image",
            }
        )

    except Exception as error:

        return (
            jsonify(
                {
                    "success": False,
                    "message": str(error),
                }
            ),
            500,
        )


@preprocess_bp.route(
    "/api/preprocess/reset",
    methods=["POST"],
)
@auth_required()
def reset_preprocessing(
    current_user_id,
):

    try:

        data = request.get_json()

        document_id = data.get("document_id")

        if not document_id:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "document_id required",
                    }
                ),
                400,
            )

        document = Document.query.filter_by(
            id=document_id,
            user_id=current_user_id,
        ).first()

        if not document:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Document not found",
                    }
                ),
                404,
            )

        document.preprocessed_path = None

        document.preprocessing_options = None

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Preprocessing reset",
            }
        )

    except Exception as error:

        return (
            jsonify(
                {
                    "success": False,
                    "message": str(error),
                }
            ),
            500,
        )
