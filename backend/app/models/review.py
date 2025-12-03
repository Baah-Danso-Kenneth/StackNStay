from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    blockchain_id = Column(Integer, unique=True, index=True, nullable=False)

    booking_id = Column(Integer, index=True)
    reviewer_address = Column(String(64), index=True)
    reviewee_address = Column(String(64), index=True)

    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())