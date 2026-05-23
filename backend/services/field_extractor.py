from groq import Groq

from config import Config


class FieldExtractor:

    def __init__(self):

        self.client = Groq(api_key=Config.GROQ_API_KEY)

    def generate_response(self, prompt):

        response = self.client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        return response.choices[0].message.content

    def extract_invoice_fields(self, text):

        prompt = f"""
        Extract invoice fields.

        Return JSON only.

        Required fields:
        vendor
        invoice_number
        invoice_date
        due_date
        subtotal
        tax
        total
        line_items

        Text:
        {text}
        """

        return self.generate_response(prompt)

    def extract_receipt_fields(self, text):

        prompt = f"""
        Extract receipt fields.

        Return JSON only.

        Text:
        {text}
        """

        return self.generate_response(prompt)

    def extract_business_card_fields(self, text):

        prompt = f"""
        Extract business card fields.

        Return JSON only.

        Text:
        {text}
        """

        return self.generate_response(prompt)
