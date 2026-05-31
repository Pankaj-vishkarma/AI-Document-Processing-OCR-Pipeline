import json

from flask import Blueprint
from flask import jsonify
from flask import request

from models.document_model import Document
from models.database import db

from middlewares.auth_middleware import auth_required
from utils.helpers import handle_server_error
from utils.service_registry import get_batch_processor
from utils.service_registry import get_document_classifier
from utils.service_registry import get_field_extractor
from utils.service_registry import get_image_preprocessor
from utils.service_registry import get_ocr_engine
from utils.service_registry import get_pdf_processor
from utils.service_registry import get_table_extractor

extract_bp = Blueprint("extract", __name__)

table_extractor = get_table_extractor()
batch_processor = get_batch_processor()

preprocessor = get_image_preprocessor()

ocr_engine = get_ocr_engine()

classifier = get_document_classifier()

field_extractor = get_field_extractor()

pdf_processor = get_pdf_processor()


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


def build_visual_context(ocr_result, table_results=None, page_number=None):

    lines = []

    if page_number is not None:
        lines.append(f"Page: {page_number}")

    lines.append(f"Detected text regions: {ocr_result.get('total_text_regions', 0)}")

    lines.append(
        f"Average OCR confidence: {round(ocr_result.get('average_confidence', 0), 4)}"
    )

    tables = []

    if table_results and isinstance(table_results.get("tables", []), list):
        tables = table_results.get("tables", [])

    lines.append(f"Detected tables: {len(tables)}")

    for table in tables[:3]:
        bbox = table.get("bbox", {})
        table_page = table.get("page", page_number)
        lines.append(f"Table {table.get('table_id')} page {table_page} bbox {bbox}")
        table_text = table.get("ocr_data", {}).get("full_text", "")
        if table_text:
            sample_text = table_text.strip().replace("\n", " ")[:200]
            lines.append(f"Table text sample: {sample_text}")

    largest_blocks = sorted(
        ocr_result.get("results", []),
        key=lambda r: (
            r.get("rect_bbox", {}).get("width", 0)
            * r.get("rect_bbox", {}).get("height", 0)
        ),
        reverse=True,
    )[:3]

    for index, block in enumerate(largest_blocks, start=1):
        bbox = block.get("rect_bbox", {})
        text = block.get("text", "").strip().replace("\n", " ")
        if not text:
            continue
        text = text[:120]
        lines.append(f"Text block {index} bbox {bbox} text: {text}")

    return "\n".join(lines)


