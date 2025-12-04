"""
StackNStay Backend API
FastAPI application with RAG chatbot and property recommendations
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import chat, search
from app.services.vector_store import vector_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # Startup
    print("🚀 Starting StackNStay API...")
    
    # Try to load existing vector store
    print("📂 Loading vector store from disk...")
    loaded = vector_store.load()
    
    if loaded:
        print(f"✅ Loaded {len(vector_store.property_metadata)} properties")
    else:
        print("⚠️ No existing index found. Use POST /api/index to create one.")
    
    yield
    
    # Shutdown
    print("👋 Shutting down StackNStay API...")


# Create FastAPI app
app = FastAPI(
    title="StackNStay API",
    description="Decentralized property rental platform with AI-powered search",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)
app.include_router(search.router)


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
