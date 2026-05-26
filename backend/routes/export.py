from flask import Blueprint
from flask import jsonify
from flask import request
from flask import send_file

import json
import os
import zipfile

import pandas as pd

from services.export_service import ExportService

from models.document_model import Document

from middlewares.auth_middleware import auth_required

export_bp = Blueprint("export", __name__)

export_service = ExportService()


@export_bp.route("/api/export", methods=["POST"])
@auth_required()
def export_documents(current_user_id):

    try:

        data = request.get_json()

        export_type = data.get("type")

        if export_type == "json":

            export_path = export_service.export_json(current_user_id)

        elif export_type == "csv":

            export_path = export_service.export_csv(current_user_id)

        elif export_type == "excel":

            export_path = export_service.export_excel(current_user_id)

        else:

            return jsonify({"success": False, "message": "Invalid export type"}), 400

        return send_file(export_path, as_attachment=True)

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@export_bp.route("/api/export/batch/<int:batch_id>", methods=["GET"])
@auth_required()
def export_batch(current_user_id, batch_id):

    try:

        export_type = request.args.get("type", "json")

        documents = Document.query.filter_by(
            batch_id=batch_id, user_id=current_user_id
        ).all()

        if not documents:

            return jsonify({"success": False, "message": "No batch documents found"}), 404

        os.makedirs("exports", exist_ok=True)

        exported_data = [document.to_dict() for document in documents]

        if export_type == "json":

            export_path = f"exports/batch_{batch_id}.json"

            with open(export_path, "w", encoding="utf-8") as json_file:

                json.dump(exported_data, json_file, indent=4, default=str)

            return send_file(export_path, as_attachment=True)

        rows = []

        for document in documents:

            row = {
                "id": document.id,
                "filename": document.original_filename,
                "document_type": document.document_type,
                "status": document.status,
                "review_status": document.review_status,
                "confidence": document.confidence_score,
            }

            extracted_data = document.extracted_data or {}

            if isinstance(extracted_data, dict):

                for key, value in extracted_data.items():

                    row[key] = value if not isinstance(value, (dict, list)) else json.dumps(value)

            rows.append(row)

        dataframe = pd.DataFrame(rows)

        if export_type == "csv":

            export_path = f"exports/batch_{batch_id}.csv"

            dataframe.to_csv(export_path, index=False)

            return send_file(export_path, as_attachment=True)

        if export_type == "excel":

            export_path = f"exports/batch_{batch_id}.xlsx"

            with pd.ExcelWriter(export_path) as writer:

                grouped = dataframe.groupby(
                    dataframe["document_type"].fillna("Unknown")
                )

                for document_type, group in grouped:

                    sheet_name = str(document_type)[:31] or "Unknown"

                    group.to_excel(writer, sheet_name=sheet_name, index=False)

            return send_file(export_path, as_attachment=True)

        if export_type == "zip":

            export_path = f"exports/batch_{batch_id}.zip"

            with zipfile.ZipFile(export_path, "w", zipfile.ZIP_DEFLATED) as archive:

                for document in documents:

                    filename = f"document_{document.id}.json"

                    archive.writestr(
                        filename,
                        json.dumps(document.to_dict(), indent=4, default=str),
                    )

            return send_file(export_path, as_attachment=True)

        return jsonify({"success": False, "message": "Invalid export type"}), 400

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500
