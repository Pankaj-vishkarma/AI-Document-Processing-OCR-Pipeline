import os
import json
import uuid
import pandas as pd
import logging

from config import Config
from models.document_model import Document
from services.field_extractor import FieldExtractor

logger = logging.getLogger(__name__)


class ExportService:

    def __init__(self):
        pass

    def _resolve_documents(self, user_id, documents=None):

        if documents is not None:

            return list(documents)

        return Document.query.filter_by(user_id=user_id).all()

    def _flatten_line_items(self, line_items):
        """
        Flatten line_items into a readable string for CSV/Excel export.
        Handles list, dict, or string formats.
        """
        if not line_items:
            return ""

        if isinstance(line_items, str):
            return line_items

        if isinstance(line_items, list):
            formatted_items = []
            for idx, item in enumerate(line_items, 1):
                if isinstance(item, dict):
                    # Convert dict item to readable format: "1. description: qty x price"
                    description = item.get("description", "")
                    quantity = item.get("quantity", item.get("qty", ""))
                    price = item.get("price", item.get("unit_price", ""))
                    amount = item.get("amount", item.get("total", ""))

                    item_str = f"{idx}. {description}"
                    if quantity:
                        item_str += f" (qty: {quantity})"
                    if price:
                        item_str += f" @ {price}"
                    if amount:
                        item_str += f" = {amount}"
                    formatted_items.append(item_str)
                else:
                    formatted_items.append(f"{idx}. {str(item)}")
            return "; ".join(formatted_items)

        if isinstance(line_items, dict):
            return json.dumps(line_items, ensure_ascii=False)

        return str(line_items)

    def _build_rows(self, documents):
        """
        Build export rows including extracted_data fields.
        Handles different document types and flattens nested structures.
        """
        rows = []

        for document in documents:
            row = {
                "id": document.id,
                "filename": document.original_filename,
                "document_type": document.document_type,
                "status": document.status,
                "confidence": document.confidence_score,
                "created_at": document.created_at,
            }

            # Include extracted_data if available
            extracted_data = document.extracted_data or {}

            if isinstance(extracted_data, dict):
                # Add all extracted fields
                # Only coerce numeric-like values for known numeric keys
                NUMERIC_KEYS = {
                    "subtotal",
                    "tax",
                    "total",
                    "amount",
                    "price",
                    "unit_price",
                    "sub_total",
                    "grand_total",
                    "line_total",
                    "qty",
                    "quantity",
                }

                for key, value in extracted_data.items():
                    if key in ["line_items", "items"]:
                        # Flatten line_items for tabular export
                        row[key] = self._flatten_line_items(value)
                    elif isinstance(value, (dict, list)):
                        # Convert complex types to JSON string for CSV/Excel
                        row[key] = json.dumps(value, ensure_ascii=False)
                    else:
                        # Try to cast money-like strings to numeric for CSV/Excel
                        if isinstance(value, str) and key in NUMERIC_KEYS:
                            num, curr = FieldExtractor.parse_money_numeric(value)
                            if num is not None:
                                row[key] = num
                            else:
                                row[key] = value
                        else:
                            row[key] = value

            rows.append(row)

        return rows

    def _create_export_path(self, name, ext):
        os.makedirs(Config.EXPORT_FOLDER, exist_ok=True)
        filename = f"{name}-{uuid.uuid4().hex}.{ext}"
        return os.path.join(Config.EXPORT_FOLDER, filename)

    def export_json(self, user_id, documents=None):

        documents = self._resolve_documents(user_id, documents)

        exported_data = []

        for document in documents:

            exported_data.append(document.to_dict())

        export_path = self._create_export_path("documents", "json")

        with open(export_path, "w", encoding="utf-8") as json_file:

            json.dump(exported_data, json_file, indent=4, default=str)

        return export_path

    def export_csv(self, user_id, documents=None):

        documents = self._resolve_documents(user_id, documents)

        rows = self._build_rows(documents)

        if not rows:
            logger.warning(f"No documents found for CSV export by user {user_id}")
            rows = [{}]

        dataframe = pd.DataFrame(rows)

        export_path = self._create_export_path("documents", "csv")

        dataframe.to_csv(export_path, index=False, encoding="utf-8")

        logger.info(f"CSV export created with {len(rows)} documents at {export_path}")

        return export_path

    def export_excel(self, user_id, documents=None):

        documents = self._resolve_documents(user_id, documents)

        rows = self._build_rows(documents)

        if not rows:
            logger.warning(f"No documents found for Excel export by user {user_id}")
            rows = [{}]

        dataframe = pd.DataFrame(rows)

        export_path = self._create_export_path("documents", "xlsx")

        dataframe.to_excel(export_path, index=False)

        logger.info(f"Excel export created with {len(rows)} documents at {export_path}")

        return export_path

    def export_zip(self, user_id, documents=None):

        import zipfile

        documents = self._resolve_documents(user_id, documents)

        export_path = self._create_export_path("documents", "zip")

        with zipfile.ZipFile(export_path, "w", zipfile.ZIP_DEFLATED) as archive:

            for document in documents:

                archive.writestr(
                    f"document_{document.id}.json",
                    json.dumps(document.to_dict(), indent=4, default=str),
                )

            logger.info(
                f"ZIP export created with {len(documents)} documents at {export_path}"
            )

        return export_path
