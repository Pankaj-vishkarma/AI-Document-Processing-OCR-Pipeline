from flask_jwt_extended import verify_jwt_in_request
from flask_jwt_extended import get_jwt_identity

from functools import wraps

from flask import jsonify


def auth_required():

    def decorator(function):

        @wraps(function)
        def wrapper(*args, **kwargs):

            try:

                verify_jwt_in_request()

                current_user_id = get_jwt_identity()

                return function(current_user_id, *args, **kwargs)

            except Exception as error:

                return jsonify({"success": False, "message": str(error)}), 401

        return wrapper

    return decorator
