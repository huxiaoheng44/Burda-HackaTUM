from pydantic_settings import BaseSettings

class AzureOpenAIConfig(BaseSettings):
    AZURE_OPENAI_ENDPOINT: str = "https://hackatum-2024.openai.azure.com"
    AZURE_OPENAI_API_KEY: str = ""  # Set via environment variable
    AZURE_OPENAI_DEPLOYMENT_NAME: str = "text-embedding-ada-002"
    AZURE_OPENAI_API_VERSION: str = "2023-05-15"

ai_config = AzureOpenAIConfig()