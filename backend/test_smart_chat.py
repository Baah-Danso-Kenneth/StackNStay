"""
Test the Smart Routing Chat System
Tests both property search and knowledge base questions
"""
import asyncio
import httpx


async def test_chat():
    """Test the chat endpoint with different query types"""
    
    base_url = "http://localhost:8000"
    
    test_queries = [
        # Knowledge questions
        {
            "message": "What is StackNStay?",
            "expected_type": "knowledge"
        },
        {
            "message": "How do fees work?",
            "expected_type": "knowledge"
        },
        {
            "message": "What is block height?",
            "expected_type": "knowledge"
        },
        {
            "message": "How do I cancel a booking?",
            "expected_type": "knowledge"
        },
        # Property search
        {
            "message": "Find me a 2-bedroom apartment in Stockholm",
            "expected_type": "property_search"
        },
        {
            "message": "Show me properties with a pool",
            "expected_type": "property_search"
        },
        # Mixed
        {
            "message": "What is StackNStay and show me some properties",
            "expected_type": "mixed"
        }
    ]
    
    print("=" * 60)
    print("🧪 Testing Smart Routing Chat System")
    print("=" * 60)
    
    async with httpx.AsyncClient() as client:
        for i, test in enumerate(test_queries, 1):
            print(f"\n📝 Test {i}/{len(test_queries)}")
            print(f"Query: \"{test['message']}\"")
            print(f"Expected type: {test['expected_type']}")
            
            try:
                response = await client.post(
                    f"{base_url}/api/chat",
                    json={"message": test["message"]},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    print(f"✅ Response received")
                    print(f"   Query type: {data.get('query_type')}")
                    print(f"   Properties: {len(data.get('properties', []))}")
                    print(f"   Knowledge snippets: {len(data.get('knowledge_snippets', []))}")
                    print(f"   Response: {data.get('response')[:100]}...")
                    
                    # Check if type matches
                    if data.get('query_type') == test['expected_type']:
                        print(f"   ✅ Correct routing!")
                    else:
                        print(f"   ⚠️  Routing mismatch (got {data.get('query_type')})")
                else:
                    print(f"❌ Error: {response.status_code}")
                    print(f"   {response.text}")
                    
            except Exception as e:
                print(f"❌ Exception: {e}")
            
            await asyncio.sleep(1)  # Rate limiting
    
    print("\n" + "=" * 60)
    print("✅ Testing complete!")
    print("=" * 60)


if __name__ == "__main__":
    print("\n⚠️  Make sure the server is running:")
    print("   cd app && uvicorn main:app --reload\n")
    
    asyncio.run(test_chat())
