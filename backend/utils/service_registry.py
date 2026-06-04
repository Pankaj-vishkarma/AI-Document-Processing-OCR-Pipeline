from functools import lru_cache

from services.batch_processor import BatchProcessor
from services.bbox_renderer import BoundingBoxRenderer
from services.document_classifier import DocumentClassifier
from services.field_extractor import FieldExtractor
from services.image_preprocessor import ImagePreprocessor
from services.ocr_engine import OCREngine
from services.pdf_processor import PDFProcessor
from services.table_extractor import TableExtractor


@lru_cache(maxsize=1)
def get_table_extractor():

    return TableExtractor()


@lru_cache(maxsize=1)
def get_batch_processor():

    return BatchProcessor()


@lru_cache(maxsize=1)
def get_image_preprocessor():

    return ImagePreprocessor()


@lru_cache(maxsize=1)
def get_ocr_engine():

    return OCREngine()


@lru_cache(maxsize=1)
def get_document_classifier():

    return DocumentClassifier()


@lru_cache(maxsize=1)
def get_field_extractor():

    return FieldExtractor()


@lru_cache(maxsize=1)
def get_pdf_processor():

    return PDFProcessor()


@lru_cache(maxsize=1)
def get_bounding_box_renderer():

    return BoundingBoxRenderer()
