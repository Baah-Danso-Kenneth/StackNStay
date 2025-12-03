from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from app.core.database import get_db
from ai.agents.concierge import TravelConciergeAgent
from ai.rag.knowledge_base import StacksStayRAG


router = APIRouter(prefix="/ai", tags=["AI"])

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Dict[str, Any]] = []

class ChatResponse(BaseModel):
    response: str
    conversation_history: List[Dict[str, Any]]

@router.post("/chat", response_model=ChatResponse)
async def chat_with_concierge(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Chat with the Travel Concierge AI
    """
    try:
        agent = TravelConciergeAgent(db)
        result = agent.chat(request.message, request.conversation_history)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class AssistantRequest(BaseModel):
    question: str

class AssistantResponse(BaseModel):
    answer: str


@router.post("/assistant", response_model=AssistantResponse)
async def ask_assistant(request: AssistantRequest):
    """
    Ask the StacksStay Assistant about how the platform works
    Uses RAG to answer from knowledge base
    """
    try:
        rag = StacksStayRAG()
        answer = rag.ask(request.question)
        return AssistantResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))