from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BlockchainSyncStatus(BaseModel):
    """Schema for blockchain sync status"""
    contract_name: str
    last_synced_block: int
    last_synced_tx_id: Optional[str] = None
    sync_status: str
    error_message: Optional[str] = None
    total_events_synced: int
    updated_at: datetime

    class Config:
        from_attributes = True


class IPFSMetadataCreate(BaseModel):
    """Schema for creating IPFS metadata cache entry"""
    ipfs_hash: str
    entity_type: str
    entity_id: int
    raw_content: Optional[dict] = None
    content_type: Optional[str] = None


class IPFSMetadataResponse(BaseModel):
    """Schema for returning cached IPFS metadata"""
    id: int
    ipfs_hash: str
    entity_type: str
    entity_id: int
    raw_content: Optional[dict] = None
    parsed_title: Optional[str] = None
    parsed_description: Optional[str] = None
    image_cids: Optional[list] = None
    imagekit_urls: Optional[list] = None
    fetch_status: str
    created_at: datetime
    last_fetched_at: Optional[datetime] = None

    class Config:
        from_attributes = True