from flask import Blueprint
from flask import jsonify
from flask import request

from flask_jwt_extended import create_access_token
from flask_jwt_extended import jwt_required
from flask_jwt_extended import get_jwt_identity

from models.database import db
from models.user_model import User

auth_bp = Blueprint("auth", __name__)


# =========================================
# REGISTER
# =========================================


@auth_bp.route("/api/auth/register", methods=["POST"])
def register():

    try:

        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "Request body missing"}), 400

        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        # =========================
        # VALIDATION
        # =========================

        if not username:
            return jsonify({"success": False, "message": "username required"}), 400

        if not email:
            return jsonify({"success": False, "message": "email required"}), 400

        if not password:
            return jsonify({"success": False, "message": "password required"}), 400

        # =========================
        # CHECK EXISTING USER
        # =========================

        existing_user = User.query.filter_by(email=email).first()

        if existing_user:
            return (
                jsonify(
                    {"success": False, "message": "User already exists with this email"}
                ),
                409,
            )

        # =========================
        # CREATE USER
        # =========================

        new_user = User(username=username, email=email)

        new_user.set_password(password)

        db.session.add(new_user)

        db.session.commit()

        # =========================
        # GENERATE TOKEN
        # =========================

        access_token = create_access_token(identity=str(new_user.id))

        return (
            jsonify(
                {
                    "success": True,
                    "message": "User registered successfully",
                    "token": access_token,
                    "user": new_user.to_dict(),
                }
            ),
            201,
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


# =========================================
# LOGIN
# =========================================


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():

    try:

        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "Request body missing"}), 400

        email = data.get("email")
        password = data.get("password")

        if not email:
            return jsonify({"success": False, "message": "email required"}), 400

        if not password:
            return jsonify({"success": False, "message": "password required"}), 400

        # =========================
        # FIND USER
        # =========================

        user = User.query.filter_by(email=email).first()

        if not user:
            return (
                jsonify({"success": False, "message": "Invalid email or password"}),
                401,
            )

        # =========================
        # VERIFY PASSWORD
        # =========================

        if not user.check_password(password):

            return (
                jsonify({"success": False, "message": "Invalid email or password"}),
                401,
            )

        # =========================
        # CREATE TOKEN
        # =========================

        access_token = create_access_token(identity=str(user.id))

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Login successful",
                    "token": access_token,
                    "user": user.to_dict(),
                }
            ),
            200,
        )

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500


# =========================================
# CURRENT USER
# =========================================


@auth_bp.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_current_user():

    try:

        current_user_id = get_jwt_identity()

        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        return jsonify({"success": True, "user": user.to_dict()}), 200

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500
