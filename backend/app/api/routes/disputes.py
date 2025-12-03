from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.dispute import Dispute
from app.schemas.dispute import DisputeResponse

router = APIRouter(prefix="/disputes", tags=["Disputes"])


@router.get("/", response_model=List[DisputeResponse])
async def list_disputes(
        db: AsyncSession = Depends(get_db),
        status: Optional[str] = Query(None),
        booking_id: Optional[int] = Query(None),
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100)
):
    """
    List disputes with filters.
    """
    query = select(Dispute)

    if status:
        query = query.where(Dispute.status == status)
    if booking_id:
        query = query.where(Dispute.booking_id == booking_id)

    query = query.order_by(Dispute.created_at.desc())

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    disputes = result.scalars().all()

    return disputes


@router.get("/{dispute_id}", response_model=DisputeResponse)
async def get_dispute(
        dispute_id: int,
        db: AsyncSession = Depends(get_db)
):
    """Get a single dispute by blockchain ID"""
    result = await db.execute(
        select(Dispute).where(Dispute.blockchain_id == dispute_id)
    )
    dispute = result.scalar_one_or_none()

    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    return dispute


@router.get("/my/disputes", response_model=List[DisputeResponse])
async def get_my_disputes(
        db: AsyncSession = Depends(get_db),
        user_address: str = Depends(get_current_user),
        status: Optional[str] = Query(None)
):
    """
    Get disputes raised by current user.
    Requires authentication.
    """
    query = select(Dispute).where(Dispute.raised_by == user_address)

    if status:
        query = query.where(Dispute.status == status)

    query = query.order_by(Dispute.created_at.desc())

    result = await db.execute(query)
    disputes = result.scalars().all()

    return disputes