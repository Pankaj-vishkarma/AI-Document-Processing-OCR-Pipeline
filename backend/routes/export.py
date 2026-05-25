from flask import Blueprint
from flask import jsonify
from flask import request
from flask import send_file

from services.export_service import ExportService

from models.document_model import Document

export_bp = Blueprint("export", __name__)

export_service = ExportService()


@export_bp.route("/api/export", methods=["POST"])
def export_documents():

    try:

        data = request.get_json()

        export_type = data.get("type")

        if export_type == "json":

            export_path = export_service.export_json()

        elif export_type == "csv":

            export_path = export_service.export_csv()

        elif export_type == "excel":

            export_path = export_service.export_excel()

        else:

            return jsonify({"success": False, "message": "Invalid export type"}), 400

        return send_file(export_path, as_attachment=True)

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@export_bp.route("/api/export/batch/<int:batch_id>", methods=["GET"])
def export_batch(batch_id):

    try:

        documents = Document.query.filter_by(batch_id=batch_id).all()

        exported_data = []

        for document in documents:

            exported_data.append(document.to_dict())

        return jsonify(
            {"success": True, "batch_id": batch_id, "documents": exported_data}
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500
