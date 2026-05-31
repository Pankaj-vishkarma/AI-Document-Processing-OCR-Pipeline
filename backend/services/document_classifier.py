from groq import Groq

from config import Config
from utils.helpers import parse_json_response


class DocumentClassifier:

    def __init__(self):

        self.client = Groq(api_key=Config.GROQ_API_KEY)

    def parse_json_response(self, response_text):

        parsed = parse_json_response(
            response_text,
            fallback={
                "document_type": "Unknown",
                "confidence_score": 0.0,
                "confidence": 0.0,
            },
        )

        if isinstance(parsed, dict):
            if "confidence_score" not in parsed and "confidence" in parsed:
                parsed["confidence_score"] = parsed.get("confidence", 0.0)
            if "confidence" not in parsed and "confidence_score" in parsed:
                parsed["confidence"] = parsed.get("confidence_score", 0.0)

            parsed["document_type"] = str(
                parsed.get("document_type", "Unknown") or "Unknown"
            )
            parsed["confidence_score"] = float(
                parsed.get("confidence_score", 0.0) or 0.0
            )
            parsed["confidence"] = float(
                parsed.get("confidence", parsed["confidence_score"])
                or parsed["confidence_score"]
            )

        return parsed

    def classify_document(self, extracted_text, visual_context=None):

        prompt = f"""
        Classify this document into one category:

        - Invoice
        - Receipt
        - Bank Statement
        - Business Card
        - Form
        - ID Card
        - Contract
        - Report
        - Handwritten Note
        - Whiteboard
        - Table/Spreadsheet

        Return JSON only with the exact keys:

        {{
            "document_type": "",
            "confidence_score": 0.0
        }}

        Rules:
        - document_type must be exactly one of the listed categories.
        - confidence_score must be a number between 0 and 1.
        - Do not return any additional text, commentary, or keys.
        - Use only the OCR extracted document text to determine the type.

        Document Text:
        {extracted_text}
        """

        response = self.client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        return self.parse_json_response(response.choices[0].message.content)
