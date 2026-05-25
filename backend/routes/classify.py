from flask import Blueprint
from flask import jsonify
from flask import request

from models.document_model import Document

from services.document_classifier import DocumentClassifier

classify_bp = Blueprint("classify", __name__)

classifier = DocumentClassifier()


@classify_bp.route("/api/classify", methods=["POST"])
def classify_document():

    try:

        data = request.get_json()

        document_id = data.get("document_id")

        if not document_id:

            return jsonify({"success": False, "message": "document_id required"}), 400

        document = Document.query.get(document_id)

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        if not document.ocr_text:

            return jsonify({"success": False, "message": "OCR text not found"}), 400

        classification = classifier.classify_document(document.ocr_text)

        return jsonify({"success": True, "classification": classification})

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500
