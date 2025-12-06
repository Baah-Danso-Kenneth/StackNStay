
import asyncio
import sys
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from app.routers.chat import extract_filters_node, AgentState
from app.services.vector_store import VectorStore

async def test_filter_extraction():
    print("\n🧪 Testing Filter Extraction...")
    
    # Test cases
    queries = [
        ("I want a 2 bedroom house in Ghana", {"location": "Ghana", "bedrooms": 2}),
        ("Show me villas under 500 STX", {"max_price": 500}),
        ("3 bedrooms in Accra", {"location": "Accra", "bedrooms": 3}),
        ("Cheap places", {}),  # Should be empty or minimal
    ]
    
    for query, expected in queries:
        state = AgentState(user_query=query, query_type="property_search")
        # Note: This calls the real LLM, so it tests the prompt too
        try:
            new_state = await extract_filters_node(state)
            print(f"Query: '{query}'")
            print(f"  Expected: {expected}")
            print(f"  Got:      {new_state.filters}")
            
            # Basic validation
            for k, v in expected.items():
                if k == "location":
                    assert v.lower() in new_state.filters.get(k, "").lower()
                else:
                    assert new_state.filters.get(k) == v
            print("  ✅ Pass")
        except Exception as e:
            print(f"  ❌ Fail: {e}")

async def test_vector_store_filtering():
    print("\n🧪 Testing Vector Store Filtering...")
    
    store = VectorStore()
    store.property_metadata = [
        {"title": "Ghana Villa", "location_city": "Accra", "location_country": "Ghana", "bedrooms": 3, "price_per_night": 100},
        {"title": "Tokyo Apt", "location_city": "Tokyo", "location_country": "Japan", "bedrooms": 1, "price_per_night": 200},
        {"title": "Miami Condo", "location_city": "Miami", "location_country": "USA", "bedrooms": 2, "price_per_night": 300},
    ]
    
    # Mock embedding to return dummy vector
    import numpy as np
    store.embed_query = AsyncMock(return_value=np.array([0.1, 0.2, 0.3], dtype=np.float32))
    
    # Mock index search to return all indices
    store.index = MagicMock()
    # Return distances (scores) and indices
    # Scores: high to low (simulated)
    store.index.search.return_value = (
        [[0.9, 0.8, 0.7]], # scores
        [[0, 1, 2]]        # indices
    )
    
    # Test 1: Filter by Location "Ghana"
    print("Test 1: Filter by Location 'Ghana'")
    results = await store.search("query", k=3, filters={"location": "Ghana"})
    print(f"  Found {len(results)} results")
    assert len(results) == 1
    assert results[0]["title"] == "Ghana Villa"
    print("  ✅ Pass")
    
    # Test 2: Filter by Bedrooms >= 2
    print("Test 2: Filter by Bedrooms >= 2")
    results = await store.search("query", k=3, filters={"bedrooms": 2})
    print(f"  Found {len(results)} results")
    assert len(results) == 2 # Ghana (3) and Miami (2)
    print("  ✅ Pass")

if __name__ == "__main__":
    asyncio.run(test_filter_extraction())
    asyncio.run(test_vector_store_filtering())
