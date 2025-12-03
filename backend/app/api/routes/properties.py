from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_user
from app.models.property import Property
from app.schemas.property import PropertyResponse, PropertySearchFilters, PropertySyncRequest
from app.services.image_service import image_service
from app.models.blockchain import IPFSMetadata
from sqlalchemy.orm import selectinload
from app.utils.imageKit import imagekit_client
import httpx
import json



router = APIRouter(prefix="/properties", tags=["Properties"])



@router.get("/", response_model=List[PropertyResponse])
async def list_properties(
        db: AsyncSession = Depends(get_db),
        user_address: Optional[str] = Depends(get_optional_user),
        # Filters
        location_city: Optional[str] = Query(None),
        location_country: Optional[str] = Query(None),
        location_tag: Optional[int] = Query(None),
        min_price: Optional[int] = Query(None, ge=0),
        max_price: Optional[int] = Query(None, ge=0),
        min_bedrooms: Optional[int] = Query(None, ge=0),
        max_guests: Optional[int] = Query(None, ge=1),
        active_only: bool = Query(True),
        # Pagination
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
        # Search
        search: Optional[str] = Query(None, min_length=2)
):
    """
    List properties with filtering and search.

    **Filters:**
    - Location: city, country, or location_tag
    - Price range: min_price, max_price (in micro-STX)
    - Bedrooms: min_bedrooms
    - Capacity: max_guests
    - Status: active_only

    **Search:** Full-text search on title and description
    """

    # Build query
    query = select(Property)
    conditions = []

    # Active filter
    if active_only:
        conditions.append(Property.active == True)

    # Location filters
    if location_city:
        conditions.append(Property.location_city.ilike(f"%{location_city}%"))
    if location_country:
        conditions.append(Property.location_country.ilike(f"%{location_country}%"))
    if location_tag:
        conditions.append(Property.location_tag == location_tag)

    # Price filters
    if min_price:
        conditions.append(Property.price_per_night >= min_price)
    if max_price:
        conditions.append(Property.price_per_night <= max_price)

    # Property features
    if min_bedrooms:
        conditions.append(Property.bedrooms >= min_bedrooms)
    if max_guests:
        conditions.append(Property.max_guests >= max_guests)

    # Search
    if search:
        search_condition = or_(
            Property.title.ilike(f"%{search}%"),
            Property.description.ilike(f"%{search}%")
        )
        conditions.append(search_condition)

    # Apply all conditions
    if conditions:
        query = query.where(and_(*conditions))

    # Order by newest first
    query = query.order_by(Property.created_at.desc())

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Execute
    result = await db.execute(query)
    properties = result.scalars().all()

    # Enrich with images
    enriched_properties = []
    for prop in properties:
        enriched_prop = await enrich_property_with_images(db, prop)
        enriched_properties.append(enriched_prop)

    return enriched_properties


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
        property_id: int,
        db: AsyncSession = Depends(get_db)
):
    """
    Get a single property by blockchain ID.
    """
    result = await db.execute(
        select(Property).where(Property.blockchain_id == property_id)
    )
    property_obj = result.scalar_one_or_none()

    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")

    # Enrich with images
    property_obj = await enrich_property_with_images(db, property_obj)

    return property_obj


@router.get("/owner/{owner_address}", response_model=List[PropertyResponse])
async def get_properties_by_owner(
        owner_address: str,
        db: AsyncSession = Depends(get_db),
        active_only: bool = Query(True),
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100)
):
    """
    Get all properties owned by a specific address.
    """
    query = select(Property).where(Property.owner_address == owner_address)

    if active_only:
        query = query.where(Property.active == True)

    query = query.order_by(Property.created_at.desc())

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    properties = result.scalars().all()

    # Enrich with images
    enriched_properties = []
    for prop in properties:
        enriched_prop = await enrich_property_with_images(db, prop)
        enriched_properties.append(enriched_prop)

    return enriched_properties


@router.get("/my/listings", response_model=List[PropertyResponse])
async def get_my_properties(
        db: AsyncSession = Depends(get_db),
        user_address: str = Depends(get_current_user),
        active_only: bool = Query(False)
):
    """
    Get current user's properties.
    Requires authentication.
    """
    query = select(Property).where(Property.owner_address == user_address)

    if active_only:
        query = query.where(Property.active == True)

    query = query.order_by(Property.created_at.desc())

    result = await db.execute(query)
    properties = result.scalars().all()

    # Enrich with images
    enriched_properties = []
    for prop in properties:
        enriched_prop = await enrich_property_with_images(db, prop)
        enriched_properties.append(enriched_prop)

    return enriched_properties


