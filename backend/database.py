# database.py
from typing import Any

IN_MEMORY_DB: dict[str, dict[str, Any]] = {}

async def connect_to_mongo() -> None:
    pass

async def close_mongo_connection() -> None:
    IN_MEMORY_DB.clear()

def get_database() -> dict[str, dict[str, Any]]:
    return IN_MEMORY_DB
