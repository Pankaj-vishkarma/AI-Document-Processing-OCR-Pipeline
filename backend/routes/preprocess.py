from flask import Blueprint
from flask import jsonify
from flask import request

from models.document_model import Document
from models.database import db

from services.image_preprocessor import (
    ImagePreprocessor,
)

from middlewares.auth_middleware import (
    auth_required,
)

preprocess_bp = Blueprint(
    "preprocess",
    __name__,
)

preprocessor = ImagePreprocessor()


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

        options = data.get(
            "options",
            {},
        )

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

        preprocess_result = preprocessor.preprocess_image(
            document.upload_path,
            options,
        )

        document.preprocessed_path = preprocess_result["processed_path"]

        document.preprocessing_options = options

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "original_image": document.upload_path,
                "processed_image": preprocess_result["processed_path"],
                "options": options,
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
    "/api/preprocess/apply",
    methods=["POST"],
)
@auth_required()
def apply_preprocessing(
    current_user_id,
):

    try:

        data = request.get_json()

        document_id = data.get("document_id")

        options = data.get(
            "options",
            {},
        )

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

        preprocess_result = preprocessor.preprocess_image(
            document.upload_path,
            options,
        )

        document.preprocessed_path = preprocess_result["processed_path"]

        document.preprocessing_options = options

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Preprocessing applied",
                "processed_image": preprocess_result["processed_path"],
                "options": options,
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
