import os
import json
import pandas as pd

from models.document_model import Document


class ExportService:

    def __init__(self):
        pass

    def export_json(self):

        documents = Document.query.all()

        exported_data = []

        for document in documents:

            exported_data.append(document.to_dict())

        export_path = "exports/documents.json"

        with open(export_path, "w", encoding="utf-8") as json_file:

            json.dump(exported_data, json_file, indent=4, default=str)

        return export_path

    def export_csv(self):

        documents = Document.query.all()

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

        dataframe = pd.DataFrame(rows)

        export_path = "exports/documents.csv"

        dataframe.to_csv(export_path, index=False)

        return export_path

    def export_excel(self):

        documents = Document.query.all()

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

        dataframe = pd.DataFrame(rows)

        export_path = "exports/documents.xlsx"

        dataframe.to_excel(export_path, index=False)

        return export_path
