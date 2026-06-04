from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont

import os


class BoundingBoxRenderer:

    def __init__(self):
        pass

    def draw_bounding_boxes(self, image_path, ocr_results, output_path):

        image = Image.open(image_path).convert("RGB")

        draw = ImageDraw.Draw(image)

        for item in ocr_results:

            bbox = item["bbox"]

            text = item["text"]

            confidence = item["confidence"]

            x1, y1 = bbox[0]
            x2, y2 = bbox[2]

            # confidence based color

            if confidence >= 0.8:
                color = "green"

            elif confidence >= 0.5:
                color = "orange"

            else:
                color = "red"

            draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

            draw.text((x1, y1 - 20), text, fill=color)

        image.save(output_path)

        return output_path
