import os

from flask import Blueprint
from flask import jsonify
from flask import request
from flask import send_file

from services.export_service import ExportService

from models.document_model import Document

from middlewares.auth_middleware import auth_required
from utils.helpers import handle_server_error

export_bp = Blueprint("export", __name__)

export_service = ExportService()


@export_bp.route("/api/export", methods=["POST"])
@auth_required()
def export_documents(current_user_id):

    try:

        data = request.get_json() or {}

        export_type = data.get("type")

        query = Document.query.filter_by(user_id=current_user_id)

        document_ids = data.get("document_ids")

        if document_ids:

            query = query.filter(Document.id.in_(document_ids))

        document_type = data.get("document_type")

        if document_type:

            query = query.filter(Document.document_type == document_type)

        batch_id = data.get("batch_id")

        if batch_id:

            query = query.filter(Document.batch_id == batch_id)

        # Exclude failed documents from export
        query = query.filter(Document.status != "failed")

        documents = query.all()

        if not documents:

            return (
                jsonify({"success": False, "message": "No documents found"}),
                404,
            )

        if export_type == "json":

            export_path = export_service.export_json(current_user_id, documents)

        elif export_type == "csv":

            export_path = export_service.export_csv(current_user_id, documents)

        elif export_type == "excel":

            export_path = export_service.export_excel(current_user_id, documents)

        elif export_type == "zip":

            export_path = export_service.export_zip(current_user_id, documents)

        else:

            return jsonify({"success": False, "message": "Invalid export type"}), 400

        return send_file(
            export_path,
            as_attachment=True,
            download_name=os.path.basename(export_path),
            conditional=False,
        )

    except Exception as error:

        return handle_server_error(error)


@export_bp.route("/api/export/batch/<int:batch_id>", methods=["GET"])
@auth_required()
def export_batch(current_user_id, batch_id):

    try:

        export_type = request.args.get("type", "json")

        documents = (
            Document.query.filter_by(batch_id=batch_id, user_id=current_user_id)
            .filter(Document.status != "failed")
            .all()
        )

        if not documents:

            return (
                jsonify({"success": False, "message": "No batch documents found"}),
                404,
            )

        if export_type == "json":

            export_path = export_service.export_json(current_user_id, documents)

        elif export_type == "csv":

            export_path = export_service.export_csv(current_user_id, documents)

        elif export_type == "excel":

            export_path = export_service.export_excel(current_user_id, documents)

        elif export_type == "zip":

            export_path = export_service.export_zip(current_user_id, documents)

        else:

            return jsonify({"success": False, "message": "Invalid export type"}), 400

        return send_file(
            export_path,
            as_attachment=True,
            download_name=os.path.basename(export_path),
            conditional=False,
        )

    except Exception as error:

        return handle_server_error(error)
