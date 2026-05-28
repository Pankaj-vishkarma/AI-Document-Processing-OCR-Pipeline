import re

import easyocr

from utils.helpers import normalize_text


class OCREngine:

    _shared_reader = None

    OCR_ALLOWLIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_/.,:&()#%+@' ₹€$¥£₽₺₩₪₨"

    def __init__(self):

        self.reader = None

    def get_reader(self):

        if OCREngine._shared_reader is None:

            OCREngine._shared_reader = easyocr.Reader(["en"], gpu=False)

        return OCREngine._shared_reader

    def normalize_text(self, text):

        return normalize_text(text)

    def clean_raw_text_fragment(self, text):

        cleaned_text = self.normalize_text(text)

        if not cleaned_text:
            return ""

        # Remove OCR artifacts that prefix numeric values, e.g. I65000 -> 65000.
        cleaned_text = re.sub(r"^I+(?=\d)", "", cleaned_text)

        return cleaned_text

    def format_bbox(self, bbox):

        formatted_bbox = []

        for point in bbox:

            formatted_bbox.append(
                [
                    int(point[0]),
                    int(point[1]),
                ]
            )

        return formatted_bbox

    def convert_bbox_to_rect(self, bbox):

        x_coordinates = [point[0] for point in bbox]

        y_coordinates = [point[1] for point in bbox]

        x = min(x_coordinates)

        y = min(y_coordinates)

        width = max(x_coordinates) - x

        height = max(y_coordinates) - y

        return {
            "x": x,
            "y": y,
            "width": width,
            "height": height,
        }

    def extract_text(self, image_path):

        try:

            reader = self.get_reader()

            results = reader.readtext(
                image_path,
                allowlist=self.OCR_ALLOWLIST,
                paragraph=False,
            )

            extracted_results = []

            full_text = []

            confidence_scores = []

            for result in results:

                bbox, text, confidence = result

                cleaned_text = self.clean_raw_text_fragment(text)

                formatted_bbox = self.format_bbox(bbox)

                rect_bbox = self.convert_bbox_to_rect(formatted_bbox)

                extracted_results.append(
                    {
                        "text": cleaned_text,
                        "bbox": formatted_bbox,
                        "rect_bbox": rect_bbox,
                        "confidence": round(
                            float(confidence),
                            4,
                        ),
                    }
                )

                if cleaned_text:

                    full_text.append(cleaned_text)

                confidence_scores.append(float(confidence))

            average_confidence = 0

            if len(confidence_scores) > 0:

                average_confidence = round(
                    sum(confidence_scores) / len(confidence_scores),
                    4,
                )

            return {
                "success": True,
                "full_text": " ".join(full_text),
                "results": extracted_results,
                "total_text_regions": len(extracted_results),
                "average_confidence": average_confidence,
            }

        except Exception as error:

            return {
                "success": False,
                "message": str(error),
                "full_text": "",
                "results": [],
                "total_text_regions": 0,
                "average_confidence": 0,
            }
