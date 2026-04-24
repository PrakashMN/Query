from datetime import date, datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PropertyType(str, Enum):
    residential = "Residential"
    commercial = "Commercial"
    land_plot = "Land/Plot"
    industrial = "Industrial"


class DealType(str, Enum):
    buy = "Buy"
    sell = "Sell"
    rent = "Rent"
    ready_to_move = "Ready to Move"
    under_construction = "Under Construction"


class PaymentMode(str, Enum):
    cash = "Cash"
    bank_transfer = "Bank Transfer"
    cheque = "Cheque"
    loan = "Loan"


class DealStatus(str, Enum):
    draft = "Draft"
    active = "Active"
    negotiation = "Negotiation"
    closed = "Closed"


class SignatureFields(BaseModel):
    seller_signed: bool = False
    buyer_signed: bool = False
    admin_signed: bool = False
    seller_signed_at: datetime | None = None
    buyer_signed_at: datetime | None = None
    admin_signed_at: datetime | None = None


class PropertyBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    type: PropertyType
    deal_type: DealType
    location: str = Field(..., min_length=3, max_length=300)
    area: float = Field(..., gt=0)
    price: float = Field(..., ge=0)
    description: str = ""
    amenities: list[str] = Field(default_factory=list)
    documents: list[str] = Field(default_factory=list)
    seller_name: str = ""
    seller_contact: str = ""
    seller_id_proof: str | None = None
    buyer_name: str = ""
    buyer_contact: str = ""
    buyer_id_proof: str | None = None
    deal_price: float | None = Field(default=None, ge=0)
    payment_mode: PaymentMode | None = None
    possession_date: date | None = None
    deal_status: DealStatus = DealStatus.draft
    signature_fields: SignatureFields = Field(default_factory=SignatureFields)
    # myMane listing fields
    bhk_type: str | None = None          # e.g. "2BHK", "3BHK"
    facing: str | None = None             # e.g. "East", "North"
    carpet_area: float | None = None      # in sq.ft
    balcony_count: int | None = None      # number of balconies
    year_built: int | None = None         # e.g. 2021
    map_url: str | None = None            # Google Maps or similar link
    floor_plan: str | None = None         # uploaded floor plan image URL


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    type: PropertyType | None = None
    deal_type: DealType | None = None
    location: str | None = Field(default=None, min_length=3, max_length=300)
    area: float | None = Field(default=None, gt=0)
    price: float | None = Field(default=None, ge=0)
    description: str | None = None
    amenities: list[str] | None = None
    documents: list[str] | None = None
    seller_name: str | None = None
    seller_contact: str | None = None
    seller_id_proof: str | None = None
    buyer_name: str | None = None
    buyer_contact: str | None = None
    buyer_id_proof: str | None = None
    deal_price: float | None = Field(default=None, ge=0)
    payment_mode: PaymentMode | None = None
    possession_date: date | None = None
    deal_status: DealStatus | None = None
    signature_fields: SignatureFields | None = None
    # myMane listing fields
    bhk_type: str | None = None
    facing: str | None = None
    carpet_area: float | None = None
    balcony_count: int | None = None
    year_built: int | None = None
    map_url: str | None = None
    floor_plan: str | None = None


class PropertyInDB(PropertyBase):
    id: str
    images: list[str] = Field(default_factory=list)
    generated_pdf: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PropertyListItem(BaseModel):
    id: str
    title: str
    type: PropertyType
    deal_type: DealType
    location: str
    area: float
    price: float
    deal_status: DealStatus
    images: list[str] = Field(default_factory=list)
    created_at: datetime


class PropertyResponse(PropertyBase):
    id: str
    images: list[str] = Field(default_factory=list)
    generated_pdf: str | None = None
    created_at: datetime
    updated_at: datetime
