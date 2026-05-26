import easyocr


class OCREngine:

    def __init__(self):

        self.reader = easyocr.Reader(["en", "hi"], gpu=False)

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

            results = self.reader.readtext(image_path)

            extracted_results = []

            full_text = []

            confidence_scores = []

            for result in results:

                bbox, text, confidence = result

                formatted_bbox = self.format_bbox(bbox)

                rect_bbox = self.convert_bbox_to_rect(formatted_bbox)

                extracted_results.append(
                    {
                        "text": text,
                        "bbox": formatted_bbox,
                        "rect_bbox": rect_bbox,
                        "confidence": round(
                            float(confidence),
                            4,
                        ),
                    }
                )

                full_text.append(text)

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
