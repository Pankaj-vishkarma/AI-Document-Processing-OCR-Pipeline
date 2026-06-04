from collections import defaultdict
from functools import wraps
from threading import Lock
from time import time

from flask import jsonify, request

_request_log = defaultdict(list)
_lock = Lock()


def clear_rate_limit(key):

    with _lock:

        _request_log.pop(key, None)


def is_rate_limited(key, max_failures, window_seconds):

    now = time()

    with _lock:

        timestamps = [
            timestamp
            for timestamp in _request_log[key]
            if now - timestamp < window_seconds
        ]

        _request_log[key] = timestamps

        return len(timestamps) >= max_failures


def record_rate_limit_event(key, window_seconds):

    now = time()

    with _lock:

        timestamps = [
            timestamp
            for timestamp in _request_log[key]
            if now - timestamp < window_seconds
        ]

        timestamps.append(now)

        _request_log[key] = timestamps


def rate_limit(max_requests, window_seconds, key_func=None):

    def decorator(function):

        @wraps(function)
        def wrapper(*args, **kwargs):

            key = (
                key_func() if key_func else f"{request.endpoint}:{request.remote_addr}"
            )
            now = time()

            with _lock:

                timestamps = [
                    timestamp
                    for timestamp in _request_log[key]
                    if now - timestamp < window_seconds
                ]

                if len(timestamps) >= max_requests:

                    _request_log[key] = timestamps

                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": "Too many requests, please try again later.",
                            }
                        ),
                        429,
                    )

                timestamps.append(now)
                _request_log[key] = timestamps

            return function(*args, **kwargs)

        return wrapper

    return decorator
