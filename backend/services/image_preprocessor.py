import cv2
import numpy as np
import os

from config import Config


class ImagePreprocessor:

    def __init__(self):
        pass

    def preprocess_image(
        self,
        image_path,
        options=None,
    ):

        image = cv2.imread(image_path)

        if image is None:
            raise Exception("Unable to read image")

        original_image = image.copy()

        if options is None:

            options = {
                "deskew": True,
                "denoise": True,
                "binarize": True,
                "contrast_enhance": True,
                "crop_borders": True,
                "rotation_angle": 0,
            }

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

        processed_filename = os.path.basename(image_path)

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

        coordinates = np.column_stack(np.where(image > 0))

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

        return cv2.fastNlMeansDenoising(
            image,
            None,
            10,
            7,
            21,
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

        binary = cv2.adaptiveThreshold(
            image,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2,
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

        contours, _ = cv2.findContours(
            image,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        if len(contours) == 0:
            return image

        largest_contour = max(
            contours,
            key=cv2.contourArea,
        )

        x, y, w, h = cv2.boundingRect(largest_contour)

        cropped = image[
            y : y + h,
            x : x + w,
        ]

        return cropped
