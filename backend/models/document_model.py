import os
from datetime import datetime
from datetime import timezone
from models.database import db
from models.user_model import User


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

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    total_pages = db.Column(db.Integer, default=1)

    ocr_coordinates = db.Column(db.JSON)

    bounding_boxes = db.Column(db.JSON)

    page_metadata = db.Column(db.JSON)

    preprocessed_path = db.Column(db.String(500))

    preprocessing_options = db.Column(db.JSON)

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_type": self.file_type,
            "document_type": self.document_type,
            "status": self.status,
            "upload_path": (
                f"/uploads/{os.path.basename(self.upload_path)}"
                if self.upload_path
                else None
            ),
            "processed_path": (
                f"/processed/{os.path.basename(self.processed_path)}"
                if self.processed_path
                else None
            ),
            "ocr_text": self.ocr_text,
            "extracted_data": self.extracted_data,
            "confidence_score": self.confidence_score,
            "batch_id": self.batch_id,
            "total_pages": self.total_pages,
            "ocr_coordinates": self.ocr_coordinates,
            "bounding_boxes": self.bounding_boxes,
            "page_metadata": self.page_metadata,
            "preprocessed_path": (
                f"/processed/{os.path.basename(self.preprocessed_path)}"
                if self.preprocessed_path
                else None
            ),
            "preprocessing_options": self.preprocessing_options,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "review_status": self.review_status,
            "review_notes": self.review_notes,
            "reviewed_by": self.reviewed_by,
            "user_id": self.user_id,
        }
