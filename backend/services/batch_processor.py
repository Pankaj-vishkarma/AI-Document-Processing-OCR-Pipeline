from models.batch_model import Batch

from models.document_model import Document

from models.database import db


class BatchProcessor:

    def __init__(self):
        pass

    def create_batch(self, batch_name, document_ids):

        batch = Batch(
            batch_name=batch_name,
            total_documents=len(document_ids),
            status="processing",
        )

        db.session.add(batch)

        db.session.commit()

        documents = Document.query.filter(Document.id.in_(document_ids)).all()

        for document in documents:

            document.batch_id = batch.id

        db.session.commit()

        return batch

    def update_batch_progress(self, batch_id):

        batch = Batch.query.get(batch_id)

        if not batch:
            return None

        processed_count = Document.query.filter_by(
            batch_id=batch.id, status="completed"
        ).count()

        failed_count = Document.query.filter_by(
            batch_id=batch.id, status="failed"
        ).count()

        batch.processed_documents = processed_count

        batch.failed_documents = failed_count

        total_finished = processed_count + failed_count

        if total_finished >= batch.total_documents:

            batch.status = "completed"

        db.session.commit()

        return batch
