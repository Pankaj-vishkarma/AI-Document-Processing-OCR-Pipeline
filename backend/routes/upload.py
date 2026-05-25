import os

from flask import Blueprint
from flask import request
from flask import jsonify
from werkzeug.utils import secure_filename

from config import Config

from models.database import db
from models.document_model import Document

from utils.helpers import allowed_file
from utils.helpers import generate_unique_filename
from utils.helpers import get_file_extension
from middlewares.auth_middleware import auth_required

upload_bp = Blueprint("upload", __name__)


@upload_bp.route("/api/upload", methods=["POST"])
@auth_required()
def upload_document(current_user_id):

    print("Received upload request", request.files)

    try:

        if "file" not in request.files:
            return jsonify({"success": False, "message": "No file uploaded"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"success": False, "message": "Filename missing"}), 400

        if not allowed_file(file.filename):
            return jsonify({"success": False, "message": "Unsupported file type"}), 400

        original_filename = secure_filename(file.filename)

        unique_filename = generate_unique_filename(original_filename)

        upload_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)

        file.save(upload_path)

        extension = get_file_extension(original_filename)

        new_document = Document(
            filename=unique_filename,
            original_filename=original_filename,
            file_type=extension,
            upload_path=upload_path,
            status="uploaded",
            user_id=current_user_id,
        )

        db.session.add(new_document)

        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Document uploaded successfully",
                    "document": new_document.to_dict(),
                }
            ),
            201,
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


@upload_bp.route("/api/upload/batch", methods=["POST"])
@auth_required()
def batch_upload(current_user_id):

    try:

        files = request.files.getlist("files")

        if len(files) == 0:
            return jsonify({"success": False, "message": "No files uploaded"}), 400

        uploaded_documents = []

        failed_documents = []

        for file in files:

            try:

                if file.filename == "":
                    continue

                if not allowed_file(file.filename):

                    failed_documents.append(
                        {"filename": file.filename, "reason": "Unsupported file type"}
                    )

                    continue

                original_filename = secure_filename(file.filename)

                unique_filename = generate_unique_filename(original_filename)

                upload_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)

                file.save(upload_path)

                extension = get_file_extension(original_filename)

                new_document = Document(
                    filename=unique_filename,
                    original_filename=original_filename,
                    file_type=extension,
                    upload_path=upload_path,
                    status="uploaded",
                    user_id=current_user_id,
                )

                db.session.add(new_document)

                uploaded_documents.append(new_document)

            except Exception as file_error:

                failed_documents.append(
                    {"filename": file.filename, "reason": str(file_error)}
                )

        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Batch upload completed",
                    "uploaded_count": len(uploaded_documents),
                    "failed_count": len(failed_documents),
                    "uploaded_documents": [doc.to_dict() for doc in uploaded_documents],
                    "failed_documents": failed_documents,
                }
            ),
            201,
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500
