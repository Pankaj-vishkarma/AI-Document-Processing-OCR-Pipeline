import os

from flask import Blueprint
from flask import jsonify

templates_bp = Blueprint("templates", __name__)


@templates_bp.route("/api/templates", methods=["GET"])
def get_templates():

    try:

        schema_folder = "extraction_schemas"

        templates = []

        for file in os.listdir(schema_folder):

            if file.endswith(".json"):

                templates.append(file.replace(".json", ""))

        return jsonify({"success": True, "templates": templates})

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500
