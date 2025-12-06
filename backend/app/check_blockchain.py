
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.services.blockchain import blockchain_service

async def main():
    print("🔗 Fetching properties from blockchain...")
    try:
        properties = await blockchain_service.get_all_properties()
        print(f"✅ Found {len(properties)} properties on blockchain")
        
        for i, prop in enumerate(properties):
            print(f"[{i}] {prop.get('title')} - {prop.get('location_city')}, {prop.get('location_country')}")
            
    except Exception as e:
        print(f"❌ Error fetching from blockchain: {e}")

if __name__ == "__main__":
    asyncio.run(main())