@router.post("/sync", response_model=PropertyResponse)
async def sync_property_from_blockchain(
        property_data: PropertySyncRequest,
        db: AsyncSession = Depends(get_db)
):
    """
    Sync a property from blockchain to database.
    Called by frontend after smart contract transaction is confirmed.
    
    This endpoint:
    1. Checks if property already exists
    2. Fetches metadata from IPFS
    3. Parses and enriches property data
    4. Saves to database
    """
    try:
        # Check if property already exists
        result = await db.execute(
            select(Property).where(Property.blockchain_id == property_data.blockchain_id)
        )
        existing_property = result.scalar_one_or_none()
        
        if existing_property:
            raise HTTPException(
                status_code=400,
                detail=f"Property with blockchain_id {property_data.blockchain_id} already exists"
            )
        
        # Fetch metadata from IPFS
        metadata = await fetch_ipfs_metadata(property_data.metadata_uri)
        
        # Parse location (format: "City, Country")
        location_parts = metadata.get("location", "").split(",")
        location_city = location_parts[0].strip() if len(location_parts) > 0 else None
        location_country = location_parts[1].strip() if len(location_parts) > 1 else None
        
        # Create property in database
        new_property = Property(
            blockchain_id=property_data.blockchain_id,
            owner_address=property_data.owner_address,
            price_per_night=property_data.price_per_night,
            location_tag=property_data.location_tag,
            location_city=location_city,
            location_country=location_country,
            metadata_uri=property_data.metadata_uri,
            ipfs_hash=property_data.ipfs_hash,
            active=property_data.active,
            # Metadata fields
            title=metadata.get("title"),
            description=metadata.get("description"),
            bedrooms=metadata.get("bedrooms"),
            bathrooms=metadata.get("bathrooms"),
            max_guests=metadata.get("maxGuests"),
        )
        
        db.add(new_property)
        await db.commit()
        await db.refresh(new_property)
        
        # Process images if available
        image_urls = metadata.get("images", [])
        if image_urls:
            # Extract IPFS hashes from URLs (format: ipfs://QmXxx...)
            image_cids = [url.replace("ipfs://", "") for url in image_urls]
            
            # Store IPFS metadata for images
            ipfs_metadata = IPFSMetadata(
                ipfs_hash=property_data.ipfs_hash,
                entity_type="property",
                entity_id=new_property.id,
                image_cids=image_cids,
                metadata_json=metadata,
                fetch_status="fetched"
            )
            db.add(ipfs_metadata)
            await db.commit()
        
        # Enrich with images for response
        enriched_property = await enrich_property_with_images(db, new_property)
        
        return enriched_property
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Failed to sync property: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync property: {str(e)}"
        )


async def fetch_ipfs_metadata(ipfs_hash: str) -> dict:
    """Fetch metadata from IPFS via Pinata gateway"""
    try:
        # Remove ipfs:// prefix if present
        ipfs_hash = ipfs_hash.replace("ipfs://", "")
        
        gateway_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(gateway_url)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch metadata from IPFS: {response.text}"
            )
        
        return response.json()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching IPFS metadata: {str(e)}"
        )


async def enrich_property_with_images(db: AsyncSession, property_obj: Property) -> Property:
    """Add ImageKit URLs to property object"""

    # Fetch image metadata
    result = await db.execute(
        select(IPFSMetadata).where(
            IPFSMetadata.entity_type == "property",
            IPFSMetadata.entity_id == property_obj.id
        )
    )
    metadata = result.scalar_one_or_none()

    if metadata and metadata.image_cids:
        # Generate ImageKit URLs
        image_urls = imagekit_client.get_property_image_urls(
            metadata.image_cids,
            include_variants=True
        )

        # Attach to property object (not saved to DB, just for response)
        property_obj.image_urls = image_urls

        # Set cover image (first image, medium size)
        if image_urls["medium"]:
            property_obj.cover_image = image_urls["medium"][0]

    return property_obj