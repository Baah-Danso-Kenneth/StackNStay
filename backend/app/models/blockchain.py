from sqlalchemy import Column, Integer, String, BigInteger, DateTime, Text, Boolean, JSON
from sqlalchemy.sql import func
from app.core.database import Base




class BlockchainSync(Base):
    """
    Track blockchain indexer progress.
    One row per contract to track which block we've indexed up to.
    """
    __tablename__ = "blockchain_sync"

    id = Column(Integer, primary_key=True, index=True)
    contract_name = Column(String(100), unique=True, nullable=False, index=True)
    # e.g., "stackstay-escrow", "stackstay-disputes", "stackstay-reputation"

    last_synced_block = Column(BigInteger, nullable=False, default=0)
    last_synced_tx_id = Column(String(100))  # Last processed transaction ID

    sync_status = Column(String(20), default="active")  # active, paused, error
    error_message = Column(Text)  # If sync_status = error

    total_events_synced = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class IPFSMetadata(Base):
    """
    Cache IPFS content locally for fast access.
    Stores parsed metadata from IPFS to avoid repeated gateway calls.
    """
    __tablename__ = "ipfs_metadata"

    id = Column(Integer, primary_key=True, index=True)
    ipfs_hash = Column(String(100), unique=True, nullable=False, index=True)  # CID

    # What this metadata is for
    entity_type = Column(String(20), nullable=False, index=True)
    # "property", "dispute_evidence", "review_photo"
    entity_id = Column(Integer, index=True)  # Reference to Property.id, Dispute.id, etc.

    # Cached content
    raw_content = Column(JSON)  # Full JSON from IPFS
    parsed_title = Column(String(200))
    parsed_description = Column(Text)

    # Image URLs (if applicable)
    image_cids = Column(JSON)  # Array of image IPFS hashes
    imagekit_urls = Column(JSON)  # Array of ImageKit transformed URLs

    # Metadata
    content_type = Column(String(50))  # application/json, image/jpeg, etc.
    size_bytes = Column(BigInteger)

    fetch_status = Column(String(20), default="pending")  # pending, fetched, error
    fetch_error = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_fetched_at = Column(DateTime(timezone=True))