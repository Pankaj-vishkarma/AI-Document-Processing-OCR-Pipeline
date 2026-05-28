import os
import json
import uuid
import pandas as pd

from config import Config
from models.document_model import Document


class ExportService:

    def __init__(self):
        pass

    def _resolve_documents(self, user_id, documents=None):

        if documents is not None:

            return list(documents)

        return Document.query.filter_by(user_id=user_id).all()

    def _build_rows(self, documents):

        rows = []

        for document in documents:

            rows.append(
                {
                    "id": document.id,
                    "filename": document.original_filename,
                    "document_type": document.document_type,
                    "status": document.status,
                    "confidence": document.confidence_score,
                    "created_at": document.created_at,
                }
            )

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

        dataframe = pd.DataFrame(rows)

        export_path = self._create_export_path("documents", "csv")

        dataframe.to_csv(export_path, index=False)

        return export_path

    def export_excel(self, user_id, documents=None):

        documents = self._resolve_documents(user_id, documents)

        rows = self._build_rows(documents)

        dataframe = pd.DataFrame(rows)

        export_path = self._create_export_path("documents", "xlsx")

        dataframe.to_excel(export_path, index=False)

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

        return export_path
