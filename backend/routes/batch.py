from flask import Blueprint
from flask import jsonify
from flask import request

from models.batch_model import Batch

from models.document_model import Document

from services.batch_processor import BatchProcessor

batch_bp = Blueprint("batch", __name__)

batch_processor = BatchProcessor()


@batch_bp.route("/api/batches", methods=["POST"])
def create_batch():

    try:

        data = request.get_json()

        batch_name = data.get("batch_name")

        document_ids = data.get("document_ids")

        if not batch_name:

            return jsonify({"success": False, "message": "batch_name required"}), 400

        if not document_ids:

            return jsonify({"success": False, "message": "document_ids required"}), 400

        batch = batch_processor.create_batch(
            batch_name=batch_name, document_ids=document_ids
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
def get_batches():

    try:

        batches = Batch.query.order_by(Batch.created_at.desc()).all()

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
def get_batch(batch_id):

    try:

        batch = Batch.query.get(batch_id)

        if not batch:

            return jsonify({"success": False, "message": "Batch not found"}), 404

        documents = Document.query.filter_by(batch_id=batch.id).all()

        return jsonify(
            {
                "success": True,
                "batch": batch.to_dict(),
                "documents": [document.to_dict() for document in documents],
            }
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500
