import mimetypes
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from ..config import settings


IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
DOCUMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
    "image/jpeg",
    "image/png",
    "image/webp",
}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"}


def ensure_property_dirs(property_id: str) -> tuple[Path, Path]:
    base = settings.upload_dir / "properties" / property_id
    images_dir = base / "images"
    documents_dir = base / "documents"
    images_dir.mkdir(parents=True, exist_ok=True)
    documents_dir.mkdir(parents=True, exist_ok=True)
    return images_dir, documents_dir


async def save_upload(
    upload: UploadFile,
    property_id: str,
    category: str,
    max_size_mb: int,
) -> str:
    images_dir, documents_dir = ensure_property_dirs(property_id)
    destination_dir = images_dir if category == "images" else documents_dir

    content = await upload.read()
    size_limit = max_size_mb * 1024 * 1024
    if len(content) > size_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{upload.filename} exceeds the {max_size_mb}MB limit",
        )

    allowed_types = IMAGE_TYPES if category == "images" else DOCUMENT_TYPES
    allowed_extensions = IMAGE_EXTENSIONS if category == "images" else DOCUMENT_EXTENSIONS
    suffix = Path(upload.filename or "").suffix.lower()
    guessed_type = mimetypes.guess_type(upload.filename or "")[0]
    content_type = upload.content_type or guessed_type
    valid_type = content_type in allowed_types if content_type else False
    valid_extension = suffix in allowed_extensions
    if not valid_type and not valid_extension:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{upload.filename} has an unsupported file type",
        )

    filename = f"{uuid4().hex}{suffix}"
    target = destination_dir / filename
    target.write_bytes(content)

    relative_path = target.relative_to(settings.upload_dir).as_posix()
    return f"/uploads/{relative_path}"
