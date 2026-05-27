import json

from flask import Blueprint
from flask import jsonify
from flask import request

from models.document_model import Document
from models.database import db

from services.image_preprocessor import ImagePreprocessor
from services.ocr_engine import OCREngine
from services.document_classifier import DocumentClassifier
from services.field_extractor import FieldExtractor
from services.pdf_processor import PDFProcessor
from services.table_extractor import TableExtractor
from services.batch_processor import BatchProcessor
from middlewares.auth_middleware import auth_required

extract_bp = Blueprint("extract", __name__)

table_extractor = TableExtractor()
batch_processor = BatchProcessor()

preprocessor = ImagePreprocessor()

ocr_engine = OCREngine()

classifier = DocumentClassifier()

field_extractor = FieldExtractor()

pdf_processor = PDFProcessor()


def clean_json_response(response_text):

    response_text = response_text.replace("```json", "")

    response_text = response_text.replace("```", "")

    response_text = response_text.strip()

    return response_text


def ensure_dict_response(response_data, fallback=None):

    if isinstance(response_data, dict):
        return response_data

    if response_data is None:
        return fallback or {}

    cleaned_response = clean_json_response(response_data)

    try:

        parsed_response = json.loads(cleaned_response)

        if isinstance(parsed_response, dict):
            return parsed_response

    except Exception:

        pass

    return fallback or {}


def process_document_for_extraction(current_user_id, document):

    document.status = "processing"

    db.session.commit()

    file_extension = document.file_type.lower()

    processed_path = None

    all_pages = []

    all_results = []

    all_text = []

    all_tables = []

    if file_extension == "pdf":

        pdf_pages = pdf_processor.convert_pdf_to_pages(document.upload_path)

        document.total_pages = len(pdf_pages)

        for page in pdf_pages:

            processed_path = page["image_path"]

            if page.get("has_text_layer"):

                page_ocr = {
                    "success": True,
                    "full_text": page.get("full_text", ""),
                    "results": page.get("results", []),
                    "total_text_regions": len(page.get("results", [])),
                    "average_confidence": 1.0,
                }

            else:

                preprocess_result = preprocessor.preprocess_image(
                    page["image_path"],
                    options={
                        "deskew": False,
                        "denoise": False,
                        "binarize": True,
                        "contrast_enhance": False,
                        "crop_borders": False,
                    },
                )

                processed_path = preprocess_result["processed_path"]

                page_ocr = ocr_engine.extract_text(processed_path)

            page_tables = table_extractor.detect_tables(
                processed_path,
                run_ocr=not page.get("has_text_layer"),
            )

            for table in page_tables.get("tables", []):

                table_with_page = dict(table)

                table_with_page["page"] = page["page"]

                all_tables.append(table_with_page)

            all_text.append(page_ocr["full_text"])

            page_results = []

            for result in page_ocr["results"]:

                page_result = dict(result)

                page_result["page"] = page["page"]

                page_results.append(page_result)

            all_results.extend(page_results)

            all_pages.append(
                {
                    "page": page["page"],
                    "processed_path": processed_path,
                    "ocr_text": page_ocr["full_text"],
                    "ocr_coordinates": page_results,
                    "extracted_data": {"raw_text": page_ocr["full_text"]},
                    "tables": page_tables.get("tables", []),
                    "total_tables": page_tables.get("total_tables", 0),
                    "average_confidence": page_ocr.get("average_confidence", 0),
                    "total_text_regions": page_ocr.get(
                        "total_text_regions",
                        len(page_results),
                    ),
                    "extraction_status": (
                        "completed" if page_ocr.get("full_text") else "no_text"
                    ),
                }
            )

        ocr_result = {
            "full_text": " ".join(all_text),
            "results": all_results,
            "pages": all_pages,
        }

        document.page_metadata = all_pages

        table_results = {
            "success": True,
            "total_tables": len(all_tables),
            "tables": all_tables,
        }

    else:

        preprocess_result = preprocessor.preprocess_image(document.upload_path)

        processed_path = preprocess_result["processed_path"]

        document.preprocessing_options = {
            "deskew": True,
            "denoise": True,
            "binarize": True,
            "contrast_enhance": True,
        }

        ocr_result = ocr_engine.extract_text(processed_path)

    full_text = ocr_result["full_text"]

    table_results = table_extractor.detect_tables(processed_path)

    if not full_text:

        document.status = "failed"

        db.session.commit()

        if document.batch_id:

            batch_processor.update_batch_progress(document.batch_id)

        return {"success": False, "message": "OCR failed to extract text"}

    classification_response = classifier.classify_document(full_text)

    classification_json = ensure_dict_response(
        classification_response,
        {"document_type": "Unknown", "confidence": 0},
    )

    document_type = str(
        classification_json.get("document_type", "Unknown") or "Unknown"
    )

    confidence = classification_json.get("confidence", 0)

    try:

        normalized_document_type = document_type.lower()

        if normalized_document_type == "invoice":

            extracted_data = field_extractor.extract_invoice_fields(full_text)

        elif normalized_document_type in {"bank statement", "statement"}:

            extracted_data = field_extractor.extract_bank_statement_fields(full_text)

        elif normalized_document_type == "receipt":

            extracted_data = field_extractor.extract_receipt_fields(full_text)

        elif normalized_document_type == "business card":

            extracted_data = field_extractor.extract_business_card_fields(full_text)

        else:

            extracted_data = {"raw_text": full_text}

        extracted_data = ensure_dict_response(
            extracted_data,
            {"raw_text": full_text},
        )

    except Exception as extraction_error:

        extracted_data = {
            "raw_text": full_text,
            "extraction_error": str(extraction_error),
        }

    document.document_type = document_type

    document.confidence_score = confidence

    document.ocr_text = full_text

    document.extracted_data = extracted_data

    document.ocr_coordinates = ocr_result.get("results", [])

    document.processed_path = processed_path

    document.preprocessed_path = processed_path

    document.status = "completed"

    if document.batch_id:

        batch_processor.update_batch_progress(document.batch_id)

    db.session.commit()

    return {
        "success": True,
        "document_id": document.id,
        "document_type": document_type,
        "confidence": confidence,
        "ocr_results": ocr_result,
        "extracted_data": extracted_data,
        "tables": table_results,
    }


