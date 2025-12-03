from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BookingBase(BaseModel):
    """Base booking schema"""
    property_id: int
    guest_address: str
    host_address: str
    check_in: int = Field(..., description="Check-in block height")
    check_out: int = Field(..., description="Check-out block height")
    total_amount: int
    platform_fee: int
    host_payout: int
    escrowed_amount: int
    status: str = Field(..., max_length=20)


class BookingCreate(BookingBase):
    """Schema for creating booking from blockchain event"""
    blockchain_id: int


class BookingUpdate(BaseModel):
    """Schema for updating booking status"""
    status: Optional[str] = None
    escrowed_amount: Optional[int] = None


class BookingResponse(BookingBase):
    """Schema for returning booking data"""
    id: int
    blockchain_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BookingFilters(BaseModel):
    """Schema for filtering bookings"""
    guest_address: Optional[str] = None
    host_address: Optional[str] = None
    property_id: Optional[int] = None
    status: Optional[str] = None

    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)