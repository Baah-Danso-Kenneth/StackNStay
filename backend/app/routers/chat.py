"""
RAG Chat Router - Smart Routing Agent
Handles both property search AND general StackNStay knowledge questions
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, TypedDict
import os
import asyncio
from dotenv import load_dotenv

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.services.vector_store import vector_store
from app.services.knowledge_store import knowledge_store

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


class ChatResponse(BaseModel):
    response: str
    properties: List[Dict[str, Any]]
    knowledge_snippets: List[Dict[str, Any]]
    conversation_id: str
    suggested_actions: List[str]
    query_type: str  # "property_search" or "knowledge" or "mixed"


# ============================================
# LANGGRAPH AGENT STATE
# ============================================

class AgentState(TypedDict):
    """State for the smart routing agent"""
    messages: List[Any]
    user_query: str
    query_type: str  # "property_search", "knowledge", or "mixed"
    property_results: List[Dict[str, Any]]
    knowledge_results: List[Dict[str, Any]]
    filters: Dict[str, Any]
    final_response: str
    conversation_id: str


# ============================================
# LANGGRAPH NODES
# ============================================

async def route_query_node(state: AgentState) -> Dict[str, Any]:
    """
    Determine if this is a property search or knowledge question
    """
    llm = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL, temperature=0)
    
    system_prompt = """You are a query classifier for StackNStay.

Classify the user's query into ONE of these categories:

1. **property_search**: User wants to find/search/browse properties
   Examples: "Find me a villa", "Show properties in Stockholm", "2-bedroom apartment"

2. **knowledge**: User has questions about StackNStay, how it works, fees, policies, etc.
   Examples: "What is StackNStay?", "How do fees work?", "What is block height?", "How to cancel?"

3. **mixed**: Query contains both property search AND general questions
   Examples: "What is StackNStay and show me properties", "Find me a villa and explain fees"

Respond with ONLY ONE WORD: property_search, knowledge, or mixed
"""
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Query: {state['user_query']}")
    ]
    
    response = llm.invoke(messages)
    query_type = response.content.strip().lower()
    
    # Validate response
    if query_type not in ["property_search", "knowledge", "mixed"]:
        # Default to knowledge if unclear
        query_type = "knowledge"
    
    return {"query_type": query_type}


async def extract_filters_node(state: AgentState) -> Dict[str, Any]:
    """
    Extract structured filters from user query
    """
    if state["query_type"] not in ["property_search", "mixed"]:
        return {}
        
    llm = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL, temperature=0)
    
    system_prompt = """You are a smart filter extractor for property search.
    
    Extract the following filters from the user's query if present:
    - location (city or country name)
    - min_price (number)
    - max_price (number)
    - bedrooms (number, minimum bedrooms)
    - guests (number, minimum capacity)
    
    Return ONLY a JSON object. Do not include markdown formatting.
    Example: {"location": "Ghana", "bedrooms": 2}
    If no filters found, return {}
    """
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Query: {state['user_query']}")
    ]
    
    try:
        response = llm.invoke(messages)
        content = response.content.strip()
        # Clean up potential markdown code blocks
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        import json
        filters = json.loads(content)
        
        # Merge with existing filters (if any)
        merged_filters = {**state["filters"], **filters}
        print(f"🔍 Extracted filters: {merged_filters}")
        
        return {"filters": merged_filters}
        
    except Exception as e:
        print(f"Error extracting filters: {e}")
        return {}


async def search_properties_node(state: AgentState) -> Dict[str, Any]:
    """
    Search for properties using FAISS vector store
    """
    if state["query_type"] in ["property_search", "mixed"]:
        try:
            results = await vector_store.search(
                query=state["user_query"],
                k=5,
                filters=state["filters"]
            )
            print(f"🏠 Found {len(results)} properties")
            return {"property_results": results}
        except Exception as e:
            print(f"Error in property search: {e}")
            return {"property_results": []}
    
    return {}


async def search_knowledge_node(state: AgentState) -> Dict[str, Any]:
    """
    Search knowledge base for relevant information
    """
    if state["query_type"] in ["knowledge", "mixed"]:
        try:
            results = await knowledge_store.search(
                query=state["user_query"],
                k=3
            )
            print(f"📚 Found {len(results)} knowledge snippets")
            return {"knowledge_results": results}
        except Exception as e:
            print(f"Error in knowledge search: {e}")
            return {"knowledge_results": []}
    
    return {}


async def generate_response_node(state: AgentState) -> Dict[str, Any]:
    """
    Generate unified response based on query type
    """
    llm = ChatGroq(api_key=GROQ_API_KEY, model=LLM_MODEL, temperature=0.7)
    
    # Build context based on query type
    context = ""
    
    # Add knowledge context
    if state["knowledge_results"]:
        context += "**StackNStay Information:**\n\n"
        for i, chunk in enumerate(state["knowledge_results"], 1):
            context += f"{i}. **{chunk.get('title', 'Info')}**\n"
            content = chunk.get('content', '')[:500]  # Limit length
            context += f"{content}\n\n"
    
    # Add property context
    if state["property_results"]:
        context += "**Available Properties:**\n\n"
        for i, prop in enumerate(state["property_results"][:5], 1):
            context += f"{i}. **{prop.get('title', 'Unknown')}**\n"
            context += f"   - Location: {prop.get('location_city', 'N/A')}\n"
            context += f"   - Price: {prop.get('price_per_night', 'N/A')} STX/night\n"
            context += f"   - Bedrooms: {prop.get('bedrooms', 'N/A')}\n"
            if prop.get('amenities'):
                amenities = prop['amenities']
                if isinstance(amenities, list):
                    context += f"   - Amenities: {', '.join(amenities[:5])}\n"
            context += "\n"
    
    # Handle no results
    if not state["knowledge_results"] and not state["property_results"]:
        if state["query_type"] == "property_search":
            context = "No properties found matching the criteria."
        else:
            context = "I don't have specific information about that in my knowledge base."
    
    # Create system prompt based on query type
    if state["query_type"] == "knowledge":
        system_prompt = f"""You are a helpful assistant for StackNStay, a decentralized property rental platform.

