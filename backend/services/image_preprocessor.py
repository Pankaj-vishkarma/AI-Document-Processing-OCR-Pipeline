import cv2
import numpy as np
import os

from PIL import Image

from config import Config


class ImagePreprocessor:

    DEFAULT_OPTIONS = {
        "deskew": True,
        "denoise": True,
        "binarize": True,
        "contrast_enhance": True,
        "crop_borders": True,
        "rotation_angle": 0,
    }

    def __init__(self):
        pass

    def resolve_image_path(self, image_path):

        if not image_path:

            return image_path

        normalized_path = os.path.normpath(str(image_path))

        if os.path.exists(normalized_path):

            return normalized_path

        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        project_candidate = os.path.normpath(
            os.path.join(project_root, normalized_path)
        )

        if os.path.exists(project_candidate):

            return project_candidate

        return normalized_path

    def get_default_options(self):

        return dict(self.DEFAULT_OPTIONS)

    def inspect_image_resolution(self, image_path):

        try:

            with Image.open(image_path) as image:

                width, height = image.size

                dpi = image.info.get("dpi")

                estimated_dpi = None

                if dpi and isinstance(dpi, tuple):

                    dpi_values = [value for value in dpi if value]

                    if dpi_values:

                        estimated_dpi = round(
                            float(sum(dpi_values)) / len(dpi_values),
                            2,
                        )

                low_resolution = False

                warning = None

                if estimated_dpi is not None and estimated_dpi < 150:

                    low_resolution = True
                    warning = f"Image DPI is {estimated_dpi}, which is below the 150 DPI OCR threshold."

                if estimated_dpi is None:

                    max_dimension = max(width, height)

                    if max_dimension < 1500:

                        low_resolution = True
                        warning = "Image resolution metadata is missing and the pixel size looks low for reliable OCR."

                return {
                    "width": width,
                    "height": height,
                    "dpi": estimated_dpi,
                    "is_low_resolution": low_resolution,
                    "warning": warning,
                }

        except Exception:

            image = cv2.imread(image_path)

            if image is None:

                return {
                    "width": 0,
                    "height": 0,
                    "dpi": None,
                    "is_low_resolution": True,
                    "warning": "Unable to inspect image resolution.",
                }

            height, width = image.shape[:2]

            max_dimension = max(width, height)

            return {
                "width": width,
                "height": height,
                "dpi": None,
                "is_low_resolution": max_dimension < 1500,
                "warning": (
                    "Image resolution metadata is missing and the pixel size looks low for reliable OCR."
                    if max_dimension < 1500
                    else None
                ),
            }

    def preprocess_image(
        self,
        image_path,
        options=None,
    ):

        image_path = self.resolve_image_path(image_path)

        image = cv2.imread(image_path)

        if image is None:
            raise Exception("Unable to read image")

        original_image = image.copy()

        if options is None:

            options = self.get_default_options()

        else:

            merged_options = self.get_default_options()
            merged_options.update(options)
            options = merged_options

        resolution_info = self.inspect_image_resolution(image_path)

        # grayscale
        gray = self.convert_to_grayscale(image)

        processed_image = gray

        if options.get("deskew"):

            processed_image = self.deskew_image(processed_image)

        if options.get("denoise"):

            processed_image = self.denoise_image(processed_image)

        if options.get("contrast_enhance"):

            processed_image = self.enhance_contrast(processed_image)

        if options.get("binarize"):

            processed_image = self.binarize_image(processed_image)

        if options.get("crop_borders"):

            processed_image = self.remove_borders(processed_image)

        rotation_angle = options.get(
            "rotation_angle",
            0,
        )

        if rotation_angle != 0:

            processed_image = self.rotate_image(
                processed_image,
                rotation_angle,
            )

        source_filename = os.path.basename(image_path)

        if source_filename.startswith("preprocessed_"):

            processed_filename = source_filename

        else:

            processed_filename = f"preprocessed_{source_filename}"

        processed_path = os.path.join(
            Config.PROCESSED_FOLDER,
            processed_filename,
        )

        cv2.imwrite(
            processed_path,
            processed_image,
        )

        return {
            "original_image": original_image,
            "processed_image": processed_image,
            "processed_path": processed_path,
            "preprocessing_options": options,
            "resolution_info": resolution_info,
        }

    def convert_to_grayscale(
        self,
        image,
    ):

        return cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )

    def deskew_image(
        self,
        image,
    ):

        blur = cv2.GaussianBlur(
            image,
            (5, 5),
            0,
        )

        threshold = cv2.threshold(
            blur,
            0,
            255,
            cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU,
        )[1]

        coordinates = np.column_stack(np.where(threshold > 0))

        if len(coordinates) == 0:

            return image

        angle = cv2.minAreaRect(coordinates)[-1]

        if angle < -45:

            angle = -(90 + angle)

        else:

            angle = -angle

        height, width = image.shape[:2]

        center = (
            width // 2,
            height // 2,
        )

        rotation_matrix = cv2.getRotationMatrix2D(
            center,
            angle,
            1.0,
        )

        rotated = cv2.warpAffine(
            image,
            rotation_matrix,
            (width, height),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE,
        )

        return rotated

    def denoise_image(
        self,
        image,
    ):

        return cv2.bilateralFilter(
            image,
            9,
            75,
            75,
        )

    def enhance_contrast(
        self,
        image,
    ):

        clahe = cv2.createCLAHE(
            clipLimit=2.0,
            tileGridSize=(8, 8),
        )

        enhanced = clahe.apply(image)

        return enhanced

    def binarize_image(
        self,
        image,
    ):

        blurred = cv2.GaussianBlur(
            image,
            (5, 5),
            0,
        )

        _, binary = cv2.threshold(
            blurred,
            0,
            255,
            cv2.THRESH_BINARY + cv2.THRESH_OTSU,
        )

        return binary

    def rotate_image(
        self,
        image,
        angle,
    ):

        height, width = image.shape[:2]

        center = (
            width // 2,
            height // 2,
        )

        rotation_matrix = cv2.getRotationMatrix2D(
            center,
            angle,
            1.0,
        )

        rotated = cv2.warpAffine(
            image,
            rotation_matrix,
            (width, height),
        )

        return rotated

    def remove_borders(
        self,
        image,
    ):

        threshold = cv2.threshold(
            image,
            0,
            255,
            cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU,
        )[1]

        coordinates = cv2.findNonZero(threshold)

        if coordinates is None:

            return image

        x, y, w, h = cv2.boundingRect(coordinates)

        padding = max(
            10,
            int(min(image.shape[:2]) * 0.02),
        )

        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(image.shape[1] - x, w + padding * 2)
        h = min(image.shape[0] - y, h + padding * 2)

        if w <= 0 or h <= 0:

            return image

        cropped = image[y : y + h, x : x + w]

        return cropped
