from flask import Blueprint
from flask import jsonify
from flask import request
from flask import current_app

from threading import Thread

from models.batch_model import Batch

from models.document_model import Document
from models.database import db

from routes.extract import process_document_for_extraction

from middlewares.auth_middleware import auth_required
from utils.helpers import handle_server_error
from utils.service_registry import get_batch_processor

batch_bp = Blueprint("batch", __name__)

batch_processor = get_batch_processor()


LOW_CONFIDENCE_THRESHOLD = 0.75


def build_batch_payload(batch, documents):

    processed = [document for document in documents if document.status == "completed"]

    failed = [document for document in documents if document.status == "failed"]

    needs_review = [
        document
        for document in documents
        if document.status == "completed"
        and (
            document.confidence_score is None
            or document.confidence_score < LOW_CONFIDENCE_THRESHOLD
        )
    ]

    successful = [
        document
        for document in processed
        if document.confidence_score is not None
        and document.confidence_score >= LOW_CONFIDENCE_THRESHOLD
    ]

    comparison_keys = []

    for document in documents:

        if isinstance(document.extracted_data, dict):

            for key in document.extracted_data.keys():

                if key not in comparison_keys:

                    comparison_keys.append(key)

    comparison_rows = []

    for document in documents:

        row = {
            "document_id": document.id,
            "filename": document.original_filename,
            "status": document.status,
            "document_type": document.document_type,
            "confidence_score": document.confidence_score,
            "review_status": document.review_status,
        }

        extracted_data = document.extracted_data or {}

        for key in comparison_keys:

            value = extracted_data.get(key)

            row[key] = value if not isinstance(value, (dict, list)) else str(value)

        comparison_rows.append(row)

    summary = {
        "total_documents": len(documents),
        "processed_documents": len(processed),
        "successful_documents": len(successful),
        "needs_review_documents": len(needs_review),
        "failed_documents": len(failed),
        "completion_percentage": (
            round(
                ((len(processed) + len(failed)) / len(documents)) * 100,
                2,
            )
            if documents
            else 0
        ),
    }

    batch_dict = batch.to_dict()

    batch_dict.update(summary)

    return {
        "batch": batch_dict,
        "summary": summary,
        "documents": [document.to_dict() for document in documents],
        "needs_review": [document.to_dict() for document in needs_review],
        "comparison_fields": comparison_keys,
        "comparison_rows": comparison_rows,
    }


def run_batch_processing(app, current_user_id, batch_id):

    with app.app_context():

        batch = Batch.query.filter_by(
            id=batch_id,
            user_id=current_user_id,
        ).first()

        if not batch:

            return

        batch.status = "processing"

        db.session.commit()

        documents = Document.query.filter_by(
            batch_id=batch.id,
            user_id=current_user_id,
        ).all()

        for document in documents:

            if document.status in ["completed", "approved", "failed"]:

                batch_processor.update_batch_progress(batch.id)

                continue

            try:

                process_document_for_extraction(current_user_id, document)

            except Exception as error:

                document.status = "failed"

                document.extracted_data = {
                    "batch_error": "Batch processing failed",
                }

                db.session.commit()

                batch_processor.update_batch_progress(batch.id)

        batch_processor.update_batch_progress(batch.id)


@batch_bp.route("/api/batches", methods=["POST"])
@auth_required()
def create_batch(current_user_id):

    try:

        data = request.get_json()

        batch_name = data.get("batch_name")

        document_ids = data.get("document_ids") or []

        if not batch_name:

            return jsonify({"success": False, "message": "batch_name required"}), 400

        if not document_ids:

            return jsonify({"success": False, "message": "document_ids required"}), 400

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

        batch = batch_processor.create_batch(
            batch_name=batch_name, document_ids=document_ids, user_id=current_user_id
        )

        template_name = data.get("template_name")

        if template_name:

            for document in documents:

                options = document.preprocessing_options or {}

                options["template_name"] = template_name

                document.preprocessing_options = options

            db.session.commit()

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

        return handle_server_error(error)


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

        return handle_server_error(error)


@batch_bp.route("/api/batches/<int:batch_id>", methods=["GET"])
@auth_required()
def get_batch(current_user_id, batch_id):

    try:

        batch = Batch.query.filter_by(id=batch_id, user_id=current_user_id).first()

        if not batch:

            return jsonify({"success": False, "message": "Batch not found"}), 404

        batch_processor.update_batch_progress(batch.id)

        documents = Document.query.filter_by(
            batch_id=batch.id, user_id=current_user_id
        ).all()

        payload = build_batch_payload(batch, documents)

        return jsonify({"success": True, **payload})

    except Exception as error:

        return handle_server_error(error)


@batch_bp.route("/api/batches/<int:batch_id>/process", methods=["POST"])
@auth_required()
def process_batch(current_user_id, batch_id):

    try:

        batch = Batch.query.filter_by(id=batch_id, user_id=current_user_id).first()

        if not batch:

            return jsonify({"success": False, "message": "Batch not found"}), 404

        batch.status = "queued"

        db.session.commit()

        app = current_app._get_current_object()

        worker = Thread(
            target=run_batch_processing,
            args=(app, current_user_id, batch_id),
            daemon=True,
        )

        worker.start()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Batch processing queued",
                    "batch": batch.to_dict(),
                }
            ),
            202,
        )

    except Exception as error:

        return handle_server_error(error)


@batch_bp.route("/api/batches/<int:batch_id>/template", methods=["POST"])
@auth_required()
def apply_batch_template(current_user_id, batch_id):

    try:

        data = request.get_json() or {}

        template_name = data.get("template_name")

        if not template_name:

            return jsonify({"success": False, "message": "template_name required"}), 400

        batch = Batch.query.filter_by(id=batch_id, user_id=current_user_id).first()

        if not batch:

            return jsonify({"success": False, "message": "Batch not found"}), 404

        documents = Document.query.filter_by(
            batch_id=batch.id,
            user_id=current_user_id,
        ).all()

        for document in documents:

            options = document.preprocessing_options or {}

            options["template_name"] = template_name

            document.preprocessing_options = options

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Template applied to batch",
                "template_name": template_name,
                "updated_documents": len(documents),
            }
        )

    except Exception as error:

        return handle_server_error(error)
