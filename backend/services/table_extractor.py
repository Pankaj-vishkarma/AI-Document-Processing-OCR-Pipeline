import cv2
import numpy as np
import logging
import os

from services.ocr_engine import OCREngine

logger = logging.getLogger(__name__)


class TableExtractor:

    def __init__(self):

        self.ocr_engine = OCREngine()

    def detect_tables(self, image_path, run_ocr=True):

        if not os.path.exists(image_path):
            logger.error(f"Image path does not exist: {image_path}")
            return {"success": False, "message": "Image file not found", "tables": []}

        image = cv2.imread(image_path)

        if image is None:

            logger.error(f"Unable to read image: {image_path}")
            return {"success": False, "message": "Unable to read image", "tables": []}

        logger.debug(f"Processing image for table detection: {image_path}")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 4
        )

        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))

        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))

        horizontal_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel)

        vertical_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vertical_kernel)

        table_mask = cv2.add(horizontal_lines, vertical_lines)

        contours, _ = cv2.findContours(
            table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        logger.debug(f"Found {len(contours)} contours in image")

        extracted_tables = []

        table_index = 1

        for contour in contours:

            x, y, w, h = cv2.boundingRect(contour)

            if w < 100 or h < 100:
                logger.debug(f"Skipping small contour: {w}x{h} (min 100x100)")
                continue

            logger.debug(f"Extracting table {table_index}: bbox({x}, {y}, {w}, {h})")

            table_image = image[y : y + h, x : x + w]

            temp_table_path = f"processed/table_{table_index}.png"

            cv2.imwrite(temp_table_path, table_image)

            if run_ocr:

                logger.debug(f"Running OCR on table {table_index}")
                ocr_result = self.ocr_engine.extract_text(temp_table_path)

                if not ocr_result.get("success"):
                    logger.warning(
                        f"OCR failed for table {table_index}: {ocr_result.get('message')}"
                    )
                elif not ocr_result.get("full_text"):
                    logger.warning(f"OCR returned empty text for table {table_index}")
                else:
                    logger.debug(
                        f"Table {table_index} OCR text length: {len(ocr_result.get('full_text', ''))}"
                    )

            else:

                logger.debug(f"Skipping OCR for table {table_index} (run_ocr=False)")
                ocr_result = {
                    "success": True,
                    "full_text": "",
                    "results": [],
                    "total_text_regions": 0,
                    "average_confidence": 0,
                }

            extracted_tables.append(
                {
                    "table_id": table_index,
                    "bbox": {
                        "x": int(x),
                        "y": int(y),
                        "width": int(w),
                        "height": int(h),
                    },
                    "ocr_data": ocr_result,
                }
            )

            table_index += 1

        logger.info(
            f"Table detection complete: found {len(extracted_tables)} tables in {image_path}"
        )

        return {
            "success": True,
            "total_tables": len(extracted_tables),
            "tables": extracted_tables,
        }
