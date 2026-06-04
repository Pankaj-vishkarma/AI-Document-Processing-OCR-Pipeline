import os
import json
from pathlib import Path

from flask import Blueprint
from flask import jsonify

from utils.helpers import handle_server_error

templates_bp = Blueprint("templates", __name__)


def _collect_field_names(schema, prefix=""):

    field_names = []

    if isinstance(schema, dict):

        for key, value in schema.items():

            field_name = f"{prefix}{key}"

            if isinstance(value, dict):

                field_names.extend(_collect_field_names(value, f"{field_name}."))

            else:

                field_names.append(field_name)

    elif isinstance(schema, list) and schema and isinstance(schema[0], dict):

        field_names.extend(_collect_field_names(schema[0], prefix))

    return field_names


@templates_bp.route("/api/templates", methods=["GET"])
def get_templates():

    try:

        schema_folder = Path(__file__).resolve().parent.parent / "extraction_schemas"

        templates = []

        for file in os.listdir(schema_folder):

            if file.endswith(".json"):

                template_name = file.replace(".json", "")

                schema_path = schema_folder / file

                with schema_path.open("r", encoding="utf-8") as schema_file:

                    file_contents = schema_file.read().strip()

                if not file_contents:

                    schema = {}

                else:

                    schema = json.loads(file_contents)

                fields = _collect_field_names(schema)

                templates.append(
                    {
                        "name": template_name,
                        "field_count": len(fields),
                        "fields": fields,
                    }
                )

        return jsonify({"success": True, "templates": templates})

    except Exception as error:

        return handle_server_error(error)
