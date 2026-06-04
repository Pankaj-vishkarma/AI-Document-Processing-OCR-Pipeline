import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_ENV = os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development")).lower()


class BaseConfig:

    # =====================================
    # SECURITY
    # =====================================

    SECRET_KEY = os.getenv("SECRET_KEY")

    if APP_ENV != "testing" and not SECRET_KEY:

        raise RuntimeError("SECRET_KEY must be set in the environment")

    if not SECRET_KEY:

        SECRET_KEY = "testing-secret-key"

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)

    jwt_expire_minutes = os.getenv("JWT_EXPIRE_MINUTES")

    jwt_expire_days = os.getenv("JWT_EXPIRE_DAYS")

    if jwt_expire_minutes:

        JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(jwt_expire_minutes))

    elif jwt_expire_days:

        JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(jwt_expire_days))

    else:

        JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)

    TESTING = False

    DEBUG = os.getenv("DEBUG", "False").lower() == "true"

    LOAD_OCR_MODEL = os.getenv("LOAD_OCR_MODEL", "true").lower() == "true"

    # =====================================
    # DATABASE
    # =====================================

    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///documents.db")

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(25 * 1024 * 1024)))

    # =====================================
    # FOLDERS
    # =====================================

    UPLOAD_FOLDER = os.path.abspath(
        os.getenv("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
    )

    PROCESSED_FOLDER = os.path.abspath(
        os.getenv("PROCESSED_FOLDER", os.path.join(BASE_DIR, "processed"))
    )

    EXPORT_FOLDER = os.path.abspath(
        os.getenv("EXPORT_FOLDER", os.path.join(BASE_DIR, "exports"))
    )

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

    if not CORS_ORIGINS:

        CORS_ORIGINS = ["http://localhost:5173"]


class DevelopmentConfig(BaseConfig):

    DEBUG = os.getenv("DEBUG", "true").lower() == "true"


class ProductionConfig(BaseConfig):

    DEBUG = False


class TestingConfig(BaseConfig):

    TESTING = True

    DEBUG = False

    SECRET_KEY = os.getenv("SECRET_KEY", "testing-secret-key")

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)

    LOAD_OCR_MODEL = False

    CORS_ORIGINS = ["http://localhost:5173"]


CONFIG_MAP = {
    "development": DevelopmentConfig,
    "dev": DevelopmentConfig,
    "production": ProductionConfig,
    "prod": ProductionConfig,
    "testing": TestingConfig,
    "test": TestingConfig,
}

Config = CONFIG_MAP.get(APP_ENV, DevelopmentConfig)
