"""
Test Script for StackNStay RAG Backend
Run this to verify your setup before deployment
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()


async def test_environment():
    """Test environment variables"""
    print("\n🔍 Testing Environment Variables...")
    
    required_vars = ["GROQ_API_KEY", "COHERE_API_KEY"]
    optional_vars = ["STACKS_CONTRACT_ADDRESS", "STACKS_API_URL", "IPFS_GATEWAY"]
    
    all_good = True
    
    for var in required_vars:
        value = os.getenv(var)
        if value and value != f"your_{var.lower()}_here":
            print(f"  ✅ {var}: Set")
        else:
            print(f"  ❌ {var}: Missing or not configured")
            all_good = False
    
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print(f"  ✅ {var}: {value[:50]}...")
        else:
            print(f"  ⚠️  {var}: Using default")
    
    return all_good


async def test_imports():
    """Test that all required packages are installed"""
    print("\n📦 Testing Package Imports...")
    
    packages = [
        ("fastapi", "FastAPI"),
        ("faiss", "FAISS"),
        ("cohere", "Cohere"),
        ("langchain_groq", "LangChain Groq"),
        ("langgraph", "LangGraph"),
        ("pydantic", "Pydantic"),
        ("httpx", "HTTPX"),
    ]
    
    all_good = True
    
    for package, name in packages:
        try:
            __import__(package)
            print(f"  ✅ {name}")
        except ImportError:
            print(f"  ❌ {name} - Not installed")
            all_good = False
    
    return all_good


async def test_cohere_connection():
    """Test Cohere API connection"""
    print("\n🔗 Testing Cohere API Connection...")
    
    try:
        import cohere
        api_key = os.getenv("COHERE_API_KEY")
        
        if not api_key or api_key == "your_cohere_api_key_here":
            print("  ⚠️  Cohere API key not configured")
            return False
        
        client = cohere.Client(api_key)
        
        # Test embedding
        response = client.embed(
            texts=["test"],
            model="embed-english-v3.0",
            input_type="search_query"
        )
        
        print(f"  ✅ Cohere API working (embedding dimension: {len(response.embeddings[0])})")
        return True
        
    except Exception as e:
        print(f"  ❌ Cohere API error: {e}")
        return False


async def test_groq_connection():
    """Test Groq API connection"""
    print("\n🤖 Testing Groq API Connection...")
    
    try:
        from langchain_groq import ChatGroq
        api_key = os.getenv("GROQ_API_KEY")
        
        if not api_key or api_key == "your_groq_api_key_here":
            print("  ⚠️  Groq API key not configured")
            return False
        
        llm = ChatGroq(api_key=api_key, model="llama-3.3-70b-versatile")
        response = llm.invoke("Say 'test' and nothing else")
        
        print(f"  ✅ Groq API working (response: {response.content[:50]}...)")
        return True
        
    except Exception as e:
        print(f"  ❌ Groq API error: {e}")
        return False


async def test_vector_store():
    """Test vector store initialization"""
    print("\n🗄️  Testing Vector Store...")
    
    try:
        from app.services.vector_store import vector_store
        
        # Test creating a small index
        test_properties = [
            {
                "property_id": 0,
                "title": "Test Property 1",
                "location_city": "Stockholm",
                "price_per_night": 100,
                "description": "A cozy apartment in the city center",
                "amenities": ["wifi", "kitchen"],
                "bedrooms": 2,
                "max_guests": 4
            },
            {
                "property_id": 1,
                "title": "Test Property 2",
                "location_city": "Berlin",
                "price_per_night": 80,
                "description": "Modern loft with great views",
                "amenities": ["wifi", "parking"],
                "bedrooms": 1,
                "max_guests": 2
            }
        ]
        
        count = await vector_store.index_properties(test_properties)
        print(f"  ✅ Vector store working (indexed {count} test properties)")
        
        # Test search
        results = await vector_store.search("apartment in Stockholm", k=1)
        print(f"  ✅ Search working (found {len(results)} results)")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Vector store error: {e}")
        return False


async def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 StackNStay Backend Test Suite")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Environment", await test_environment()))
    results.append(("Imports", await test_imports()))
    results.append(("Cohere API", await test_cohere_connection()))
    results.append(("Groq API", await test_groq_connection()))
    results.append(("Vector Store", await test_vector_store()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {test_name}")
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n🎉 All tests passed! Your backend is ready to run.")
        print("\nNext steps:")
        print("  1. Run: uvicorn app.main:app --reload")
        print("  2. Visit: http://localhost:8000/docs")
        print("  3. Index properties: POST /api/index")
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
    
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
