from flask import Blueprint
from flask import jsonify

from models.document_model import Document

stats_bp = Blueprint("stats", __name__)


@stats_bp.route("/api/stats", methods=["GET"])
def get_stats():

    try:

        total_documents = Document.query.count()

        completed_documents = Document.query.filter_by(status="completed").count()

        failed_documents = Document.query.filter_by(status="failed").count()

        processing_documents = Document.query.filter_by(status="processing").count()

        approved_documents = Document.query.filter_by(status="approved").count()

        invoice_count = Document.query.filter_by(document_type="Invoice").count()

        receipt_count = Document.query.filter_by(document_type="Receipt").count()

        business_card_count = Document.query.filter_by(
            document_type="Business Card"
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
