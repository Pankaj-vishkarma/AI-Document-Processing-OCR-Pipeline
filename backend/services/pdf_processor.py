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

    def convert_pdf_to_images(self, pdf_path):

        pdf_document = fitz.open(pdf_path)

        generated_images = []

        for page_index in range(len(pdf_document)):

            page = pdf_document.load_page(page_index)

            pix = page.get_pixmap(dpi=300)

            image_filename = f"{uuid.uuid4()}.png"

            image_path = os.path.join(Config.PROCESSED_FOLDER, image_filename)

            pix.save(image_path)

            generated_images.append({"page": page_index + 1, "image_path": image_path})

        pdf_document.close()

        return generated_images
