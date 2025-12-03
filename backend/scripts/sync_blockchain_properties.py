#!/usr/bin/env python3
"""
Blockchain Property Sync Utility

This script fetches properties directly from the blockchain smart contract
and syncs them to the backend database. Useful for:
- Initial setup/migration
- Debugging sync issues
- Recovering from database resets
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

import httpx
from app.core.config import settings
from app.core.database import AsyncSessionLocal, init_db


async def fetch_property_from_blockchain(property_id: int) -> dict | None:
    """
    Fetch property details from blockchain using Stacks API
    """
    try:
        # Read-only function call to get-property
        url = f"{settings.STACKS_API_URL}/v2/contracts/call-read/{settings.CONTRACT_DEPLOYER}/{settings.ESCROW_CONTRACT}/get-property"
        
        # Clarity value for property-id
        payload = {
            "sender": settings.CONTRACT_DEPLOYER,
            "arguments": [f"0x{property_id:032x}"]  # uint in hex format
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            
            if response.status_code != 200:
                print(f"  ⚠️  Property {property_id} not found on blockchain")
                return None
            
            result = response.json()
            
            # Check if property exists (should be (some {...}))
            if result.get("okay") and result.get("result"):
                # Parse Clarity value
                # TODO: Implement proper Clarity value parsing
                # For now, return raw result
                print(f"  ✓ Found property {property_id} on blockchain")
                return result
            
            return None
            
    except Exception as e:
        print(f"  ❌ Error fetching property {property_id}: {e}")
        return None


async def sync_property_to_db(property_id: int, blockchain_data: dict):
    """
    Sync a single property to the backend database via API
    """
    try:
        # Extract property details from blockchain data
        # Note: This needs proper Clarity value parsing
        # For now, we'll call the backend sync endpoint
        
        sync_url = f"{settings.STACKS_API_URL}/api/properties/sync"
        
        # TODO: Parse blockchain_data to extract:
        # - owner_address
        # - price_per_night
        # - location_tag
        # - metadata_uri
        # - active
        
        print(f"  ℹ️  Blockchain data parsing not yet implemented")
        print(f"     Property {property_id} requires manual sync")
        return False
        
    except Exception as e:
        print(f"  ❌ Error syncing property {property_id}: {e}")
        return False


async def scan_and_sync_properties(max_properties: int = 100):
    """
    Scan blockchain for properties and sync them to database
    """
    print("\n" + "="*70)
    print("🔗 Blockchain Property Sync Utility")
    print("="*70)
    print(f"\nNetwork: {settings.STACKS_NETWORK}")
    print(f"Contract: {settings.CONTRACT_DEPLOYER}.{settings.ESCROW_CONTRACT}")
    print(f"Scanning up to {max_properties} properties...\n")
    
    # Initialize database
    await init_db()
    
    synced_count = 0
    failed_count = 0
    
    for property_id in range(max_properties):
        print(f"[{property_id}/{max_properties}] Checking property {property_id}...", end=" ")
        
        # Fetch from blockchain
        blockchain_data = await fetch_property_from_blockchain(property_id)
        
        if blockchain_data:
            # Try to sync
            success = await sync_property_to_db(property_id, blockchain_data)
            if success:
                synced_count += 1
            else:
                failed_count += 1
        else:
            # No more properties
            print(f"\n\n✓ Scan complete. Found {property_id} properties total.")
            break
    
    print("\n" + "="*70)
    print(f"📊 Sync Summary:")
    print(f"   ✓ Successfully synced: {synced_count}")
    print(f"   ⚠️  Failed to sync: {failed_count}")
    print(f"   Total properties: {synced_count + failed_count}")
    print("="*70 + "\n")


async def main():
    """Main entry point"""
    try:
        await scan_and_sync_properties(max_properties=100)
    except KeyboardInterrupt:
        print("\n\n⚠️  Sync interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Sync failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
