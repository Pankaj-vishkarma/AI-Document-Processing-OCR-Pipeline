from models.batch_model import Batch

from models.document_model import Document

from models.database import db


class BatchProcessor:

    def __init__(self):
        pass

    def create_batch(self, batch_name, document_ids, user_id):

        batch = Batch(
            batch_name=batch_name,
            total_documents=len(document_ids),
            status="queued",
            user_id=user_id,
        )

        db.session.add(batch)

        db.session.commit()

        documents = Document.query.filter(
            Document.id.in_(document_ids), Document.user_id == user_id
        ).all()

        for document in documents:

            document.batch_id = batch.id

        db.session.commit()

        return batch

    def update_batch_progress(self, batch_id):

        batch = Batch.query.filter_by(id=batch_id).first()

        if not batch:
            return None

        processed_count = Document.query.filter_by(
            batch_id=batch.id, status="completed"
        ).count()

        failed_count = Document.query.filter_by(
            batch_id=batch.id, status="failed"
        ).count()

        processing_count = Document.query.filter_by(
            batch_id=batch.id, status="processing"
        ).count()

        batch.processed_documents = processed_count

        batch.failed_documents = failed_count

        total_finished = processed_count + failed_count

        if total_finished >= batch.total_documents:

            batch.status = "completed"

        elif processing_count > 0 or total_finished > 0:

            batch.status = "processing"

        else:

            batch.status = "queued"

        db.session.commit()

        return batch
