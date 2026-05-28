from models.batch_model import Batch

from models.document_model import Document

from models.database import db
from sqlalchemy import func


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

        status_counts = dict(
            db.session.query(
                Document.status,
                func.count(Document.id),
            )
            .filter(Document.batch_id == batch.id)
            .group_by(Document.status)
            .all()
        )

        processed_count = status_counts.get("completed", 0)

        failed_count = status_counts.get("failed", 0)

        processing_count = status_counts.get("processing", 0)

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
