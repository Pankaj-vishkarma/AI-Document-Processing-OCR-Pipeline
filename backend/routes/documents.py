import os

from flask import Blueprint
from flask import jsonify
from flask import send_file
from flask import request
from models.database import db

from models.document_model import Document

from services.bbox_renderer import BoundingBoxRenderer

from services.ocr_engine import OCREngine

from services.table_extractor import TableExtractor
from services.pdf_processor import PDFProcessor

from middlewares.auth_middleware import auth_required

table_extractor = TableExtractor()
pdf_processor = PDFProcessor()

documents_bp = Blueprint("documents", __name__)

renderer = BoundingBoxRenderer()

ocr_engine = OCREngine()


@documents_bp.route("/api/documents/<int:document_id>/preview", methods=["GET"])
@auth_required()
def get_document_preview(current_user_id, document_id):

    try:

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

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

        # OCR on processed image

        ocr_result = ocr_engine.extract_text(absolute_image_path)

        if not ocr_result["success"]:

            return jsonify({"success": False, "message": "OCR failed"}), 500

        # ensure processed folder exists

        os.makedirs("processed", exist_ok=True)

        preview_filename = f"preview_{document_id}.png"

        preview_path = os.path.abspath(os.path.join("processed", preview_filename))

        renderer.draw_bounding_boxes(
            image_path=absolute_image_path,
            ocr_results=ocr_result["results"],
            output_path=preview_path,
        )

        return send_file(preview_path, mimetype="image/png")

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@documents_bp.route("/api/documents", methods=["GET"])
@auth_required()
def get_all_documents(current_user_id):

    try:

        document_type = request.args.get("document_type")

        status = request.args.get("status")

        search = request.args.get("search")

        query = Document.query.filter_by(user_id=current_user_id)

        if document_type:

            query = query.filter(Document.document_type == document_type)

        if status:

            query = query.filter(Document.status == status)

        if search:

            query = query.filter(Document.original_filename.ilike(f"%{search}%"))

        documents = query.order_by(Document.created_at.desc()).all()

        return jsonify(
            {
                "success": True,
                "total_documents": len(documents),
                "documents": [document.to_dict() for document in documents],
            }
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@documents_bp.route("/api/documents/<int:document_id>", methods=["GET"])
@auth_required()
def get_single_document(current_user_id, document_id):

    try:

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        return jsonify({"success": True, "document": document.to_dict()})

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@documents_bp.route("/api/documents/<int:document_id>/fields", methods=["PUT"])
@auth_required()
def update_document_fields(current_user_id, document_id):

    try:

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        data = request.get_json()

        extracted_data = data.get("extracted_data")

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

        return jsonify({"success": False, "message": str(error)}), 500


@documents_bp.route("/api/documents/<int:document_id>/status", methods=["PATCH"])
@auth_required()
def update_document_status(current_user_id, document_id):

    try:

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        data = request.get_json()

        status = data.get("status")

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

        return jsonify({"success": False, "message": str(error)}), 500


@documents_bp.route("/api/documents/<int:document_id>", methods=["PATCH"])
@auth_required()
def update_document(current_user_id, document_id):

    try:

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        data = request.get_json() or {}

        if "document_type" in data:

            document.document_type = data.get("document_type")

        if "status" in data:

            document.status = data.get("status")

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Document updated successfully",
                "document": document.to_dict(),
            }
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@documents_bp.route("/api/documents/<int:document_id>", methods=["DELETE"])
@auth_required()
def delete_document(current_user_id, document_id):

    try:

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        # delete uploaded file

        if document.upload_path and os.path.exists(document.upload_path):

            os.remove(document.upload_path)

        # delete processed file

        if document.processed_path and os.path.exists(document.processed_path):

            os.remove(document.processed_path)

        db.session.delete(document)

        db.session.commit()

        return jsonify({"success": True, "message": "Document deleted successfully"})

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@documents_bp.route("/api/documents/<int:document_id>/tables", methods=["GET"])
@auth_required()
def get_document_tables(current_user_id, document_id):

    try:

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        if not document.processed_path:

            return (
                jsonify({"success": False, "message": "Processed file not found"}),
                400,
            )

        tables = table_extractor.detect_tables(document.processed_path)

        return jsonify({"success": True, "tables": tables})

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@documents_bp.route("/api/documents/<int:document_id>/pdf", methods=["GET"])
@auth_required()
def get_pdf_viewer_data(current_user_id, document_id):

    try:

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        if document.file_type.lower() != "pdf":

            return jsonify({"success": False, "message": "Document is not a PDF"}), 400

        pages = document.page_metadata or []

        if not pages:

            page_count = None

            if document.upload_path and os.path.exists(
                document.upload_path
            ):

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

        return jsonify({"success": False, "message": str(error)}), 500
