from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.review import Review
from app.models.booking import Booking
from app.models.property import Property
from app.schemas.review import UserStats

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_address}/stats", response_model=UserStats)
async def get_user_stats(
        user_address: str,
        db: AsyncSession = Depends(get_db)
):
    """
    Get user reputation statistics.

    Returns:
    - Total reviews received
    - Average rating
    - Total bookings as guest
    - Total bookings as host
    """

    # Get review stats
    review_query = select(
        func.count(Review.id).label("total_reviews"),
        func.avg(Review.rating).label("avg_rating")
    ).where(Review.reviewee_address == user_address)

    review_result = await db.execute(review_query)
    review_stats = review_result.one()

    # Get booking stats as guest
    guest_booking_query = select(func.count(Booking.id)).where(
        Booking.guest_address == user_address
    )
    guest_result = await db.execute(guest_booking_query)
    total_as_guest = guest_result.scalar()

    # Get booking stats as host
    host_booking_query = select(func.count(Booking.id)).where(
        Booking.host_address == user_address
    )
    host_result = await db.execute(host_booking_query)
    total_as_host = host_result.scalar()

    return UserStats(
        total_reviews=review_stats.total_reviews or 0,
        average_rating=round(float(review_stats.avg_rating or 0), 2),
        total_bookings_as_guest=total_as_guest or 0,
        total_bookings_as_host=total_as_host or 0
    )


@router.get("/{user_address}/properties-count")
async def get_user_properties_count(
        user_address: str,
        db: AsyncSession = Depends(get_db)
):
    """Get count of properties owned by user"""
    query = select(func.count(Property.id)).where(
        Property.owner_address == user_address
    )
    result = await db.execute(query)
    count = result.scalar()

    return {"count": count or 0}