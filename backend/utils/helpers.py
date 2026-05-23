import os
import uuid

from utils.constants import ALLOWED_EXTENSIONS


def allowed_file(filename):
    if "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()

    return extension in ALLOWED_EXTENSIONS


def generate_unique_filename(filename):
    extension = filename.rsplit(".", 1)[1].lower()

    unique_name = f"{uuid.uuid4()}.{extension}"

    return unique_name


def get_file_extension(filename):
    return filename.rsplit(".", 1)[1].lower()
