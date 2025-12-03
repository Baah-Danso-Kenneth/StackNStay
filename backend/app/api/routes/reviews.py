from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.core.database import get_db
from app.models.review import Review
from app.models.booking import Booking
from app.schemas.review import ReviewResponse, UserStats

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/", response_model=List[ReviewResponse])
async def list_reviews(
        db: AsyncSession = Depends(get_db),
        booking_id: Optional[int] = Query(None),
        reviewer_address: Optional[str] = Query(None),
        reviewee_address: Optional[str] = Query(None),
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100)
):
    """
    List reviews with filters.
    """
    query = select(Review)

    if booking_id:
        query = query.where(Review.booking_id == booking_id)
    if reviewer_address:
        query = query.where(Review.reviewer_address == reviewer_address)
    if reviewee_address:
        query = query.where(Review.reviewee_address == reviewee_address)

    query = query.order_by(Review.created_at.desc())

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    reviews = result.scalars().all()

    return reviews


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
        review_id: int,
        db: AsyncSession = Depends(get_db)
):
    """Get a single review by blockchain ID"""
    result = await db.execute(
        select(Review).where(Review.blockchain_id == review_id)
    )
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    return review


@router.get("/user/{user_address}", response_model=List[ReviewResponse])
async def get_user_reviews(
        user_address: str,
        db: AsyncSession = Depends(get_db),
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100)
):
    """
    Get all reviews received by a user.
    Shows reputation from both guest and host perspectives.
    """
    query = select(Review).where(Review.reviewee_address == user_address)
    query = query.order_by(Review.created_at.desc())

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    reviews = result.scalars().all()

    return reviews