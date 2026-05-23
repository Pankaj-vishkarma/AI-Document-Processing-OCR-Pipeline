import cv2
import numpy as np

from services.ocr_engine import OCREngine


class TableExtractor:

    def __init__(self):

        self.ocr_engine = OCREngine()

    def detect_tables(self, image_path):

        image = cv2.imread(image_path)

        if image is None:

            return {"success": False, "message": "Unable to read image", "tables": []}

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

        extracted_tables = []

        table_index = 1

        for contour in contours:

            x, y, w, h = cv2.boundingRect(contour)

            if w < 100 or h < 100:
                continue

            table_image = image[y : y + h, x : x + w]

            temp_table_path = f"processed/table_{table_index}.png"

            cv2.imwrite(temp_table_path, table_image)

            ocr_result = self.ocr_engine.extract_text(temp_table_path)

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

        return {
            "success": True,
            "total_tables": len(extracted_tables),
            "tables": extracted_tables,
        }
