from datetime import datetime
from models.database import db


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)

    filename = db.Column(db.String(255), nullable=False)

    original_filename = db.Column(db.String(255), nullable=False)

    file_type = db.Column(db.String(50))

    document_type = db.Column(db.String(100))

    status = db.Column(db.String(50), default="uploaded")

    upload_path = db.Column(db.String(500))

    processed_path = db.Column(db.String(500))

    ocr_text = db.Column(db.Text)

    extracted_data = db.Column(db.JSON)

    confidence_score = db.Column(db.Float)

    review_status = db.Column(db.String(50), default="pending_review")

    review_notes = db.Column(db.Text)

    reviewed_by = db.Column(db.String(255))

    batch_id = db.Column(db.Integer, db.ForeignKey("batches.id"), nullable=True)

    total_pages = db.Column(db.Integer, default=1)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_type": self.file_type,
            "document_type": self.document_type,
            "status": self.status,
            "upload_path": self.upload_path,
            "processed_path": self.processed_path,
            "ocr_text": self.ocr_text,
            "extracted_data": self.extracted_data,
            "confidence_score": self.confidence_score,
            "batch_id": self.batch_id,
            "total_pages": self.total_pages,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "review_status": self.review_status,
            "review_notes": self.review_notes,
            "reviewed_by": self.reviewed_by,
        }
