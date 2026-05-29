from flask import Blueprint
from flask import jsonify
from flask import request

from flask_jwt_extended import create_access_token
from flask_jwt_extended import jwt_required
from flask_jwt_extended import get_jwt_identity

from models.database import db
from models.user_model import User
from utils.helpers import handle_server_error
from utils.rate_limiter import is_rate_limited
from utils.rate_limiter import record_rate_limit_event
import re

auth_bp = Blueprint("auth", __name__)


def _is_valid_email(email):
    if not email:
        return False
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


def _is_valid_username(username):
    if not username:
        return False
    # preserve existing allowed-char/length rule
    if not re.match(r"^[A-Za-z0-9._-]{3,50}$", username):
        return False

    # must contain at least one letter
    if not re.search(r"[A-Za-z]", username):
        return False

    # cannot be only numbers
    if re.fullmatch(r"\d+", username):
        return False

    # reject simple repeated substring patterns like 'testtesttest' or 'aaa...'
    if re.fullmatch(r"(.+)\1+", username):
        return False

    low = username.lower()
    blacklist = [
        "qwerty",
        "asdf",
        "zxcvbn",
        "password",
        "admin",
        "test",
        "user",
        "123456",
        "111111",
    ]
    if any(b in low for b in blacklist):
        return False

    # reject long strings with very few vowels (likely gibberish)
    if len(username) >= 8 and len(re.findall(r"[aeiouAEIOU]", username)) < 2:
        return False

    return True


def _sanitize_text(s):
    if s is None:
        return s
    # strip control characters
    return re.sub(r"[\x00-\x1f\x7f]", "", str(s)).strip()


def _get_login_rate_limit_key():

    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()

    return f"login:{email or request.remote_addr or 'unknown'}"


def _get_register_rate_limit_key():

    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()

    return f"register:{email or request.remote_addr or 'unknown'}"


# =========================================
# REGISTER
# =========================================


@auth_bp.route("/api/auth/register", methods=["POST"])
def register():

    try:

        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "Request body missing"}), 400

        # sanitize + normalize inputs
        username = _sanitize_text(data.get("username"))
        email = _sanitize_text(data.get("email"))
        password = data.get("password") or ""

        if email is not None:
            email = email.lower()

        # =========================
        # BASIC PRESENCE VALIDATION
        # =========================

        if not username:
            return jsonify({"success": False, "message": "username required"}), 400

        if not email:
            return jsonify({"success": False, "message": "email required"}), 400

        if not password:
            return jsonify({"success": False, "message": "password required"}), 400

        # =========================
        # FORMAT VALIDATION
        # =========================

        if not _is_valid_username(username):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "username invalid: use 3-50 letters/numbers/._-",
                    }
                ),
                400,
            )

        if not _is_valid_email(email):
            return (
                jsonify({"success": False, "message": "email invalid"}),
                400,
            )

        if len(password) < 8:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "password must be at least 8 characters",
                    }
                ),
                400,
            )

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

        return handle_server_error(error)


# =========================================
# LOGIN
# =========================================


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():

    try:

        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "Request body missing"}), 400

        email = _sanitize_text(data.get("email"))
        password = data.get("password") or ""

        if email is not None:
            email = email.lower()

        if not email:
            return jsonify({"success": False, "message": "email required"}), 400

        if not password:
            return jsonify({"success": False, "message": "password required"}), 400

        if not _is_valid_email(email):
            return (
                jsonify({"success": False, "message": "email invalid"}),
                400,
            )

        rate_limit_key = _get_login_rate_limit_key()

        if is_rate_limited(rate_limit_key, 10, 15 * 60):

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Too many login attempts, please try again later.",
                    }
                ),
                429,
            )

        # =========================
        # FIND USER
        # =========================

        user = User.query.filter_by(email=email).first()

        if not user:

            record_rate_limit_event(rate_limit_key, 15 * 60)

            return (
                jsonify({"success": False, "message": "Invalid email or password"}),
                401,
            )

        # =========================
        # VERIFY PASSWORD
        # =========================

        if not user.check_password(password):

            record_rate_limit_event(rate_limit_key, 15 * 60)

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

        return handle_server_error(error)


# =========================================
# CURRENT USER
# =========================================


@auth_bp.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_current_user():

    try:

        current_user_id = get_jwt_identity()

        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        return jsonify({"success": True, "user": user.to_dict()}), 200

    except Exception as error:

        return handle_server_error(error)
