import fitz
import os
import uuid

from config import Config


class PDFProcessor:

    def __init__(self):
        pass

    def get_page_count(self, pdf_path):

        pdf_document = fitz.open(pdf_path)

        page_count = len(pdf_document)

        pdf_document.close()

        return page_count

    def convert_pdf_to_images(self, pdf_path, dpi=200, first_page_only=False):

        generated_images = []

        with fitz.open(pdf_path) as pdf_document:

            page_indexes = range(len(pdf_document))

            if first_page_only:

                page_indexes = range(min(1, len(pdf_document)))

            for page_index in page_indexes:

                page = pdf_document.load_page(page_index)

                pix = page.get_pixmap(dpi=dpi, colorspace=fitz.csGRAY, alpha=False)

                image_filename = f"{uuid.uuid4()}.png"

                image_path = os.path.join(Config.PROCESSED_FOLDER, image_filename)

                pix.save(image_path)

                generated_images.append(
                    {"page": page_index + 1, "image_path": image_path}
                )

        return generated_images

    def convert_pdf_to_pages(self, pdf_path, dpi=96, first_page_only=False):

        generated_pages = []

        with fitz.open(pdf_path) as pdf_document:

            page_indexes = range(len(pdf_document))

            if first_page_only:

                page_indexes = range(min(1, len(pdf_document)))

            for page_index in page_indexes:

                page = pdf_document.load_page(page_index)

                pix = page.get_pixmap(dpi=dpi, colorspace=fitz.csGRAY, alpha=False)

                image_filename = f"{uuid.uuid4()}.png"

                image_path = os.path.join(Config.PROCESSED_FOLDER, image_filename)

                pix.save(image_path)

                words = page.get_text("words") or []

                page_results = []
                text_parts = []

                for word in words:

                    x0, y0, x1, y1, text, *_ = word

                    cleaned_text = str(text).strip()

                    if not cleaned_text:

                        continue

                    bbox = [
                        [int(x0), int(y0)],
                        [int(x1), int(y0)],
                        [int(x1), int(y1)],
                        [int(x0), int(y1)],
                    ]

                    page_results.append(
                        {
                            "text": cleaned_text,
                            "bbox": bbox,
                            "rect_bbox": {
                                "x": int(x0),
                                "y": int(y0),
                                "width": int(x1 - x0),
                                "height": int(y1 - y0),
                            },
                            "confidence": 1.0,
                        }
                    )

                    text_parts.append(cleaned_text)

                generated_pages.append(
                    {
                        "page": page_index + 1,
                        "image_path": image_path,
                        "full_text": " ".join(text_parts).strip(),
                        "results": page_results,
                        "has_text_layer": len(page_results) > 0,
                    }
                )

        return generated_pages
