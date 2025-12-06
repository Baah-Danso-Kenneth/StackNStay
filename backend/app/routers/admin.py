"""
Admin Router
Handles administrative tasks like re-indexing
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.services.vector_store import vector_store
from app.services.blockchain import blockchain_service

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.post("/reindex")
async def reindex_properties(background_tasks: BackgroundTasks):
    """
    Trigger a re-index of properties from the blockchain
    """
    try:
        # Run in background to avoid blocking
        background_tasks.add_task(run_reindex)
        return {"status": "started", "message": "Re-indexing started in background"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def run_reindex():
    """
    Fetch properties from blockchain and update vector store
    """
    print("🔄 Admin triggered re-index...")
    try:
        properties = await blockchain_service.get_all_properties()
        if properties:
            await vector_store.index_properties(properties)
            print(f"✅ Re-index complete. Indexed {len(properties)} properties.")
        else:
            print("⚠️ Re-index found 0 properties.")
    except Exception as e:
        print(f"❌ Re-index failed: {e}")
