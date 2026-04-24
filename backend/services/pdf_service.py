from pathlib import Path

import httpx
from fastapi import HTTPException, status

from config import settings


async def request_pdf_generation(payload: dict) -> str:
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(settings.pdf_service_url, json=payload)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="PDF service is unavailable",
        ) from exc

    data = response.json()
    pdf_path = data.get("pdf_path")
    if not pdf_path:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="PDF service did not return a file path",
        )

    relative = Path(pdf_path).relative_to(settings.upload_dir).as_posix()
    return f"/uploads/{relative}"
