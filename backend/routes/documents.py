import math
import os

from flask import Blueprint
from flask import jsonify
from flask import send_file
from flask import request
from config import Config
from models.database import db

from models.document_model import Document

from middlewares.auth_middleware import auth_required
from utils.helpers import get_document_or_404
from utils.helpers import handle_server_error
from utils.service_registry import get_bounding_box_renderer
from utils.service_registry import get_pdf_processor
from utils.service_registry import get_table_extractor

ALLOWED_DOCUMENT_STATUSES = {
    "uploaded",
    "processing",
    "completed",
    "failed",
    "approved",
    "rejected",
}

documents_bp = Blueprint("documents", __name__)

table_extractor = get_table_extractor()
pdf_processor = get_pdf_processor()
renderer = get_bounding_box_renderer()


def _get_pagination_params():

    try:

        page = int(request.args.get("page", 1))

    except (TypeError, ValueError):

        page = 1

    try:

        limit = int(request.args.get("limit", 20))

    except (TypeError, ValueError):

        limit = 20

    page = max(1, page)

    limit = min(max(1, limit), 1000)

    return page, limit


def _validate_extracted_data(extracted_data):

    if not isinstance(extracted_data, dict):

        return False, "extracted_data must be an object"

    if not all(isinstance(key, str) for key in extracted_data.keys()):

        return False, "extracted_data keys must be strings"

    return True, None


@documents_bp.route("/api/documents/<int:document_id>/preview", methods=["GET"])
@auth_required()
def get_document_preview(current_user_id, document_id):

    try:

        document, error_response, status_code = get_document_or_404(
            document_id,
            current_user_id,
        )

        if error_response:

            return error_response, status_code

        if document.file_type and document.file_type.lower() != "pdf":
            image_path = document.upload_path
        else:
            image_path = document.processed_path

        if not image_path:

            return (
                jsonify({"success": False, "message": "Document not processed yet"}),
                400,
            )

        # absolute path

        absolute_image_path = os.path.abspath(image_path)

        if not os.path.exists(absolute_image_path):

            return (
                jsonify({"success": False, "message": "Processed image not found"}),
                404,
            )

        ocr_results = document.ocr_coordinates or []

        os.makedirs(Config.PROCESSED_FOLDER, exist_ok=True)

        preview_filename = f"preview_{document_id}.png"

        preview_path = os.path.join(Config.PROCESSED_FOLDER, preview_filename)

        renderer.draw_bounding_boxes(
            image_path=absolute_image_path,
            ocr_results=ocr_results,
            output_path=preview_path,
        )

        return send_file(preview_path, mimetype="image/png")

    except Exception as error:

        return handle_server_error(error)


@documents_bp.route("/api/documents", methods=["GET"])
@auth_required()
def get_all_documents(current_user_id):

    try:

        document_type = request.args.get("document_type")

        status = request.args.get("status")

        search = request.args.get("search")

        page, limit = _get_pagination_params()

        query = Document.query.filter_by(user_id=current_user_id)

        if document_type:

            query = query.filter(Document.document_type == document_type)

        if status:

            query = query.filter(Document.status == status)

        if search:

            query = query.filter(Document.original_filename.ilike(f"%{search}%"))

        total_documents = query.count()

        documents = (
            query.order_by(Document.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        total_pages = (
            max(1, math.ceil(total_documents / limit)) if total_documents else 1
        )

        return jsonify(
            {
                "success": True,
                "total_documents": total_documents,
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1,
                "documents": [document.to_dict() for document in documents],
            }
        )

    except Exception as error:

        return handle_server_error(error)


@documents_bp.route("/api/documents/<int:document_id>", methods=["GET"])
@auth_required()
def get_single_document(current_user_id, document_id):

    try:

        document, error_response, status_code = get_document_or_404(
            document_id,
            current_user_id,
        )

        if error_response:

            return error_response, status_code

        return jsonify({"success": True, "document": document.to_dict()})

    except Exception as error:

        return handle_server_error(error)


@documents_bp.route("/api/documents/<int:document_id>/fields", methods=["PUT"])
@auth_required()
def update_document_fields(current_user_id, document_id):

    try:

        document, error_response, status_code = get_document_or_404(
            document_id,
            current_user_id,
        )

        if error_response:

            return error_response, status_code

        data = request.get_json() or {}

        extracted_data = data.get("extracted_data")

        is_valid, validation_error = _validate_extracted_data(extracted_data)

        if not is_valid:

            return jsonify({"success": False, "message": validation_error}), 400

        document.extracted_data = extracted_data

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Fields updated successfully",
                "document": document.to_dict(),
            }
        )

    except Exception as error:

        return handle_server_error(error)


@documents_bp.route("/api/documents/<int:document_id>/status", methods=["PATCH"])
@auth_required()
def update_document_status(current_user_id, document_id):

    try:

        document, error_response, status_code = get_document_or_404(
            document_id,
            current_user_id,
        )

        if error_response:

            return error_response, status_code

        data = request.get_json() or {}

        status = data.get("status")

        if status not in ALLOWED_DOCUMENT_STATUSES:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid status value",
                    }
                ),
                400,
            )

        document.status = status

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Status updated successfully",
                "document": document.to_dict(),
            }
        )

    except Exception as error:

        return handle_server_error(error)


