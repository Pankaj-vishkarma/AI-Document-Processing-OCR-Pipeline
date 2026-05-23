import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")

    SQLALCHEMY_DATABASE_URI = "sqlite:///documents.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = "uploads"
    PROCESSED_FOLDER = "processed"
    EXPORT_FOLDER = "exports"

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
