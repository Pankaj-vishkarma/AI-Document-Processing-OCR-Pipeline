from flask import Blueprint
from flask import jsonify
from sqlalchemy import func

from models.document_model import Document

from middlewares.auth_middleware import auth_required
from utils.helpers import handle_server_error

stats_bp = Blueprint("stats", __name__)


@stats_bp.route("/api/stats", methods=["GET"])
@auth_required()
def get_stats(current_user_id):

    try:

        total_documents = Document.query.filter_by(user_id=current_user_id).count()

        completed_documents = Document.query.filter_by(
            user_id=current_user_id, status="completed"
        ).count()

        failed_documents = Document.query.filter_by(
            user_id=current_user_id, status="failed"
        ).count()

        processing_documents = Document.query.filter_by(
            user_id=current_user_id, status="processing"
        ).count()

        approved_documents = Document.query.filter_by(
            user_id=current_user_id, status="approved"
        ).count()

        document_type_rows = (
            Document.query.with_entities(
                Document.document_type,
                func.count(Document.id),
            )
            .filter_by(user_id=current_user_id)
            .group_by(Document.document_type)
            .all()
        )

        document_types = {}

        for document_type, count in document_type_rows:

            document_types[str(document_type or "Unknown")] = count

        return jsonify(
            {
                "success": True,
                "stats": {
                    "total_documents": total_documents,
                    "completed_documents": completed_documents,
                    "failed_documents": failed_documents,
                    "processing_documents": processing_documents,
                    "approved_documents": approved_documents,
                    "document_types": document_types,
                },
            }
        )

    except Exception as error:

        return handle_server_error(error)
