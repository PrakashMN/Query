from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    app_name: str = "MyMane API"
    frontend_origin: str = "http://localhost:5173"
    sqlite_path: Path = BASE_DIR / "propdeal.db"
    upload_dir: Path = BASE_DIR / "uploads"
    pdf_service_url: str = "http://localhost:3001/generate-pdf"
    max_image_size_mb: int = 5
    max_document_size_mb: int = 20

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
