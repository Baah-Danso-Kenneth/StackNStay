"""
StackNStay Backend API
FastAPI application with RAG chatbot and property recommendations
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import chat, search, admin
from app.services.vector_store import vector_store
from app.services.blockchain import blockchain_service
from app.db.init_pgvector import run_pgvector_migrations
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # Startup
    print("🚀 Starting StackNStay API...")
    
    print("🔗 Fetching fresh data from blockchain and IPFS...")
    try:
        # If a DATABASE_URL is configured, ensure pgvector schema exists.
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            print("🔧 DATABASE_URL detected — running pgvector migrations (if needed)")
            await run_pgvector_migrations(database_url)

        properties = await blockchain_service.get_all_properties()
        
        if properties:
            await vector_store.index_properties(properties)
            print(f"✅ Successfully indexed {len(properties)} properties")
            vector_store.save()
        else:
            print("⚠️ No properties found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down StackNStay API...")


# Create FastAPI app
app = FastAPI(
    title="StackNStay API",
    description="Decentralized property rental platform with AI-powered search",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False  # Disable automatic trailing slash redirects
)

# Configure CORS - Allow all origins for Vercel preview deployments
# Note: Using "*" is safe here because:
# 1. The API doesn't use authentication cookies
# 2. All property data is public blockchain data
# 3. Vercel creates many preview URLs that are hard to whitelist
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)
app.include_router(search.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to StackNStay API",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/api/chat",
            "search": "/api/search",
            "recommendations": "/api/recommendations",
            "index": "/api/index",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "vector_store_loaded": vector_store.index is not None,
        "properties_indexed": len(vector_store.property_metadata)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)