The user asked: "{state['user_query']}"

Here's the relevant information from our knowledge base:

{context}

Provide a clear, helpful answer based on this information. Be conversational and friendly.
If the information doesn't fully answer their question, say so and suggest they contact support.
Keep your response concise (2-4 sentences max).
"""
    elif state["query_type"] == "property_search":
        system_prompt = f"""You are a friendly property rental assistant for StackNStay.

The user asked: "{state['user_query']}"

{context}

Provide a helpful, conversational response. Highlight the best matches and explain why they're good fits.
Be enthusiastic and helpful. Keep it concise (2-3 sentences max).

If properties were found, suggest what the user might want to do next.
"""
    else:  # mixed
        system_prompt = f"""You are a helpful assistant for StackNStay.

The user asked: "{state['user_query']}"

{context}

Answer their question AND show them relevant properties. Be conversational and helpful.
Keep it concise but cover both aspects of their query.
"""
    
    messages = state["messages"] + [
        SystemMessage(content=system_prompt),
        HumanMessage(content=state["user_query"])
    ]
    
    response = llm.invoke(messages)
    
    # Update conversation history
    updated_messages = state["messages"] + [
        HumanMessage(content=state["user_query"]),
        AIMessage(content=response.content)
    ]
    
    return {
        "final_response": response.content,
        "messages": updated_messages
    }


# ============================================
# BUILD LANGGRAPH
# ============================================

def create_smart_chat_graph():
    """Create the smart routing LangGraph agent"""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("route_query", route_query_node)
    workflow.add_node("extract_filters", extract_filters_node)
    workflow.add_node("search_properties", search_properties_node)
    workflow.add_node("search_knowledge", search_knowledge_node)
    workflow.add_node("generate_response", generate_response_node)
    
    # Define edges
    workflow.set_entry_point("route_query")
    workflow.add_edge("route_query", "extract_filters")
    workflow.add_edge("extract_filters", "search_properties")
    workflow.add_edge("search_properties", "search_knowledge")
    workflow.add_edge("search_knowledge", "generate_response")
    workflow.add_edge("generate_response", END)
    
    # Compile with memory
    memory = MemorySaver()
    app = workflow.compile(checkpointer=memory)
    
    return app


# Create the graph
smart_chat_graph = create_smart_chat_graph()


# ============================================
# API ENDPOINTS
# ============================================

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Smart chat endpoint - handles both property search and knowledge questions
    """
    try:
        # Ensure stores are loaded (support async or sync load())
        if not vector_store.index:
            maybe = vector_store.load()
            if asyncio.iscoroutine(maybe):
                loaded = await maybe
            else:
                loaded = maybe

        if not knowledge_store.index:
            maybe_k = knowledge_store.load()
            if asyncio.iscoroutine(maybe_k):
                await maybe_k
        
        # Create conversation ID if not provided
        conversation_id = request.conversation_id or f"conv_{os.urandom(8).hex()}"
        
        # Create initial state
        initial_state: AgentState = {
            "user_query": request.message,
            "filters": request.filters or {},
            "conversation_id": conversation_id,
            "messages": [],
            "query_type": "",
            "property_results": [],
            "knowledge_results": [],
            "final_response": ""
        }
        
        # Run the smart routing graph
        config = {"configurable": {"thread_id": conversation_id}}
        final_state = await smart_chat_graph.ainvoke(initial_state, config)
        
        # Extract results
        properties = final_state.get("property_results", [])[:5]
        knowledge = final_state.get("knowledge_results", [])[:3]
        response_text = final_state.get("final_response", "I'm sorry, I couldn't process that request.")
        query_type = final_state.get("query_type", "unknown")
        
        # Generate suggested actions based on query type
        suggested_actions = []
        
        if query_type == "property_search" and properties:
            suggested_actions = [
                "Show me cheaper options",
                "Tell me more about the first property",
                "What amenities are available?"
            ]
        elif query_type == "knowledge":
            suggested_actions = [
                "How do I get started?",
                "Tell me about fees",
                "Show me available properties"
            ]
        elif query_type == "mixed":
            suggested_actions = [
                "Tell me more about these properties",
                "Explain the booking process",
                "Show me similar properties"
            ]
        else:
            suggested_actions = [
                "What is StackNStay?",
                "Show me properties",
                "How does it work?"
            ]
        
        return ChatResponse(
            response=response_text,
            properties=properties,
            knowledge_snippets=knowledge,
            conversation_id=conversation_id,
            suggested_actions=suggested_actions,
            query_type=query_type
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Also handle requests without trailing slash explicitly
@router.post("", response_model=ChatResponse)
async def chat_no_slash(request: ChatRequest):
    """Smart chat endpoint (no trailing slash)"""
    return await chat(request)



@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "property_store_loaded": vector_store.index is not None,
        "knowledge_store_loaded": knowledge_store.index is not None,
        "properties_indexed": len(vector_store.property_metadata),
        "knowledge_chunks": len(knowledge_store.knowledge_chunks)
    }

