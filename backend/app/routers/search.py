"""
Search & Recommendations Router
Handles semantic search and property recommendations
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.services.vector_store import vector_store
from app.services.blockchain import blockchain_service
from app.services.knowledge_store import knowledge_store

router = APIRouter(prefix="/api", tags=["search"])


# ============================================
# PYDANTIC MODELS
# ============================================

class SearchRequest(BaseModel):
    query: str
    limit: int = 10
    filters: Optional[Dict[str, Any]] = None


class RecommendationsRequest(BaseModel):
    property_id: int
    limit: int = 4


class IndexResponse(BaseModel):
    status: str
    properties_indexed: int
    message: str


# ============================================
# API ENDPOINTS
# ============================================

@router.post("/search")
async def semantic_search(request: SearchRequest):
    """
    Semantic search for properties
    """
    try:
        # Ensure vector store is loaded
        if not vector_store.index:
            if not vector_store.load():
                raise HTTPException(
                    status_code=503,
                    detail="Vector store not initialized. Please run /api/index first."
                )
        
        # Perform search
        results = await vector_store.search(
            query=request.query,
            k=request.limit,
            filters=request.filters
        )
        
        return {
            "query": request.query,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        print(f"Error in search: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations")
async def get_recommendations(request: RecommendationsRequest):
    """
    Get similar property recommendations
    """
    try:
        # Ensure vector store is loaded
        if not vector_store.index:
            if not vector_store.load():
                raise HTTPException(
                    status_code=503,
                    detail="Vector store not initialized. Please run /api/index first."
                )
        
        # Get similar properties
        results = await vector_store.get_similar_properties(
            property_id=request.property_id,
            k=request.limit
        )
        
        return {
            "property_id": request.property_id,
            "recommendations": results,
            "count": len(results)
        }
        
    except Exception as e:
        print(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/index", response_model=IndexResponse)
async def index_properties(background_tasks: BackgroundTasks):
    """
    Manually trigger property indexing from blockchain
    """
    try:
        # Fetch properties from blockchain
        print("🔄 Fetching properties from blockchain...")
        properties = await blockchain_service.get_all_properties()
        
        if not properties:
            return IndexResponse(
                status="warning",
                properties_indexed=0,
                message="No properties found on blockchain"
            )
        
        # Index properties
        print(f"📝 Indexing {len(properties)} properties...")
        count = await vector_store.index_properties(properties)
        
        return IndexResponse(
            status="success",
            properties_indexed=count,
            message=f"Successfully indexed {count} properties"
        )
        
    except Exception as e:
        print(f"Error indexing properties: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/index/status")
async def index_status():
    """
    Get current index status
    """
    return {
        "indexed": vector_store.index is not None,
        "property_count": len(vector_store.property_metadata),
        "index_dimension": vector_store.dimension if vector_store.index else None,
        "knowledge_indexed": knowledge_store.index is not None,
        "knowledge_chunks": len(knowledge_store.knowledge_chunks)
    }


@router.post("/index/knowledge")
async def index_knowledge():
    """
    Index the knowledge base (FAQ, guides, etc.)
    """
    try:
        count = await knowledge_store.index_knowledge_base()
        
        return {
            "status": "success",
            "chunks_indexed": count,
            "message": f"Successfully indexed {count} knowledge chunks"
        }
    except Exception as e:
        print(f"Error indexing knowledge base: {e}")
        raise HTTPException(status_code=500, detail=str(e))
