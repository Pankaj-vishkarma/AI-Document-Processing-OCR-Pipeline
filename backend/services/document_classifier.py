from groq import Groq

from config import Config
from utils.helpers import parse_json_response


class DocumentClassifier:

    def __init__(self):

        self.client = Groq(api_key=Config.GROQ_API_KEY)

    def parse_json_response(self, response_text):

        return parse_json_response(
            response_text,
            fallback={
                "document_type": "Unknown",
                "confidence": 0,
            },
        )

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

        if visual_context:
            prompt += f"\nDocument Visual Context:\n{visual_context}\n"

        response = self.client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        return self.parse_json_response(response.choices[0].message.content)
