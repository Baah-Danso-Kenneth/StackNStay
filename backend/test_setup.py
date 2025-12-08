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
    required_vars = ["GROQ_API_KEY", "COHERE_API_KEY"]
    optional_vars = ["STACKS_CONTRACT_ADDRESS", "STACKS_API_URL", "IPFS_GATEWAY"]
    
    all_good = True
    
    for var in required_vars:
        value = os.getenv(var)
        if not (value and value != f"your_{var.lower()}_here"):
            all_good = False
    
    for var in optional_vars:
        pass
    
    return all_good


async def test_imports():
    """Test that all required packages are installed"""
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
        except ImportError:
            all_good = False
    
    return all_good


async def test_cohere_connection():
    """Test Cohere API connection"""
    try:
        import cohere
        api_key = os.getenv("COHERE_API_KEY")
        
        if not api_key or api_key == "your_cohere_api_key_here":
            return False
        
        client = cohere.Client(api_key)
        
        # Test embedding
        response = client.embed(
            texts=["test"],
            model="embed-english-v3.0",
            input_type="search_query"
        )
        
        return True
        
    except Exception as e:
        return False


async def test_groq_connection():
    """Test Groq API connection"""
    try:
        from langchain_groq import ChatGroq
        api_key = os.getenv("GROQ_API_KEY")
        
        if not api_key or api_key == "your_groq_api_key_here":
            return False
        
        llm = ChatGroq(api_key=api_key, model="llama-3.3-70b-versatile")
        response = llm.invoke("Say 'test' and nothing else")
        
        return True
        
    except Exception as e:
        return False


async def test_vector_store():
    """Test vector store initialization"""
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
        
        # Test search
        results = await vector_store.search("apartment in Stockholm", k=1)
        
        return True
        
    except Exception as e:
        return False


async def main():
    """Run all tests"""
    results = []
    
    # Run tests
    results.append(("Environment", await test_environment()))
    results.append(("Imports", await test_imports()))
    results.append(("Cohere API", await test_cohere_connection()))
    results.append(("Groq API", await test_groq_connection()))
    results.append(("Vector Store", await test_vector_store()))
    
    # Summary
    all_passed = all(result for _, result in results)


if __name__ == "__main__":
    asyncio.run(main())
