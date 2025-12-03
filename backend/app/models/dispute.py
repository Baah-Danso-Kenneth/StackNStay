from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    blockchain_id = Column(Integer, unique=True, index=True, nullable=False)

    booking_id = Column(Integer, index=True)
    raised_by = Column(String(64), index=True)

    reason = Column(Text)
    evidence = Column(Text)
    status = Column(String(20), index=True)  # pending, resolved, rejected
    resolution = Column(Text)
    refund_percentage = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))