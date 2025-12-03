from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.booking import Booking
from app.schemas.booking import BookingResponse

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.get("/", response_model=List[BookingResponse])
async def list_bookings(
        db: AsyncSession = Depends(get_db),
        property_id: Optional[int] = Query(None),
        status: Optional[str] = Query(None),
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100)
):
    """
    List all bookings with filters.
    """
    query = select(Booking)
    conditions = []

    if property_id:
        conditions.append(Booking.property_id == property_id)
    if status:
        conditions.append(Booking.status == status)

    if conditions:
        query = query.where(and_(*conditions))

    query = query.order_by(Booking.created_at.desc())

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    bookings = result.scalars().all()

    return bookings


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
        booking_id: int,
        db: AsyncSession = Depends(get_db)
):
    """
    Get a single booking by blockchain ID.
    """
    result = await db.execute(
        select(Booking).where(Booking.blockchain_id == booking_id)
    )
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return booking


@router.get("/guest/{guest_address}", response_model=List[BookingResponse])
async def get_bookings_as_guest(
        guest_address: str,
        db: AsyncSession = Depends(get_db),
        status: Optional[str] = Query(None),
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100)
):
    """
    Get all bookings where user is the guest.
    """
    query = select(Booking).where(Booking.guest_address == guest_address)

    if status:
        query = query.where(Booking.status == status)

    query = query.order_by(Booking.created_at.desc())

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    bookings = result.scalars().all()

    return bookings


@router.get("/host/{host_address}", response_model=List[BookingResponse])
async def get_bookings_as_host(
        host_address: str,
        db: AsyncSession = Depends(get_db),
        status: Optional[str] = Query(None),
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100)
):
    """
    Get all bookings where user is the host.
    """
    query = select(Booking).where(Booking.host_address == host_address)

    if status:
        query = query.where(Booking.status == status)

    query = query.order_by(Booking.created_at.desc())

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    bookings = result.scalars().all()

    return bookings


@router.get("/my/as-guest", response_model=List[BookingResponse])
async def get_my_bookings_as_guest(
        db: AsyncSession = Depends(get_db),
        user_address: str = Depends(get_current_user),
        status: Optional[str] = Query(None)
):
    """
    Get current user's bookings as guest.
    Requires authentication.
    """
    query = select(Booking).where(Booking.guest_address == user_address)

    if status:
        query = query.where(Booking.status == status)

    query = query.order_by(Booking.created_at.desc())

    result = await db.execute(query)
    bookings = result.scalars().all()

    return bookings


@router.get("/my/as-host", response_model=List[BookingResponse])
async def get_my_bookings_as_host(
        db: AsyncSession = Depends(get_db),
        user_address: str = Depends(get_current_user),
        status: Optional[str] = Query(None)
):
    """
    Get current user's bookings as host.
    Requires authentication.
    """
    query = select(Booking).where(Booking.host_address == user_address)

    if status:
        query = query.where(Booking.status == status)

    query = query.order_by(Booking.created_at.desc())

    result = await db.execute(query)
    bookings = result.scalars().all()

    return bookings