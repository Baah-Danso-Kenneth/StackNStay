
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.services.vector_store import vector_store

async def main():
    print("📂 Loading vector store...")
    loaded = vector_store.load()
    
    if not loaded:
        print("❌ Failed to load vector store. Is the backend running/initialized?")
        return

    print(f"✅ Loaded {len(vector_store.property_metadata)} properties")
    
    # 1. Inspect Metadata
    print("\n--- Property Metadata Sample ---")
    for i, prop in enumerate(vector_store.property_metadata[:5]):
        print(f"[{i}] {prop.get('title')} - {prop.get('location_city')}, {prop.get('location_country')}")

    # 2. Test Search "Ghana"
    query = "Ghana"
    print(f"\n--- Searching for '{query}' ---")
    results = await vector_store.search(query, k=5)
    
    for i, res in enumerate(results):
        print(f"[{i}] Score: {res.get('match_score'):.4f} | {res.get('title')} - {res.get('location_city')}, {res.get('location_country')}")

    # 3. Test Search "2 bedrooms"
    query = "2 bedrooms"
    print(f"\n--- Searching for '{query}' ---")
    results = await vector_store.search(query, k=5)
    
    for i, res in enumerate(results):
        print(f"[{i}] Score: {res.get('match_score'):.4f} | {res.get('title')} - Bedrooms: {res.get('bedrooms')}")

if __name__ == "__main__":
    asyncio.run(main())
