import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:

    # =====================================
    # SECURITY
    # =====================================

    SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_EXPIRE_DAYS", 30)))

    DEBUG = os.getenv("DEBUG", "False").lower() == "true"

    # =====================================
    # DATABASE
    # =====================================

    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///documents.db")

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # =====================================
    # FOLDERS
    # =====================================

    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")

    PROCESSED_FOLDER = os.getenv("PROCESSED_FOLDER", "processed")

    EXPORT_FOLDER = os.getenv("EXPORT_FOLDER", "exports")

    # =====================================
    # GROQ API
    # =====================================

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

    # =====================================
    # REDIS / CELERY
    # =====================================

    REDIS_URL = os.getenv("REDIS_URL")

    # =====================================

    # CORS
    # =====================================

    CORS_ORIGINS = [
        os.getenv("FRONTEND_URL_1"),
        os.getenv("FRONTEND_URL_2"),
        os.getenv("FRONTEND_URL_3"),
        os.getenv("FRONTEND_URL_4"),
        os.getenv("PRODUCTION_URL"),
    ]

    CORS_ORIGINS = [url for url in CORS_ORIGINS if url]
