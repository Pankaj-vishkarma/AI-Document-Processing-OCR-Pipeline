import ast
import json

from groq import Groq

from config import Config


class DocumentClassifier:

    def __init__(self):

        self.client = Groq(api_key=Config.GROQ_API_KEY)

    def parse_json_response(self, response_text):

        if isinstance(response_text, dict):
            return response_text

        text = "" if response_text is None else str(response_text)

        text = text.strip()

        if text.startswith("```json"):
            text = text[len("```json") :].strip()

        if text.startswith("```"):
            text = text[3:].strip()

        if text.endswith("```"):
            text = text[:-3].strip()

        candidates = [text]

        object_start = text.find("{")
        object_end = text.rfind("}")

        if object_start != -1 and object_end != -1 and object_end > object_start:
            candidates.append(text[object_start : object_end + 1])

        for candidate in candidates:

            try:

                parsed = json.loads(candidate)

                if isinstance(parsed, str):
                    return self.parse_json_response(parsed)

                return parsed

            except Exception:

                try:

                    parsed = ast.literal_eval(candidate)

                    if isinstance(parsed, str):
                        return self.parse_json_response(parsed)

                    return parsed

                except Exception:

                    continue

        return {
            "document_type": "Unknown",
            "confidence": 0,
        }

    def classify_document(self, extracted_text):

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

        Return JSON only:

        {{
            "document_type": "",
            "confidence": 0.0
        }}

        Rules:
        - Return one of the listed document types.
        - If the document is a bank statement, use "Bank Statement".
        - Confidence should be a number between 0 and 1.

        Document Text:
        {extracted_text}
        """

        response = self.client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        return self.parse_json_response(response.choices[0].message.content)
