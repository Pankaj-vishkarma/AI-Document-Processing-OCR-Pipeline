import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:

    # =====================================
    # SECURITY
    # =====================================

    SECRET_KEY = os.getenv("SECRET_KEY")

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)

    # =====================================
    # DATABASE
    # =====================================

    SQLALCHEMY_DATABASE_URI = "sqlite:///documents.db"

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # =====================================
    # FOLDERS
    # =====================================

    UPLOAD_FOLDER = "uploads"

    PROCESSED_FOLDER = "processed"

    EXPORT_FOLDER = "exports"

    # =====================================
    # GROQ API
    # =====================================

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

    # =====================================
    # REDIS / CELERY
    # =====================================

    REDIS_URL = os.getenv("REDIS_URL")