@extract_bp.route("/api/extract", methods=["POST"])
@auth_required()
def extract_document(current_user_id):

    try:

        data = request.get_json()

        if not data:

            return jsonify({"success": False, "message": "Request body missing"}), 400

        document_id = data.get("document_id")

        if not document_id:

            return jsonify({"success": False, "message": "document_id required"}), 400

        document = Document.query.filter_by(
            id=document_id, user_id=current_user_id
        ).first()

        if not document:

            return jsonify({"success": False, "message": "Document not found"}), 404

        document.status = "processing"

        db.session.commit()

        file_extension = document.file_type.lower()

        processed_path = None

        all_pages = []

        all_results = []

        all_text = []

        all_tables = []

        # ====================================
        # PDF PROCESSING
        # ====================================

        if file_extension == "pdf":

            pdf_pages = pdf_processor.convert_pdf_to_pages(document.upload_path)

            document.total_pages = len(pdf_pages)

            for page in pdf_pages:

                processed_path = page["image_path"]

                if page.get("has_text_layer"):

                    page_ocr = {
                        "success": True,
                        "full_text": page.get("full_text", ""),
                        "results": page.get("results", []),
                        "total_text_regions": len(page.get("results", [])),
                        "average_confidence": 1.0,
                    }

                else:

                    preprocess_result = preprocessor.preprocess_image(page["image_path"])

                    processed_path = preprocess_result["processed_path"]

                    page_ocr = ocr_engine.extract_text(processed_path)

                page_tables = table_extractor.detect_tables(processed_path)

                for table in page_tables.get("tables", []):

                    table_with_page = dict(table)

                    table_with_page["page"] = page["page"]

                    all_tables.append(table_with_page)

                all_text.append(page_ocr["full_text"])

                page_results = []

                for result in page_ocr["results"]:

                    page_result = dict(result)

                    page_result["page"] = page["page"]

                    page_results.append(page_result)

                all_results.extend(page_results)

                all_pages.append(
                    {
                        "page": page["page"],
                        "processed_path": processed_path,
                        "ocr_text": page_ocr["full_text"],
                        "ocr_coordinates": page_results,
                        "extracted_data": {"raw_text": page_ocr["full_text"]},
                        "tables": page_tables.get("tables", []),
                        "total_tables": page_tables.get("total_tables", 0),
                        "average_confidence": page_ocr.get(
                            "average_confidence",
                            0,
                        ),
                        "total_text_regions": page_ocr.get(
                            "total_text_regions",
                            len(page_results),
                        ),
                        "extraction_status": (
                            "completed" if page_ocr.get("full_text") else "no_text"
                        ),
                    }
                )

            ocr_result = {
                "full_text": " ".join(all_text),
                "results": all_results,
                "pages": all_pages,
            }

            document.page_metadata = all_pages

        # ====================================
        # IMAGE PROCESSING
        # ====================================

        else:

            preprocess_result = preprocessor.preprocess_image(document.upload_path)

            processed_path = preprocess_result["processed_path"]

            document.preprocessing_options = {
                "deskew": True,
                "denoise": True,
                "binarize": True,
                "contrast_enhance": True,
            }

            ocr_result = ocr_engine.extract_text(processed_path)

        full_text = ocr_result["full_text"]

        if file_extension == "pdf":

            table_results = {
                "success": True,
                "total_tables": len(all_tables),
                "tables": all_tables,
            }

        else:

            table_results = table_extractor.detect_tables(processed_path)

        if not full_text:

            document.status = "failed"

            db.session.commit()

            return (
                jsonify({"success": False, "message": "OCR failed to extract text"}),
                500,
            )

        # ====================================
        # DOCUMENT CLASSIFICATION
        # ====================================

        classification_response = classifier.classify_document(full_text)

        classification_json = ensure_dict_response(
            classification_response,
            {"document_type": "Unknown", "confidence": 0},
        )

        document_type = str(
            classification_json.get("document_type", "Unknown") or "Unknown"
        )

        confidence = classification_json.get("confidence", 0)

        extracted_data = {}

        # ====================================
        # FIELD EXTRACTION
        # ====================================

        try:

            normalized_document_type = document_type.lower()

            if normalized_document_type == "invoice":

                extracted_data = field_extractor.extract_invoice_fields(full_text)

            elif normalized_document_type in {"bank statement", "statement"}:

                extracted_data = field_extractor.extract_bank_statement_fields(
                    full_text
                )

            elif normalized_document_type == "receipt":

                extracted_data = field_extractor.extract_receipt_fields(full_text)

            elif normalized_document_type == "business card":

                extracted_data = field_extractor.extract_business_card_fields(full_text)

            else:

                extracted_data = {"raw_text": full_text}

            extracted_data = ensure_dict_response(
                extracted_data,
                {"raw_text": full_text},
            )

        except Exception as extraction_error:

            extracted_data = {
                "raw_text": full_text,
                "extraction_error": str(extraction_error),
            }

        # ====================================
        # SAVE DOCUMENT
        # ====================================

        document.document_type = document_type

        document.confidence_score = confidence

        document.ocr_text = full_text

        document.extracted_data = extracted_data

        document.ocr_coordinates = ocr_result.get("results", [])

        document.processed_path = processed_path

        document.preprocessed_path = processed_path

        document.status = "completed"

        if document.batch_id:

            batch_processor.update_batch_progress(document.batch_id)

        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Extraction completed",
                    "document_id": document.id,
                    "document_type": document_type,
                    "confidence": confidence,
                    "ocr_results": ocr_result,
                    "extracted_data": extracted_data,
                    "tables": table_results,
                }
            ),
            200,
        )

    except Exception as error:

        try:

            document.status = "failed"

            db.session.commit()

        except:
            pass

        return jsonify({"success": False, "message": str(error)}), 500


