import json
import re
from copy import deepcopy
from pathlib import Path

from groq import Groq

from config import Config
from utils.helpers import normalize_text
from utils.helpers import parse_json_response


class FieldExtractor:

    SCHEMA_DIR = Path(__file__).resolve().parent.parent / "extraction_schemas"

    DEFAULT_SCHEMAS = {
        "invoice": {
            "vendor_name": "",
            "invoice_number": "",
            "invoice_date": "",
            "due_date": "",
            "subtotal": "",
            "tax": "",
            "total": "",
            "line_items": [],
        },
        "receipt": {
            "merchant_name": "",
            "receipt_number": "",
            "receipt_date": "",
            "subtotal": "",
            "tax": "",
            "total": "",
            "items": [],
        },
        "business_card": {
            "name": "",
            "job_title": "",
            "company": "",
            "email": "",
            "phone": "",
            "website": "",
            "address": "",
        },
        "bank_statement": {
            "bank_name": "",
            "account_number": "",
            "customer_name": "",
            "transactions": [],
            "balances": {
                "opening_balance": "",
                "closing_balance": "",
                "available_balance": "",
                "currency": "",
            },
        },
        "form": {
            "form_name": "",
            "form_id": "",
            "submission_date": "",
            "fields": {},
        },
        "id_card": {
            "full_name": "",
            "id_number": "",
            "date_of_birth": "",
            "issue_date": "",
            "expiry_date": "",
            "address": "",
            "nationality": "",
        },
        "contract": {
            "contract_title": "",
            "parties": [],
            "effective_date": "",
            "end_date": "",
            "signatories": [],
            "key_terms": [],
        },
        "report": {
            "title": "",
            "author": "",
            "date": "",
            "summary": "",
            "sections": [],
        },
        "handwritten": {
            "title": "",
            "date": "",
            "author": "",
            "content": "",
        },
    }

    def __init__(self):

        self.client = Groq(api_key=Config.GROQ_API_KEY)

    def generate_response(self, prompt):

        response = self.client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        return response.choices[0].message.content

    def load_schema(self, schema_name):

        fallback_schema = deepcopy(self.DEFAULT_SCHEMAS.get(schema_name, {}))

        schema_file = self.SCHEMA_DIR / f"{schema_name}.json"

        if not schema_file.exists():
            return fallback_schema

        try:

            with schema_file.open("r", encoding="utf-8") as schema_handle:

                file_contents = schema_handle.read().strip()

            if not file_contents:
                return fallback_schema

            loaded_schema = json.loads(file_contents)

            if isinstance(loaded_schema, dict):
                return loaded_schema

        except Exception:

            pass

        return fallback_schema

    def parse_json_response(self, response_text, fallback=None):
        return parse_json_response(response_text, fallback=fallback)

    def normalize_money_value(self, value):

        if value is None:
            return ""

        normalized_value = self.normalize_text(value)

        normalized_value = normalized_value.replace(",", "")

        return normalized_value.strip()

    def normalize_sequence(self, value):

        if value is None:
            return []

        if isinstance(value, list):
            return value

        if isinstance(value, dict):
            return [value]

        if isinstance(value, str):
            parsed_value = self.parse_json_response(value, fallback=[])

            if isinstance(parsed_value, list):
                return parsed_value

            if isinstance(parsed_value, dict):
                return [parsed_value]

            lines = [line.strip() for line in value.splitlines() if line.strip()]

            return lines

        return []

    def normalize_invoice_response(self, parsed_response, source_text):

        normalized_response = deepcopy(self.load_schema("invoice"))

        if not isinstance(parsed_response, dict):
            normalized_response["raw_text"] = source_text
            return normalized_response

        normalized_response["vendor_name"] = self.normalize_text(
            parsed_response.get("vendor_name")
            or parsed_response.get("vendor")
            or parsed_response.get("supplier")
            or parsed_response.get("merchant_name")
            or ""
        )
        normalized_response["invoice_number"] = self.clean_invoice_number(
            parsed_response.get("invoice_number", ""),
            source_text,
        )
        normalized_response["invoice_date"] = self.normalize_text(
            parsed_response.get("invoice_date") or parsed_response.get("date") or ""
        )
        normalized_response["due_date"] = self.normalize_text(
            parsed_response.get("due_date") or ""
        )
        normalized_response["subtotal"] = self.normalize_money_value(
            parsed_response.get("subtotal") or parsed_response.get("sub_total") or ""
        )
        normalized_response["tax"] = self.normalize_money_value(
            parsed_response.get("tax") or parsed_response.get("tax_amount") or ""
        )
        normalized_response["total"] = self.normalize_money_value(
            parsed_response.get("total")
            or parsed_response.get("grand_total")
            or parsed_response.get("amount_due")
            or ""
        )
        normalized_response["line_items"] = self.normalize_sequence(
            parsed_response.get("line_items") or parsed_response.get("items") or []
        )

        for key, value in parsed_response.items():
            if key not in normalized_response:
                normalized_response[key] = value

        return normalized_response

    def normalize_receipt_response(self, parsed_response, source_text):

        normalized_response = deepcopy(self.load_schema("receipt"))

        if not isinstance(parsed_response, dict):
            normalized_response["raw_text"] = source_text
            return normalized_response

        normalized_response["merchant_name"] = self.normalize_text(
            parsed_response.get("merchant_name")
            or parsed_response.get("vendor_name")
            or parsed_response.get("vendor")
            or ""
        )
        normalized_response["receipt_number"] = self.normalize_text(
            parsed_response.get("receipt_number")
            or parsed_response.get("invoice_number")
            or ""
        )
        normalized_response["receipt_date"] = self.normalize_text(
            parsed_response.get("receipt_date") or parsed_response.get("date") or ""
        )
        normalized_response["subtotal"] = self.normalize_money_value(
            parsed_response.get("subtotal") or parsed_response.get("sub_total") or ""
        )
        normalized_response["tax"] = self.normalize_money_value(
            parsed_response.get("tax") or parsed_response.get("tax_amount") or ""
        )
        normalized_response["total"] = self.normalize_money_value(
            parsed_response.get("total") or parsed_response.get("amount") or ""
        )
        normalized_response["items"] = self.normalize_sequence(
            parsed_response.get("items") or parsed_response.get("line_items") or []
        )

        for key, value in parsed_response.items():
            if key not in normalized_response:
                normalized_response[key] = value

        return normalized_response

    def normalize_business_card_response(self, parsed_response, source_text):

        normalized_response = deepcopy(self.load_schema("business_card"))

        if not isinstance(parsed_response, dict):
            normalized_response["raw_text"] = source_text
            return normalized_response

        normalized_response["name"] = self.normalize_text(
            parsed_response.get("name") or parsed_response.get("full_name") or ""
        )
        normalized_response["job_title"] = self.normalize_text(
            parsed_response.get("job_title") or parsed_response.get("title") or ""
        )
        normalized_response["company"] = self.normalize_text(
            parsed_response.get("company") or parsed_response.get("organization") or ""
        )
        normalized_response["email"] = self.normalize_text(
            parsed_response.get("email") or ""
        )
        normalized_response["phone"] = self.normalize_text(
            parsed_response.get("phone") or parsed_response.get("mobile") or ""
        )
        normalized_response["website"] = self.normalize_text(
            parsed_response.get("website") or parsed_response.get("web") or ""
        )
        normalized_response["address"] = self.normalize_text(
            parsed_response.get("address") or ""
        )

        for key, value in parsed_response.items():
            if key not in normalized_response:
                normalized_response[key] = value

        return normalized_response

    def normalize_bank_statement_response(self, parsed_response, source_text):

        normalized_response = deepcopy(self.load_schema("bank_statement"))

        if not isinstance(parsed_response, dict):
            normalized_response["raw_text"] = source_text
            return normalized_response

        normalized_response["bank_name"] = self.normalize_text(
            parsed_response.get("bank_name") or parsed_response.get("bank") or ""
        )
        normalized_response["account_number"] = self.normalize_text(
            parsed_response.get("account_number")
            or parsed_response.get("account_no")
            or parsed_response.get("account")
            or ""
        )
        normalized_response["customer_name"] = self.normalize_text(
            parsed_response.get("customer_name")
            or parsed_response.get("account_holder")
            or parsed_response.get("name")
            or ""
        )
        normalized_response["transactions"] = self.normalize_sequence(
            parsed_response.get("transactions") or []
        )

        balances = parsed_response.get("balances")

        if isinstance(balances, dict):
            normalized_response["balances"].update(
                {
                    "opening_balance": self.normalize_money_value(
                        balances.get("opening_balance") or balances.get("opening") or ""
                    ),
                    "closing_balance": self.normalize_money_value(
                        balances.get("closing_balance") or balances.get("closing") or ""
                    ),
                    "available_balance": self.normalize_money_value(
                        balances.get("available_balance")
                        or balances.get("available")
                        or ""
                    ),
                    "currency": self.normalize_text(balances.get("currency") or ""),
                }
            )

        for key, value in parsed_response.items():
            if key not in normalized_response:
                normalized_response[key] = value

        return normalized_response

    def normalize_generic_response(self, parsed_response, source_text):

        if isinstance(parsed_response, dict):
            return parsed_response

        return {
            "raw_text": source_text,
        }

    def _extract_with_schema(self, schema_name, prompt_title, text):

        normalized_text = self.normalize_text(text)

        schema = self.load_schema(schema_name)

        prompt = f"""
        {prompt_title}

        Return a single valid JSON object only. Do not include markdown, code fences, or commentary.

        Match this schema exactly:
        {json.dumps(schema, ensure_ascii=False, indent=2)}

        OCR Text:
        {normalized_text}
        """

        response_text = self.generate_response(prompt)

        parsed_response = self.parse_json_response(response_text, fallback=schema)

        return self.normalize_generic_response(parsed_response, normalized_text)

    def normalize_text(self, text):

        return normalize_text(text, replace_pipe=True)

    def clean_invoice_number(self, invoice_number, source_text=""):

        candidates = [invoice_number, source_text]

        for candidate in candidates:

            if not candidate:

                continue

            normalized_candidate = self.normalize_text(candidate).upper()
            normalized_candidate = normalized_candidate.replace(" ", "")
            normalized_candidate = normalized_candidate.replace("/", "")
            normalized_candidate = normalized_candidate.replace("-", "")
            normalized_candidate = normalized_candidate.replace("_", "")
            normalized_candidate = re.sub(r"[^A-Z0-9]", "", normalized_candidate)

            match = re.search(r"(?:INV|INVOICE)(\d{4})(\d{1,8})", normalized_candidate)

            if match:

                return f"INV-{match.group(1)}-{match.group(2)}"

            match = re.search(r"(?:INV|INVOICE)(\d{2,12})", normalized_candidate)

            if match:

                return f"INV-{match.group(1)}"

            match = re.search(r"([A-Z]{2,10})(\d{4})(\d{1,8})", normalized_candidate)

            if match:

                return f"{match.group(1)}-{match.group(2)}-{match.group(3)}"

        return self.normalize_text(invoice_number)

    def extract_invoice_fields(self, text):

        normalized_text = self.normalize_text(text)

        schema = self.load_schema("invoice")

        prompt = f"""
        Extract invoice fields from the OCR text.

        Return a single valid JSON object only. Do not include markdown, code fences, or commentary.

        Match this schema exactly:
        {json.dumps(schema, ensure_ascii=False, indent=2)}

        Rules:
        - Use English text and ASCII numerals only.
        - Populate line_items as an array of objects when present.
        - If a field is missing, use an empty string or empty array.
        - Normalize invoice_number to a clean invoice id if possible.

        OCR Text:
        {normalized_text}
        """

        response_text = self.generate_response(prompt)

        parsed_response = self.parse_json_response(response_text, fallback=schema)

        return self.normalize_invoice_response(parsed_response, normalized_text)

    def extract_bank_statement_fields(self, text):

        normalized_text = self.normalize_text(text)

        schema = self.load_schema("bank_statement")

        prompt = f"""
        Extract bank statement fields from the OCR text.

        Return a single valid JSON object only. Do not include markdown, code fences, or commentary.

        Match this schema exactly:
        {json.dumps(schema, ensure_ascii=False, indent=2)}

        Rules:
        - Use English text and ASCII numerals only.
        - transactions must be an array.
        - balances must be an object with opening_balance, closing_balance, available_balance, and currency.
        - Use empty strings or empty arrays when values are missing.

        OCR Text:
        {normalized_text}
        """

        response_text = self.generate_response(prompt)

        parsed_response = self.parse_json_response(response_text, fallback=schema)

        return self.normalize_bank_statement_response(parsed_response, normalized_text)

    def extract_receipt_fields(self, text):

        normalized_text = self.normalize_text(text)

        schema = self.load_schema("receipt")

        prompt = f"""
        Extract receipt fields from the OCR text.

        Return a single valid JSON object only. Do not include markdown, code fences, or commentary.

        Match this schema exactly:
        {json.dumps(schema, ensure_ascii=False, indent=2)}

        OCR Text:
        {normalized_text}
        """

        response_text = self.generate_response(prompt)

        parsed_response = self.parse_json_response(response_text, fallback=schema)

        return self.normalize_receipt_response(parsed_response, normalized_text)

    def extract_business_card_fields(self, text):

        normalized_text = self.normalize_text(text)

        schema = self.load_schema("business_card")

        prompt = f"""
        Extract business card fields from the OCR text.

        Return a single valid JSON object only. Do not include markdown, code fences, or commentary.

        Match this schema exactly:
        {json.dumps(schema, ensure_ascii=False, indent=2)}

        OCR Text:
        {normalized_text}
        """

        response_text = self.generate_response(prompt)

        parsed_response = self.parse_json_response(response_text, fallback=schema)

        return self.normalize_business_card_response(parsed_response, normalized_text)

    def extract_form_fields(self, text):

        return self._extract_with_schema(
            "form",
            "Extract form fields from the OCR text.",
            text,
        )

    def extract_id_card_fields(self, text):

        return self._extract_with_schema(
            "id_card",
            "Extract ID card fields from the OCR text.",
            text,
        )

    def extract_contract_fields(self, text):

        return self._extract_with_schema(
            "contract",
            "Extract contract fields from the OCR text.",
            text,
        )

    def extract_report_fields(self, text):

        return self._extract_with_schema(
            "report",
            "Extract report fields from the OCR text.",
            text,
        )

    def extract_handwritten_fields(self, text):

        return self._extract_with_schema(
            "handwritten",
            "Extract handwritten note fields from the OCR text.",
            text,
        )

    def extract_structured_fields(self, document_type, text):

        normalized_document_type = self.normalize_text(document_type).lower()

        if normalized_document_type == "invoice":
            return self.extract_invoice_fields(text)

        if normalized_document_type in {"bank statement", "statement"}:
            return self.extract_bank_statement_fields(text)

        if normalized_document_type == "receipt":
            return self.extract_receipt_fields(text)

        if normalized_document_type == "business card":
            return self.extract_business_card_fields(text)

        if normalized_document_type == "form":
            return self.extract_form_fields(text)

        if normalized_document_type in {"id card", "id_card", "identity card"}:
            return self.extract_id_card_fields(text)

        if normalized_document_type == "contract":
            return self.extract_contract_fields(text)

        if normalized_document_type in {"report", "report/letter", "letter"}:
            return self.extract_report_fields(text)

        if normalized_document_type in {"handwritten", "handwritten note", "note"}:
            return self.extract_handwritten_fields(text)

        return self.normalize_generic_response({}, self.normalize_text(text))