def process_document_for_extraction(
    current_user_id, document, forced_document_type=None
):

    document.status = "processing"

    db.session.commit()

    file_extension = document.file_type.lower()

    processed_path = None

    all_pages = []

    all_results = []

    all_text = []

    all_tables = []

    document_visual_context = None

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

            page_visual_context = build_visual_context(
                page_ocr,
                page_tables,
                page_number=page["page"],
            )

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
                    "visual_context": page_visual_context,
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

        document_visual_context = "\n\n".join(
            [page["visual_context"] for page in all_pages if page.get("visual_context")]
        )[:8000]

        table_results = {
            "success": True,
            "total_tables": len(all_tables),
            "tables": all_tables,
        }

    else:

        preprocess_result = preprocessor.preprocess_image(
            document.upload_path,
            options={
                "deskew": False,
                "denoise": True,
                "binarize": False,
                "contrast_enhance": True,
                "crop_borders": False,
            },
        )

        processed_path = preprocess_result["processed_path"]

        document.preprocessing_options = {
            "deskew": False,
            "denoise": True,
            "binarize": False,
            "contrast_enhance": True,
            "crop_borders": False,
        }

        ocr_result = ocr_engine.extract_text(processed_path)

        document.preprocessed_path = processed_path
        document.processed_path = document.upload_path

    full_text = ocr_result["full_text"]

    table_results = table_extractor.detect_tables(processed_path)

    if not document_visual_context:
        document_visual_context = build_visual_context(
            ocr_result,
            table_results=table_results,
            page_number=1,
        )

    if not full_text:

        document.status = "failed"

        db.session.commit()

        if document.batch_id:

            batch_processor.update_batch_progress(document.batch_id)

        return {"success": False, "message": "OCR failed to extract text"}

    try:

        if forced_document_type:

            document_type = str(forced_document_type)

            confidence = 1.0

            extracted_data = field_extractor.extract_structured_fields(
                document_type,
                full_text,
                visual_context=document_visual_context,
            )

            extracted_data = ensure_dict_response(
                extracted_data,
                {"raw_text": full_text},
            )

        else:

            classification_response = classifier.classify_document(
                full_text,
                visual_context=document_visual_context,
            )

            classification_json = ensure_dict_response(
                classification_response,
                {
                    "document_type": "Unknown",
                    "confidence": 0,
                    "confidence_score": 0,
                },
            )

            document_type = str(
                classification_json.get("document_type", "Unknown") or "Unknown"
            )

            confidence = classification_json.get(
                "confidence",
                classification_json.get("confidence_score", 0),
            )

            normalized_document_type = document_type.lower()

            if normalized_document_type == "invoice":

                extracted_data = field_extractor.extract_invoice_fields(
                    full_text,
                    visual_context=document_visual_context,
                )

            elif normalized_document_type in {"bank statement", "statement"}:

                extracted_data = field_extractor.extract_bank_statement_fields(
                    full_text,
                    visual_context=document_visual_context,
                )

            elif normalized_document_type == "receipt":

                extracted_data = field_extractor.extract_receipt_fields(
                    full_text,
                    visual_context=document_visual_context,
                )

            elif normalized_document_type == "business card":

                extracted_data = field_extractor.extract_business_card_fields(
                    full_text,
                    visual_context=document_visual_context,
                )

            elif normalized_document_type == "form":

                extracted_data = field_extractor.extract_form_fields(
                    full_text,
                    visual_context=document_visual_context,
                )

            elif normalized_document_type in {"id card", "id_card", "identity card"}:

                extracted_data = field_extractor.extract_id_card_fields(
                    full_text,
                    visual_context=document_visual_context,
                )

            elif normalized_document_type == "contract":

                extracted_data = field_extractor.extract_contract_fields(
                    full_text,
                    visual_context=document_visual_context,
                )

            elif normalized_document_type in {"report", "report/letter", "letter"}:

                extracted_data = field_extractor.extract_report_fields(
                    full_text,
                    visual_context=document_visual_context,
                )

            elif normalized_document_type in {
                "handwritten",
                "handwritten note",
                "note",
            }:

                extracted_data = field_extractor.extract_handwritten_fields(
                    full_text,
                    visual_context=document_visual_context,
                )

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

    if document.file_type and document.file_type.lower() != "pdf":
        document.processed_path = document.upload_path
    else:
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
        "visual_context": document_visual_context,
        "extracted_data": extracted_data,
        "tables": table_results,
    }


@extract_bp.route("/api/extract", methods=["POST"])
@auth_required()
def extract_document(current_user_id):

    document = None

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

        if document.status == "failed":

            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Cannot extract from a failed document. Use the retry action to reprocess.",
                    }
                ),
                400,
            )

        result = process_document_for_extraction(current_user_id, document)

        return jsonify(result), (200 if result.get("success") else 500)

    except Exception as error:

        # Only mark as failed if exception occurred before processing completed
        # If process_document_for_extraction succeeded, it already committed status="completed"
        try:

            if document and document.status != "completed":

                document.status = "failed"

                db.session.commit()

        except Exception:
            pass

        return handle_server_error(error)


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

            if document.status == "failed":
                processed_documents.append(
                    {
                        "document_id": document.id,
                        "status": "failed",
                    }
                )
                continue

            result = process_document_for_extraction(current_user_id, document)

            processed_documents.append(
                {
                    "document_id": document.id,
                    "status": "completed" if result.get("success") else "failed",
                }
            )

        return jsonify({"success": True, "processed_documents": processed_documents})

    except Exception as error:

        return handle_server_error(error)
