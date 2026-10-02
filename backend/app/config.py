"""ChangeLens configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""

    # AWS
    aws_region: str = "us-east-2"
    aws_profile: Optional[str] = None

    # Application mode
    changelens_mode: str = "demo"  # "demo" or "live"

    # Hindsight
    hindsight_api_url: str = "http://localhost:8888"
    hindsight_api_key: Optional[str] = None
    hindsight_bank_id: str = "changelens-operational-memory"

    # Bedrock LLM Integration
    bedrock_enabled: bool = True
    bedrock_model_id: str = "amazon.nova-lite-v1:0"
    bedrock_region: str = "us-east-2"

    # API Security / Mutating routes auth
    changelens_api_key: Optional[str] = None

    # Backend
    backend_port: int = 8000
    backend_host: str = "0.0.0.0"

    # Demo workload
    demo_function_name: str = "checkout-function"
    demo_api_name: str = "changelens-checkout-api"
    demo_table_name: str = "checkout-table"

    @property
    def is_demo(self) -> bool:
        return self.changelens_mode.lower() == "demo"

    @property
    def is_live(self) -> bool:
        return self.changelens_mode.lower() == "live"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
