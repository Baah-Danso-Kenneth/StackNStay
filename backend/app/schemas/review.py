from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReviewBase(BaseModel):
    """Base review schema"""
    booking_id: int
    reviewer_address: str
    reviewee_address: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    """Schema for creating review from blockchain event"""
    blockchain_id: int


class ReviewResponse(ReviewBase):
    """Schema for returning review data"""
    id: int
    blockchain_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """User reputation statistics"""
    total_reviews: int
    average_rating: float  # Calculated from blockchain data
    total_bookings_as_guest: int
    total_bookings_as_host: int