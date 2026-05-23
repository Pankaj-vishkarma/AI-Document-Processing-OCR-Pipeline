from groq import Groq

from config import Config


class DocumentClassifier:

    def __init__(self):

        self.client = Groq(api_key=Config.GROQ_API_KEY)

    def classify_document(self, extracted_text):

        prompt = f"""
        Classify this document into one category:

        - Invoice
        - Receipt
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

        Document Text:
        {extracted_text}
        """

        response = self.client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        return response.choices[0].message.content
