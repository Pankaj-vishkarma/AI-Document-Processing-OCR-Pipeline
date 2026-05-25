from datetime import datetime

from models.database import db


class Batch(db.Model):

    __tablename__ = "batches"

    id = db.Column(db.Integer, primary_key=True)

    batch_name = db.Column(db.String(255), nullable=False)

    total_documents = db.Column(db.Integer, default=0)

    processed_documents = db.Column(db.Integer, default=0)

    failed_documents = db.Column(db.Integer, default=0)

    status = db.Column(db.String(50), default="pending")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self):

        return {
            "id": self.id,
            "batch_name": self.batch_name,
            "total_documents": self.total_documents,
            "processed_documents": self.processed_documents,
            "failed_documents": self.failed_documents,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