@extract_bp.route("/api/extract/batch", methods=["POST"])
@auth_required()
def extract_batch(current_user_id):

    try:

        data = request.get_json()

        document_ids = data.get("document_ids")

        if not document_ids:

            return jsonify({"success": False, "message": "document_ids required"}), 400

        processed_documents = []

        for document_id in document_ids:

            document = Document.query.filter_by(
                id=document_id, user_id=current_user_id
            ).first()

            if not document:
                continue

            document.status = "processing"

            db.session.commit()

            processed_path = None

            all_text = []

            all_results = []

            # =========================
            # PDF SUPPORT
            # =========================

            if document.file_type.lower() == "pdf":

                pdf_pages = pdf_processor.convert_pdf_to_images(document.upload_path)

                for page in pdf_pages:

                    preprocess_result = preprocessor.preprocess_image(
                        page["image_path"]
                    )

                    processed_path = preprocess_result["processed_path"]

                    page_ocr = ocr_engine.extract_text(processed_path)

                    all_text.append(page_ocr["full_text"])

                    all_results.extend(page_ocr["results"])

                full_text = " ".join(all_text)

            else:

                preprocess_result = preprocessor.preprocess_image(document.upload_path)

                processed_path = preprocess_result["processed_path"]

                ocr_result = ocr_engine.extract_text(processed_path)

                full_text = ocr_result["full_text"]

            classification = classifier.classify_document(full_text)

            document.document_type = "Processed"

            document.ocr_text = full_text

            if document.file_type.lower() == "pdf":

                document.ocr_coordinates = all_results

            else:

                document.ocr_coordinates = ocr_result.get(
                    "results",
                    [],
                )

            document.processed_path = processed_path

            document.preprocessed_path = processed_path

            document.status = "completed"

            db.session.commit()

            processed_documents.append(
                {"document_id": document.id, "status": "completed"}
            )

        return jsonify({"success": True, "processed_documents": processed_documents})

    except Exception as error:

        return jsonify({"success": False, "message": str(error)}), 500
