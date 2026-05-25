from flask import Blueprint
from flask import jsonify
from flask import request

from models.document_model import Document

from models.database import db

from middlewares.auth_middleware import auth_required

review_bp = Blueprint("review", __name__)


@review_bp.route("/api/review/<int:document_id>/approve", methods=["POST"])
@auth_required()
def approve_document(current_user_id, document_id):

    try:

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        data = request.get_json()

        reviewed_by = data.get("reviewed_by", "Admin")

        notes = data.get("notes", "")

        document.review_status = "approved"

        document.review_notes = notes

        document.reviewed_by = reviewed_by

        document.status = "approved"

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Document approved successfully",
                "document": document.to_dict(),
            }
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@review_bp.route("/api/review/<int:document_id>/reject", methods=["POST"])
@auth_required()
def reject_document(current_user_id, document_id):

    try:

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        data = request.get_json()

        reviewed_by = data.get("reviewed_by", "Admin")

        notes = data.get("notes", "")

        document.review_status = "rejected"

        document.review_notes = notes

        document.reviewed_by = reviewed_by

        document.status = "rejected"

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Document rejected successfully",
                "document": document.to_dict(),
            }
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@review_bp.route("/api/review/<int:document_id>/retry", methods=["POST"])
@auth_required()
def retry_processing(current_user_id, document_id):

    try:

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        document.status = "uploaded"

        document.review_status = "pending_review"

        document.review_notes = None

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Document reset for reprocessing",
                "document": document.to_dict(),
            }
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@review_bp.route("/api/review/queue", methods=["GET"])
@auth_required()
def review_queue(current_user_id):

    try:

        documents = Document.query.filter_by(
            user_id=current_user_id, review_status="pending_review"
        ).all()

        return jsonify(
            {
                "success": True,
                "total_documents": len(documents),
                "documents": [document.to_dict() for document in documents],
            }
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500
