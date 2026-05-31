import os

from flask import Blueprint
from flask import request
from flask import jsonify
from werkzeug.utils import secure_filename

from config import Config

from models.database import db
from models.document_model import Document

from utils.helpers import allowed_file
from utils.helpers import generate_unique_filename
from utils.helpers import get_file_extension
from utils.helpers import handle_server_error
from utils.service_registry import get_document_classifier
from utils.service_registry import get_ocr_engine
from utils.service_registry import get_pdf_processor
from utils.rate_limiter import rate_limit
from middlewares.auth_middleware import auth_required

upload_bp = Blueprint("upload", __name__)

ocr_engine = get_ocr_engine()
classifier = get_document_classifier()
pdf_processor = get_pdf_processor()


def classify_uploaded_document(document):

    try:

        image_path = document.upload_path

        if document.file_type and document.file_type.lower() == "pdf":
            pdf_pages = pdf_processor.convert_pdf_to_images(
                document.upload_path,
                first_page_only=True,
            )
            if pdf_pages:
                image_path = pdf_pages[0].get("image_path", image_path)

        ocr_result = ocr_engine.extract_text(image_path)

        document.ocr_text = ocr_result.get("full_text", "") or ""

        classification_response = classifier.classify_document(document.ocr_text)

        document.document_type = str(
            classification_response.get("document_type", "Unknown") or "Unknown"
        )

        document.confidence_score = float(
            classification_response.get(
                "confidence_score",
                classification_response.get("confidence", 0),
            )
            or 0.0
        )

    except Exception:
        document.document_type = "Unknown"
        document.confidence_score = 0.0

    return document


@upload_bp.route("/api/upload", methods=["POST"])
@auth_required()
def upload_document(current_user_id):

    try:

        if (
            Config.MAX_CONTENT_LENGTH
            and request.content_length
            and request.content_length > Config.MAX_CONTENT_LENGTH
        ):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "File is too large",
                    }
                ),
                413,
            )

        if "file" not in request.files:
            return jsonify({"success": False, "message": "No file uploaded"}), 400

        file = request.files["file"]

        allowed_mime_types = {
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/bmp",
            "image/tiff",
        }

        if file.mimetype not in allowed_mime_types:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Unsupported file type",
                    }
                ),
                400,
            )

        file.seek(0, os.SEEK_END)

        file_size = file.tell()

        file.seek(0)

        if file_size == 0:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "File is empty",
                    }
                ),
                400,
            )

        if file.filename == "":
            return jsonify({"success": False, "message": "Filename missing"}), 400

        if not allowed_file(file.filename):
            return jsonify({"success": False, "message": "Unsupported file type"}), 400

        original_filename = secure_filename(file.filename)

        unique_filename = generate_unique_filename(original_filename)

        upload_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)

        file.save(upload_path)

        extension = get_file_extension(original_filename)

        new_document = Document(
            filename=unique_filename,
            original_filename=original_filename,
            file_type=extension,
            upload_path=upload_path,
            status="uploaded",
            user_id=current_user_id,
        )

        db.session.add(new_document)

        db.session.commit()

        classify_uploaded_document(new_document)
        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Document uploaded successfully",
                    "document": new_document.to_dict(),
                    "document_type": new_document.document_type,
                    "confidence_score": new_document.confidence_score,
                }
            ),
            201,
        )

    except Exception as error:

        return handle_server_error(error)


@upload_bp.route("/api/upload/batch", methods=["POST"])
@auth_required()
def batch_upload(current_user_id):

    try:

        if (
            Config.MAX_CONTENT_LENGTH
            and request.content_length
            and request.content_length > Config.MAX_CONTENT_LENGTH
        ):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Files are too large",
                    }
                ),
                413,
            )

        files = request.files.getlist("files")

        allowed_mime_types = {
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/bmp",
            "image/tiff",
        }

        MAX_FILES = 50

        if len(files) > MAX_FILES:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Maximum {MAX_FILES} files allowed",
                    }
                ),
                400,
            )

        if len(files) == 0:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "No files uploaded",
                    }
                ),
                400,
            )

        uploaded_documents = []

        failed_documents = []

        for file in files:

            try:

                if file.filename == "":
                    continue

                # MIME type validation
                if file.mimetype not in allowed_mime_types:

                    failed_documents.append(
                        {
                            "filename": file.filename,
                            "reason": "Unsupported MIME type",
                        }
                    )

                    continue

                # Empty file validation
                file.seek(0, os.SEEK_END)

                file_size = file.tell()

                file.seek(0)

                if file_size == 0:

                    failed_documents.append(
                        {
                            "filename": file.filename,
                            "reason": "File is empty",
                        }
                    )

                    continue

                # Extension validation
                if not allowed_file(file.filename):

                    failed_documents.append(
                        {
                            "filename": file.filename,
                            "reason": "Unsupported file type",
                        }
                    )

                    continue

                original_filename = secure_filename(file.filename)

                unique_filename = generate_unique_filename(original_filename)

                upload_path = os.path.join(
                    Config.UPLOAD_FOLDER,
                    unique_filename,
                )

                file.save(upload_path)

                extension = get_file_extension(original_filename)

                new_document = Document(
                    filename=unique_filename,
                    original_filename=original_filename,
                    file_type=extension,
                    upload_path=upload_path,
                    status="uploaded",
                    user_id=current_user_id,
                )

                db.session.add(new_document)

                uploaded_documents.append(new_document)

            except Exception as file_error:

                failed_documents.append(
                    {
                        "filename": file.filename,
                        "reason": str(file_error),
                    }
                )

        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Batch upload completed",
                    "uploaded_count": len(uploaded_documents),
                    "failed_count": len(failed_documents),
                    "uploaded_documents": [doc.to_dict() for doc in uploaded_documents],
                    "failed_documents": failed_documents,
                }
            ),
            201,
        )

    except Exception as error:

        return handle_server_error(error)
