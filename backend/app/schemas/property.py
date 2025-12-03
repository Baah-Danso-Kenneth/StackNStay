from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PropertyImageUrls(BaseModel):
    """Image URLs in different sizes"""
    original: List[str] = []
    thumbnails: List[str] = []
    medium: List[str] = []
    large: List[str] = []


class PropertyBase(BaseModel):
    """Base property schema with common fields"""
    title: str = Field(..., max_length=200)
    description: str
    price_per_night: int = Field(..., gt=0, description="Price in micro-STX")
    location_city: Optional[str] = Field(None, max_length=100)
    location_country: Optional[str] = Field(None, max_length=100)
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    max_guests: Optional[int] = Field(None, ge=1)


class PropertySyncRequest(BaseModel):
    """Schema for syncing property from blockchain to database"""
    blockchain_id: int
    owner_address: str
    price_per_night: int = Field(..., gt=0, description="Price in micro-STX")
    location_tag: int
    metadata_uri: str
    ipfs_hash: str
    active: bool = True


class PropertyCreate(PropertyBase):
    """Schema for creating a property (from blockchain event)"""
    blockchain_id: int
    owner_address: str
    location_tag: int
    metadata_uri: str
    ipfs_hash: str
    active: bool = True


class PropertyUpdate(BaseModel):
    """Schema for updating property (e.g., after IPFS metadata fetched)"""
    title: Optional[str] = None
    description: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    max_guests: Optional[int] = None
    active: Optional[bool] = None


class PropertyResponse(BaseModel):
    """Schema for returning property data to frontend"""
    id: int
    blockchain_id: int
    owner_address: str
    price_per_night: int
    location_tag: int
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    metadata_uri: str
    ipfs_hash: Optional[str] = None
    active: bool

    # Property details
    title: Optional[str] = None
    description: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    max_guests: Optional[int] = None

    # Images
    image_urls: Optional[PropertyImageUrls] = None
    cover_image: Optional[str] = None  # Main listing image (medium size)

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PropertySearchFilters(BaseModel):
    """Schema for property search/filtering"""
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    location_tag: Optional[int] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    min_bedrooms: Optional[int] = None
    max_guests: Optional[int] = None
    active_only: bool = True

    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)