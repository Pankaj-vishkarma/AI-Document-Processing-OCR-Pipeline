from flask import Blueprint
from flask import jsonify

from models.document_model import Document

from middlewares.auth_middleware import auth_required

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

        invoice_count = Document.query.filter_by(
            user_id=current_user_id, document_type="Invoice"
        ).count()

        receipt_count = Document.query.filter_by(
            user_id=current_user_id, document_type="Receipt"
        ).count()

        business_card_count = Document.query.filter_by(
            user_id=current_user_id, document_type="Business Card"
        ).count()

        return jsonify(
            {
                "success": True,
                "stats": {
                    "total_documents": total_documents,
                    "completed_documents": completed_documents,
                    "failed_documents": failed_documents,
                    "processing_documents": processing_documents,
                    "approved_documents": approved_documents,
                    "document_types": {
                        "Invoice": invoice_count,
                        "Receipt": receipt_count,
                        "Business Card": business_card_count,
                    },
                },
            }
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500
