import sys
import os
from pathlib import Path

# Add backend directory to path
backend_path = Path(__file__).parent.parent
sys.path.append(str(backend_path))

try:
    print("Testing imports...")
    from app.core.config import get_settings
    from ai.rag.knowledge_base import StacksStayRAG
    from ai.agents.concierge import TravelConciergeAgent
    print("✅ Imports successful (RAG + Agents)")

    print("Checking settings...")
    settings = get_settings()
    if not settings.GROQ_API_KEY:
        print("⚠️ GROQ_API_KEY is missing in settings! RAG will fail to initialize.")
    else:
        print("✅ GROQ_API_KEY found")

    print("Initializing StacksStayRAG...")
    try:
        rag = StacksStayRAG()
        print("✅ StacksStayRAG initialized successfully")
    except Exception as e:
        print(f"❌ StacksStayRAG initialization failed: {e}")

except ImportError as e:
    print(f"❌ Import failed: {e}")
    print("Did you install the new requirements?")
except Exception as e:
    print(f"❌ Unexpected error: {e}")
