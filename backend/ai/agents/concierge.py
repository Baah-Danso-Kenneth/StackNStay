from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage, AIMessage, BaseMessage
from langchain_core.tools import tool
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import get_settings
from ai.tools.property_search import PropertySearchTool
from ai.prompts.system_prompts import CONCIERGE_SYSTEM_PROMPT
import json

settings = get_settings()


class TravelConciergeAgent:
    """AI agent for property search and recommendations using Groq"""

    def __init__(self, db: Session):
        self.db = db
        self.search_tool = PropertySearchTool(db)
        
        # Initialize Groq LLM
        self.llm = ChatGroq(
            model_name="llama3-8b-8192",
            groq_api_key=settings.GROQ_API_KEY,
            temperature=0.3,
            max_tokens=1000
        )

        # Define tools
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "search_properties",
                    "description": "Search for vacation rental properties based on filters like location, price, bedrooms, guests",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "city": {
                                "type": "string",
                                "description": "City name (e.g., 'Tokyo', 'Bali', 'Lisbon')"
                            },
                            "max_price": {
                                "type": "number",
                                "description": "Maximum price per night in STX"
                            },
                            "min_bedrooms": {
                                "type": "integer",
                                "description": "Minimum number of bedrooms"
                            },
                            "max_guests": {
                                "type": "integer",
                                "description": "Maximum number of guests"
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_property_details",
                    "description": "Get full details about a specific property",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "property_id": {
                                "type": "integer",
                                "description": "The blockchain property ID"
                            }
                        },
                        "required": ["property_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "calculate_booking_cost",
                    "description": "Calculate total cost for booking a property including platform fees",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "property_id": {
                                "type": "integer",
                                "description": "The property blockchain ID"
                            },
                            "num_nights": {
                                "type": "integer",
                                "description": "Number of nights to stay"
                            }
                        },
                        "required": ["property_id", "num_nights"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "prepare_booking",
                    "description": "Prepare booking details for user to execute via wallet",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "property_id": {"type": "integer"},
                            "check_in_block": {"type": "integer"},
                            "check_out_block": {"type": "integer"},
                            "num_nights": {"type": "integer"}
                        },
                        "required": ["property_id", "check_in_block", "check_out_block", "num_nights"]
                    }
                }
            }
        ]

        # Bind tools to LLM
        self.llm_with_tools = self.llm.bind_tools(self.tools)

    def chat(self, user_message: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """
        Main chat method - handles user messages and tool calling
        """
        if conversation_history is None:
            conversation_history = []

        # Convert dict history to LangChain messages
        messages = self._convert_history_to_messages(conversation_history)
        
        # Add current system prompt and user message
        if not any(isinstance(m, SystemMessage) for m in messages):
            messages.insert(0, SystemMessage(content=CONCIERGE_SYSTEM_PROMPT))
            
        messages.append(HumanMessage(content=user_message))

        # First call to LLM
        response = self.llm_with_tools.invoke(messages)
        messages.append(response)

        # Handle tool calls
        while response.tool_calls:
            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                tool_id = tool_call["id"]

                # Execute tool
                tool_result = self._execute_tool(tool_name, tool_args)

                # Append tool result
                messages.append(ToolMessage(
                    content=str(tool_result),
                    tool_call_id=tool_id,
                    name=tool_name
                ))

            # Call LLM again with tool outputs
            response = self.llm_with_tools.invoke(messages)
            messages.append(response)

        # Extract final text
        final_text = response.content

        # Convert back to dict history for frontend/storage
        updated_history = self._convert_messages_to_history(messages)

        return {
            "response": final_text,
            "conversation_history": updated_history
        }

    def _execute_tool(self, tool_name: str, tool_input: Dict) -> Any:
        """Execute the requested tool"""
        try:
            if tool_name == "search_properties":
                return self.search_tool.search_properties(**tool_input)
            elif tool_name == "get_property_details":
                return self.search_tool.get_property_details(tool_input["property_id"])
            elif tool_name == "calculate_booking_cost":
                return self.search_tool.calculate_booking_cost(
                    tool_input["property_id"],
                    tool_input["num_nights"]
                )
            elif tool_name == "prepare_booking":
                return self._prepare_booking(**tool_input)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"error": f"Tool execution failed: {str(e)}"}

    def _prepare_booking(self, property_id: int, check_in_block: int, check_out_block: int, num_nights: int):
        """Prepare booking data but DON'T execute it"""
        cost_info = self.search_tool.calculate_booking_cost(property_id, num_nights)
        property_details = self.search_tool.get_property_details(property_id)

        return {
            "action": "BOOKING_READY",
            "property": property_details,
            "booking_details": {
                "property_id": property_id,
                "check_in_block": check_in_block,
                "check_out_block": check_out_block,
                "num_nights": num_nights,
                "total_cost_stx": cost_info["total_cost_stx"],
                "base_cost_stx": cost_info["base_cost_stx"],
                "platform_fee_stx": cost_info["platform_fee_stx"]
            },
            "message": "Ready to book! User must connect wallet and approve transaction.",
            "requires_wallet": True
        }

    def _convert_history_to_messages(self, history: List[Dict]) -> List[BaseMessage]:
        """Convert list of dicts to LangChain BaseMessages"""
        messages = []
        for msg in history:
            role = msg.get("role")
            content = msg.get("content")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))
            elif role == "system":
                messages.append(SystemMessage(content=content))
        return messages

    def _convert_messages_to_history(self, messages: List[BaseMessage]) -> List[Dict]:
        """Convert LangChain messages back to simple dicts for storage"""
        history = []
        for msg in messages:
            if isinstance(msg, HumanMessage):
                history.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                history.append({"role": "assistant", "content": msg.content})
            elif isinstance(msg, SystemMessage):
                history.append({"role": "system", "content": msg.content})
            # Skip ToolMessages in history for simplicity unless needed for debugging
        return history