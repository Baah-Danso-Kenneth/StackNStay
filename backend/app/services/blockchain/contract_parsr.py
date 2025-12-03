# Add this import at the top
from app.services.image_service import image_service


# Update the parse_property_listing method:
@staticmethod
async def parse_property_listing(
        db: AsyncSession,
        event_data: Dict[str, Any],
        block_height: int
) -> Optional[Property]:
    """Parse 'list-property' contract event"""
    try:
        # ... existing code to create property ...

        # Fetch IPFS metadata
        print(f"📥 Fetching IPFS metadata for property {property_id}...")
        metadata = await ipfs_client.fetch_json(metadata_uri)

        if metadata:
            # Update property with parsed metadata
            property_obj.title = metadata.get("title", "Untitled Property")
            property_obj.description = metadata.get("description", "")
            property_obj.location_city = metadata.get("location", {}).get("city")
            property_obj.location_country = metadata.get("location", {}).get("country")
            property_obj.bedrooms = metadata.get("bedrooms")
            property_obj.bathrooms = metadata.get("bathrooms")
            property_obj.max_guests = metadata.get("maxGuests")

            # Process images through ImageKit
            image_cids = metadata.get("images", [])
            if image_cids:
                print(f"🖼️  Processing {len(image_cids)} images through ImageKit...")
                await image_service.process_property_images(
                    db,
                    property_obj.id,
                    image_cids
                )

            # Store IPFS metadata cache
            ipfs_meta = IPFSMetadata(
                ipfs_hash=metadata_uri,
                entity_type="property",
                entity_id=property_obj.id,
                raw_content=metadata,
                parsed_title=property_obj.title,
                parsed_description=property_obj.description,
                image_cids=image_cids,
                fetch_status="fetched"
            )
            db.add(ipfs_meta)

        await db.commit()
        print(f"✅ Indexed property #{property_id}: {property_obj.title}")

        return property_obj

    except Exception as e:
        print(f"❌ Error parsing property listing: {e}")
        await db.rollback()
        return None