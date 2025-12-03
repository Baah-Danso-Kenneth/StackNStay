from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    blockchain_id = Column(Integer, unique=True, index=True, nullable=False)

    # References
    property_id = Column(Integer, index=True)  # blockchain property ID

    # Parties
    guest_address = Column(String(64), index=True, nullable=False)
    host_address = Column(String(64), index=True, nullable=False)

    # Dates (block heights)
    check_in = Column(BigInteger, nullable=False)
    check_out = Column(BigInteger, nullable=False)

    # Financial
    total_amount = Column(BigInteger, nullable=False)
    platform_fee = Column(BigInteger, nullable=False)
    host_payout = Column(BigInteger, nullable=False)
    escrowed_amount = Column(BigInteger, nullable=False)

    # Status
    status = Column(String(20), nullable=False, index=True)  # confirmed, completed, cancelled

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())