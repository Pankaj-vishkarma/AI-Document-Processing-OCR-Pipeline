from flask import Blueprint
from flask import jsonify
from flask import request

from models.batch_model import Batch

from models.document_model import Document

from services.batch_processor import BatchProcessor

from middlewares.auth_middleware import auth_required

batch_bp = Blueprint("batch", __name__)

batch_processor = BatchProcessor()


@batch_bp.route("/api/batches", methods=["POST"])
@auth_required()
def create_batch(current_user_id):

    try:

        data = request.get_json()

        batch_name = data.get("batch_name")

        document_ids = data.get("document_ids")

        documents = Document.query.filter(
            Document.id.in_(document_ids), Document.user_id == current_user_id
        ).all()

        if len(documents) != len(document_ids):

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Some documents are invalid or unauthorized",
                    }
                ),
                403,
            )

        if not batch_name:

            return jsonify({"success": False, "message": "batch_name required"}), 400

        if not document_ids:

            return jsonify({"success": False, "message": "document_ids required"}), 400

        batch = batch_processor.create_batch(
            batch_name=batch_name, document_ids=document_ids, user_id=current_user_id
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Batch created successfully",
                    "batch": batch.to_dict(),
                }
            ),
            201,
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@batch_bp.route("/api/batches", methods=["GET"])
@auth_required()
def get_batches(current_user_id):

    try:

        batches = (
            Batch.query.filter_by(user_id=current_user_id)
            .order_by(Batch.created_at.desc())
            .all()
        )

        return jsonify(
            {
                "success": True,
                "total_batches": len(batches),
                "batches": [batch.to_dict() for batch in batches],
            }
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@batch_bp.route("/api/batches/<int:batch_id>", methods=["GET"])
@auth_required()
def get_batch(current_user_id, batch_id):

    try:

        batch = Batch.query.filter_by(id=batch_id, user_id=current_user_id).first()

        if not batch:

            return jsonify({"success": False, "message": "Batch not found"}), 404

        documents = Document.query.filter_by(
            batch_id=batch.id, user_id=current_user_id
        ).all()

        return jsonify(
            {
                "success": True,
                "batch": batch.to_dict(),
                "documents": [document.to_dict() for document in documents],
            }
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500
