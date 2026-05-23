import os

from flask import Blueprint
from flask import jsonify
from flask import send_file
from flask import request
from models.database import db

from models.document_model import Document

from services.bbox_renderer import BoundingBoxRenderer

from services.ocr_engine import OCREngine

documents_bp = Blueprint("documents", __name__)

renderer = BoundingBoxRenderer()

ocr_engine = OCREngine()


@documents_bp.route("/api/documents/<int:document_id>/preview", methods=["GET"])
def get_document_preview(document_id):

    try:

        document = Document.query.get(document_id)

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
def get_all_documents():

    try:

        document_type = request.args.get("document_type")

        status = request.args.get("status")

        search = request.args.get("search")

        query = Document.query

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
def get_single_document(document_id):

    try:

        document = Document.query.get(document_id)

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        return jsonify({"success": True, "document": document.to_dict()})

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@documents_bp.route("/api/documents/<int:document_id>/fields", methods=["PUT"])
def update_document_fields(document_id):

    try:

        document = Document.query.get(document_id)

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
def update_document_status(document_id):

    try:

        document = Document.query.get(document_id)

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


@documents_bp.route("/api/documents/<int:document_id>", methods=["DELETE"])
def delete_document(document_id):

    try:

        document = Document.query.get(document_id)

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
