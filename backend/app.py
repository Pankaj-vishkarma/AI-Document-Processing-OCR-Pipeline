import os
from flask import Flask
from flask import make_response
from flask import request
from flask_cors import CORS

from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from config import Config

from models.database import db
from flask import send_from_directory

# =========================
# MODELS
# =========================

from models.user_model import User
from models.document_model import Document
from models.batch_model import Batch

# =========================
# ROUTES
# =========================

from routes.auth import auth_bp
from routes.upload import upload_bp
from routes.extract import extract_bp
from routes.documents import documents_bp
from routes.stats import stats_bp
from routes.export import export_bp
from routes.batch import batch_bp
from routes.review import review_bp
from routes.classify import classify_bp
from routes.templates import templates_bp
from routes.preprocess import preprocess_bp
from utils.service_registry import get_ocr_engine

app = Flask(__name__)

app.config.from_object(Config)

CORS(
    app,
    origins=app.config["CORS_ORIGINS"],
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    supports_credentials=True,
)


@app.after_request
def add_cors_headers(response):

    origin = (request.headers.get("Origin") or "").strip()

    if origin:

        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        )
        response.headers["Access-Control-Allow-Headers"] = request.headers.get(
            "Access-Control-Request-Headers", "Authorization, Content-Type"
        )
        response.headers["Vary"] = "Origin"

    return response


@app.before_request
def handle_cors_preflight():

    if request.method != "OPTIONS":
        return None

    origin = (request.headers.get("Origin") or "").strip()
    if not origin:
        return None

    response = make_response("", 200)
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = (
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    )
    response.headers["Access-Control-Allow-Headers"] = request.headers.get(
        "Access-Control-Request-Headers", "Authorization, Content-Type"
    )
    response.headers["Vary"] = "Origin"
    return response


db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)


app.register_blueprint(auth_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(extract_bp)
app.register_blueprint(documents_bp)
app.register_blueprint(stats_bp)
app.register_blueprint(export_bp)
app.register_blueprint(batch_bp)
app.register_blueprint(review_bp)
app.register_blueprint(classify_bp)
app.register_blueprint(templates_bp)
app.register_blueprint(preprocess_bp)

if app.config.get("LOAD_OCR_MODEL", True) and not app.config.get("TESTING"):

    get_ocr_engine().get_reader()


@app.route("/uploads/<path:filename>")
def uploaded_file(filename):

    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/processed/<path:filename>")
def processed_file(filename):

    return send_from_directory(
        app.config["PROCESSED_FOLDER"],
        filename,
    )


@app.route("/api/health")
def health():
    return {"success": True, "message": "Server Running Successfully"}


if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(
        host="0.0.0.0", port=int(os.getenv("PORT", 20373)), debug=app.config["DEBUG"]
    )
