import uuid
from datetime import date, datetime, timezone
from typing import Any

from fastapi.encoders import jsonable_encoder
from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status

from ..database import get_database
from ..models.property import (
    DealStatus,
    PropertyCreate,
    PropertyListItem,
    PropertyResponse,
    PropertyUpdate,
)
from ..services.file_service import save_upload
from ..services.pdf_service import request_pdf_generation


router = APIRouter(prefix="/properties", tags=["properties"])

def properties_database() -> dict[str, dict[str, Any]]:
    return get_database()

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def fetch_property_or_404(property_id: str) -> dict[str, Any]:
    db = properties_database()
    if property_id not in db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    return db[property_id]

@router.get("", response_model=list[PropertyListItem])
async def list_properties(
    search: str | None = Query(default=None),
    type: str | None = Query(default=None),
    deal_type: str | None = Query(default=None),
    status_filter: DealStatus | None = Query(default=None, alias="status"),
):
    db = properties_database()
    return list(db.values())

@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(payload: PropertyCreate):
    now = now_utc()
    property_id = uuid.uuid4().hex
    
    document = payload.model_dump(mode="json")
    document["id"] = property_id
    document["images"] = []
    document["documents"] = document.get("documents", [])
    document["generated_pdf"] = None
    document["buyer_name"] = document.get("buyer_name", "")
    document["buyer_contact"] = document.get("buyer_contact", "")
    document["buyer_id_proof"] = None
    document["deal_price"] = document.get("deal_price", 0.0)
    document["payment_mode"] = document.get("payment_mode", "")
    document["possession_date"] = document.get("possession_date")
    document["deal_status"] = document.get("deal_status", "Draft")
    document["signature_fields"] = document.get("signature_fields", {})
    
    document["created_at"] = now
    document["updated_at"] = now
    
    db = properties_database()
    db[property_id] = document
    
    return document

@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: str):
    return fetch_property_or_404(property_id)

@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(property_id: str, payload: PropertyUpdate):
    property_doc = fetch_property_or_404(property_id)
    
    updates = payload.model_dump(exclude_none=True, mode="json")
    if updates:
        for key, value in updates.items():
            property_doc[key] = value
        property_doc["updated_at"] = now_utc()
        
    return property_doc

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(property_id: str):
    db = properties_database()
    if property_id not in db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    del db[property_id]

@router.post("/{property_id}/images", response_model=list[str])
async def upload_images(property_id: str, files: list[UploadFile] = File(...)):
    property_doc = fetch_property_or_404(property_id)
    saved_paths = []
    for upload in files:
        path = await save_upload(upload, property_id, "images", max_size_mb=2)
        saved_paths.append(path)
        
    property_doc["images"].extend(saved_paths)
    property_doc["updated_at"] = now_utc()
    return saved_paths

@router.post("/{property_id}/documents", response_model=list[str])
async def upload_documents(property_id: str, files: list[UploadFile] = File(...)):
    property_doc = fetch_property_or_404(property_id)
    saved_paths = []
    for upload in files:
        path = await save_upload(upload, property_id, "documents", max_size_mb=20)
        saved_paths.append(path)
        
    property_doc["documents"].extend(saved_paths)
    property_doc["updated_at"] = now_utc()
    return saved_paths

@router.post("/{property_id}/floor-plan", response_model=dict[str, str])
async def upload_floor_plan(property_id: str, file: UploadFile = File(...)):
    property_doc = fetch_property_or_404(property_id)
    path = await save_upload(file, property_id, "floor-plan", max_size_mb=2)
    property_doc["floor_plan"] = path
    property_doc["updated_at"] = now_utc()
    return {"floor_plan": path}

@router.post("/{property_id}/generate-pdf", response_model=dict[str, str])
async def generate_pdf(property_id: str):
    property_doc = fetch_property_or_404(property_id)
    pdf_url = await request_pdf_generation({"property": jsonable_encoder(property_doc)})
    
    property_doc["generated_pdf"] = pdf_url
    property_doc["updated_at"] = now_utc()
    
    return {"pdf_url": pdf_url}