@documents_bp.route("/api/documents/<int:document_id>", methods=["PATCH"])
@auth_required()
def update_document(current_user_id, document_id):

    try:

        document, error_response, status_code = get_document_or_404(
            document_id,
            current_user_id,
        )

        if error_response:

            return error_response, status_code

        data = request.get_json() or {}

        if "status" in data:

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Use the /status endpoint to update status",
                    }
                ),
                400,
            )

        document_type = data.get("document_type")

        if not isinstance(document_type, str) or not document_type.strip():

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "document_type required",
                    }
                ),
                400,
            )

        document.document_type = document_type.strip()

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Document updated successfully",
                "document": document.to_dict(),
            }
        )

    except Exception as error:

        return handle_server_error(error)


@documents_bp.route("/api/documents/<int:document_id>", methods=["DELETE"])
@auth_required()
def delete_document(current_user_id, document_id):

    try:

        document, error_response, status_code = get_document_or_404(
            document_id,
            current_user_id,
        )

        if error_response:

            return error_response, status_code

        # delete uploaded file

        if document.upload_path and os.path.exists(document.upload_path):
            os.remove(document.upload_path)

        # delete preprocessed file if different from upload_path
        if (
            document.preprocessed_path
            and document.preprocessed_path != document.upload_path
            and os.path.exists(document.preprocessed_path)
        ):
            os.remove(document.preprocessed_path)

        # delete processed file path if it is not the upload path
        if (
            document.processed_path
            and document.processed_path != document.upload_path
            and os.path.exists(document.processed_path)
        ):
            os.remove(document.processed_path)

        db.session.delete(document)

        db.session.commit()

        return jsonify({"success": True, "message": "Document deleted successfully"})

    except Exception as error:

        return handle_server_error(error)


@documents_bp.route("/api/documents/<int:document_id>/tables", methods=["GET"])
@auth_required()
def get_document_tables(current_user_id, document_id):

    try:

        document, error_response, status_code = get_document_or_404(
            document_id,
            current_user_id,
        )

        if error_response:

            return error_response, status_code

        if not document.processed_path:

            return (
                jsonify({"success": False, "message": "Processed file not found"}),
                400,
            )

        tables = table_extractor.detect_tables(document.processed_path)

        return jsonify({"success": True, "tables": tables})

    except Exception as error:

        return handle_server_error(error)


@documents_bp.route("/api/documents/<int:document_id>/pdf", methods=["GET"])
@auth_required()
def get_pdf_viewer_data(current_user_id, document_id):

    try:

        document, error_response, status_code = get_document_or_404(
            document_id,
            current_user_id,
        )

        if error_response:

            return error_response, status_code

        if document.file_type.lower() != "pdf":

            return jsonify({"success": False, "message": "Document is not a PDF"}), 400

        pages = document.page_metadata or []

        if not pages:

            page_count = None

            if document.upload_path and os.path.exists(document.upload_path):

                page_count = pdf_processor.get_page_count(document.upload_path)

            if not page_count:

                page_count = document.total_pages

            pages = [
                {
                    "page": page_number,
                    "processed_path": None,
                    "ocr_text": "",
                    "ocr_coordinates": [],
                    "extracted_data": {},
                    "tables": [],
                    "total_tables": 0,
                    "average_confidence": 0,
                    "total_text_regions": 0,
                    "extraction_status": "pending",
                }
                for page_number in range(1, (page_count or 1) + 1)
            ]

        normalized_pages = []

        for page in pages:

            normalized_pages.append(
                {
                    "page": page.get("page"),
                    "processed_path": page.get("processed_path"),
                    "image_url": (
                        f"/{page.get('processed_path')}"
                        if page.get("processed_path")
                        else None
                    ),
                    "ocr_text": page.get("ocr_text", ""),
                    "ocr_coordinates": page.get("ocr_coordinates", []),
                    "extracted_data": page.get("extracted_data", {}),
                    "tables": page.get("tables", []),
                    "total_tables": page.get("total_tables", 0),
                    "average_confidence": page.get("average_confidence", 0),
                    "total_text_regions": page.get("total_text_regions", 0),
                    "extraction_status": page.get(
                        "extraction_status",
                        "completed" if page.get("ocr_text") else "pending",
                    ),
                }
            )

        merged_tables = []

        for page in normalized_pages:

            for table in page["tables"]:

                merged_table = dict(table)

                merged_table["page"] = page["page"]

                merged_tables.append(merged_table)

        summary = {
            "total_pages": len(normalized_pages),
            "completed_pages": len(
                [
                    page
                    for page in normalized_pages
                    if page["extraction_status"] == "completed"
                ]
            ),
            "total_text_regions": sum(
                page["total_text_regions"] for page in normalized_pages
            ),
            "total_tables": len(merged_tables),
            "merged_tables": merged_tables,
            "merged_data": document.extracted_data or {},
            "full_text": document.ocr_text or "",
        }

        return jsonify(
            {
                "success": True,
                "document": document.to_dict(),
                "pages": normalized_pages,
                "summary": summary,
            }
        )

    except Exception as error:

        return handle_server_error(error)
