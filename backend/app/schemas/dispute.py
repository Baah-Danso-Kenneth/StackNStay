from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DisputeBase(BaseModel):
    """Base dispute schema"""
    booking_id: int
    raised_by: str
    reason: str
    evidence: str
    status: str = Field(..., max_length=20)


class DisputeCreate(DisputeBase):
    """Schema for creating dispute from blockchain event"""
    blockchain_id: int


class DisputeUpdate(BaseModel):
    """Schema for updating dispute resolution"""
    status: Optional[str] = None
    resolution: Optional[str] = None
    refund_percentage: Optional[int] = Field(None, ge=0, le=100)
    resolved_at: Optional[datetime] = None


class DisputeResponse(DisputeBase):
    """Schema for returning dispute data"""
    id: int
    blockchain_id: int
    resolution: Optional[str] = None
    refund_percentage: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True