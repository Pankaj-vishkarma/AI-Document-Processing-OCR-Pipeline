from flask import Flask
from flask_cors import CORS

from models.document_model import Document

from config import Config
from models.database import db

from routes.upload import upload_bp
from routes.extract import extract_bp
from routes.documents import documents_bp

app = Flask(__name__)

app.config.from_object(Config)

CORS(app)

db.init_app(app)

app.register_blueprint(upload_bp)
app.register_blueprint(extract_bp)
app.register_blueprint(documents_bp)


@app.route("/api/health")
def health():
    return {"success": True, "message": "Server Running Successfully"}


if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(debug=True)
