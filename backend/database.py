import json
import sqlite3
from pathlib import Path
from typing import Any
from config import settings

# Path to the persistent database file
DB_FILE = settings.sqlite_path

def init_db():
    """Ensure the database and table exist."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, data TEXT)")
    conn.commit()
    conn.close()

from fastapi.encoders import jsonable_encoder

def save_to_db(data_dict: dict[str, Any]):
    """Saves the entire dictionary to SQLite."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # We store each property as a separate row for better reliability
    for key, value in data_dict.items():
        # Important: use jsonable_encoder to handle dates/datetimes
        serialized_data = json.dumps(jsonable_encoder(value))
        cursor.execute(
            "INSERT OR REPLACE INTO store (key, data) VALUES (?, ?)",
            (key, serialized_data)
        )
    conn.commit()
    conn.close()

def load_from_db() -> dict[str, Any]:
    """Loads all data from SQLite into the dictionary."""
    init_db()
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT key, data FROM store")
    rows = cursor.fetchall()
    conn.close()
    return {row[0]: json.loads(row[1]) for row in rows}

# Global in-memory cache
IN_MEMORY_DB: dict[str, dict[str, Any]] = load_from_db()

async def connect_to_mongo() -> None:
    pass

async def close_mongo_connection() -> None:
    save_to_db(IN_MEMORY_DB)

def get_database() -> dict[str, dict[str, Any]]:
    return IN_MEMORY_DB

def persist_db():
    """Explicitly save current state to disk."""
    save_to_db(IN_MEMORY_DB)
