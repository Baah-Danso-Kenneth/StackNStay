from sqlalchemy import Column, Integer, String, BigInteger, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    blockchain_id = Column(Integer, unique=True, index=True, nullable=False)
    owner_address = Column(String(64), index=True, nullable=False)

    # Pricing
    price_per_night = Column(BigInteger, nullable=False)  # in micro-STX

    # Location
    location_tag = Column(Integer, nullable=False)  # 1=Bali, 2=Tokyo, etc.
    location_city = Column(String(100))
    location_country = Column(String(100))

    # Metadata
    metadata_uri = Column(Text)  # IPFS hash
    ipfs_hash = Column(String(100))

    # Status
    active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Additional searchable fields (from IPFS metadata)
    title = Column(String(200))
    description = Column(Text)
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    max_guests = Column(Integer)