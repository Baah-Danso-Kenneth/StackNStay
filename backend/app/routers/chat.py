"""
RAG Chat Router - LangGraph Conversational Agent
Handles property search conversations with memory
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.services.vector_store import vector_store

load_dotenv()

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")


# ============================================
# PYDANTIC MODELS
# ============================================

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None


class PropertyRecommendation(BaseModel):
    property_id: int
    title: str
    price_per_night: float
    location_city: Optional[str] = None
    image: Optional[str] = None
    match_score: float
    highlight: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    properties: List[Dict[str, Any]]
    conversation_id: str
    suggested_actions: List[str]


# ============================================
# LANGGRAPH AGENT STATE
# ============================================

class AgentState(BaseModel):
    """State for the conversational agent"""
    messages: List[Any] = []
    user_query: str = ""
    search_results: List[Dict[str, Any]] = []
    filters: Dict[str, Any] = {}
    final_response: str = ""
    conversation_id: str = ""


# ============================================
# LANGGRAPH NODES
# ============================================

async def extract_intent_node(state: AgentState) -> AgentState:
    """
    Extract user intent and filters from the query
    """
    llm = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL)
    
    system_prompt = """You are a helpful assistant for StackNStay, a decentralized property rental platform.
    
Your job is to understand what the user is looking for in a property.

Extract:
- Location (city, country)
- Price range (min/max in STX)
- Number of bedrooms
- Number of guests
- Amenities (pool, wifi, parking, etc.)
- Any other preferences

Respond in JSON format:
{
  "search_query": "natural language search query",
  "filters": {
    "city": "Stockholm",
    "min_price": 50,
    "max_price": 200,
    "bedrooms": 2,
    "guests": 4,
    "amenities": ["pool", "wifi"]
  }
}

If the user is asking a follow-up question (like "show me the cheapest" or "tell me more about #2"), 
indicate that in the search_query.
"""
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=state.user_query)
    ]
    
    response = llm.invoke(messages)
    
    # Parse the response (simplified - in production, use structured output)
    # For now, just use the query as-is
    state.filters = state.filters or {}
    
    return state


async def search_properties_node(state: AgentState) -> AgentState:
    """
    Search for properties using FAISS vector store
    """
    try:
        # Perform semantic search
        results = await vector_store.search(
            query=state.user_query,
            k=5,
            filters=state.filters
        )
        
        state.search_results = results
        
    except Exception as e:
        print(f"Error in search: {e}")
        state.search_results = []
    
    return state


async def generate_response_node(state: AgentState) -> AgentState:
    """
    Generate conversational response with property recommendations
    """
    llm = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL, temperature=0.7)
    
    # Build context from search results
    context = ""
    if state.search_results:
        context = "Here are the properties I found:\n\n"
        for i, prop in enumerate(state.search_results[:5], 1):
            context += f"{i}. **{prop.get('title', 'Unknown')}**\n"
            context += f"   - Location: {prop.get('location_city', 'N/A')}\n"
            context += f"   - Price: {prop.get('price_per_night', 'N/A')} STX/night\n"
            context += f"   - Bedrooms: {prop.get('bedrooms', 'N/A')}\n"
            context += f"   - Guests: {prop.get('max_guests', 'N/A')}\n"
            if prop.get('amenities'):
                amenities = prop['amenities']
                if isinstance(amenities, list):
                    context += f"   - Amenities: {', '.join(amenities[:5])}\n"
            context += "\n"
    else:
        context = "I couldn't find any properties matching your criteria."
    
    system_prompt = f"""You are a friendly property rental assistant for StackNStay.

The user asked: "{state.user_query}"

{context}

Provide a helpful, conversational response. Highlight the best matches and explain why they're good fits.
Be enthusiastic and helpful. Keep it concise (2-3 sentences max).

If properties were found, suggest what the user might want to do next (e.g., "learn more", "see cheaper options", "book").
"""
    
    messages = state.messages + [
        SystemMessage(content=system_prompt),
        HumanMessage(content=state.user_query)
    ]
    
    response = llm.invoke(messages)
    state.final_response = response.content
    
    # Update conversation history
    state.messages.append(HumanMessage(content=state.user_query))
    state.messages.append(AIMessage(content=response.content))
    
    return state


# ============================================
# BUILD LANGGRAPH
# ============================================

def create_chat_graph():
    """Create the LangGraph conversational agent"""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("extract_intent", extract_intent_node)
    workflow.add_node("search_properties", search_properties_node)
    workflow.add_node("generate_response", generate_response_node)
    
    # Define edges
    workflow.set_entry_point("extract_intent")
    workflow.add_edge("extract_intent", "search_properties")
    workflow.add_edge("search_properties", "generate_response")
    workflow.add_edge("generate_response", END)
    
    # Compile with memory
    memory = MemorySaver()
    app = workflow.compile(checkpointer=memory)
    
    return app


# Create the graph
chat_graph = create_chat_graph()


# ============================================
# API ENDPOINTS
# ============================================

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with the RAG agent
    """
    try:
        # Ensure vector store is loaded
        if not vector_store.index:
            if not vector_store.load():
                raise HTTPException(
                    status_code=503,
                    detail="Vector store not initialized. Please run /api/index first."
                )
        
        # Create conversation ID if not provided
        conversation_id = request.conversation_id or f"conv_{os.urandom(8).hex()}"
        
        # Create initial state
        initial_state = AgentState(
            user_query=request.message,
            filters=request.filters or {},
            conversation_id=conversation_id,
            messages=[]
        )
        
        # Run the graph
        config = {"configurable": {"thread_id": conversation_id}}
        final_state = await chat_graph.ainvoke(initial_state.dict(), config)
        
        # Extract results
        properties = final_state.get("search_results", [])[:5]
        response_text = final_state.get("final_response", "I'm sorry, I couldn't process that request.")
        
        # Generate suggested actions
        suggested_actions = []
        if properties:
            suggested_actions = [
                "Show me cheaper options",
                "Tell me more about the first property",
                "Find properties with a pool"
            ]
        else:
            suggested_actions = [
                "Try a different location",
                "Adjust my budget",
                "See all available properties"
            ]
        
        return ChatResponse(
            response=response_text,
            properties=properties,
            conversation_id=conversation_id,
            suggested_actions=suggested_actions
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "vector_store_loaded": vector_store.index is not None,
        "properties_indexed": len(vector_store.property_metadata)
    }
