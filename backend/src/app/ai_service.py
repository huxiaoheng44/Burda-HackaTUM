from openai import AzureOpenAI
from .ai_config import ai_config
from loguru import logger

class AINewsRewriter:
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=ai_config.AZURE_OPENAI_API_KEY,
            api_version=ai_config.AZURE_OPENAI_API_VERSION,
            azure_endpoint=ai_config.AZURE_OPENAI_ENDPOINT
        )

    async def rewrite_news(self, original_text: str) -> str:
        try:
            # Create a system message that instructs the model how to rewrite the news
            system_message = """You are an AI assistant that rewrites news articles to make them more engaging 
            while maintaining accuracy and factual content. Follow these guidelines:
            1. Keep the main facts and message intact
            2. Make the language more engaging and accessible
            3. Maintain a professional tone
            4. Keep the length similar to the original
            5. Preserve all factual information"""

            # Create the completion request
            response = self.client.chat.completions.create(
                model=ai_config.AZURE_OPENAI_DEPLOYMENT_NAME,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": f"Please rewrite this news article: {original_text}"}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            # Extract the rewritten text from the response
            rewritten_text = response.choices[0].message.content.strip()
            return rewritten_text

        except Exception as e:
            logger.error(f"Error rewriting news with AI: {str(e)}")
            return original_text  # Return original text if AI rewriting fails