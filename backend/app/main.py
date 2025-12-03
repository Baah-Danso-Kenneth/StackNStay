import sys
import types

# Monkeypatch for requests-toolbelt compatibility with urllib3 v2
# This fixes ImportError: cannot import name 'appengine' from 'urllib3.contrib'
try:
    import urllib3.contrib
    sys.modules["urllib3.contrib.appengine"] = types.ModuleType("urllib3.contrib.appengine")
except ImportError:
    pass

# Mock missing AI dependencies to allow server startup
# These packages are not installed in the environment
try:
    import anthropic
except ImportError:
    sys.modules["anthropic"] = types.ModuleType("anthropic")
    sys.modules["anthropic.types"] = types.ModuleType("anthropic.types")

try:
    import langchain
except ImportError:
    sys.modules["langchain"] = types.ModuleType("langchain")
    sys.modules["langchain.vectorstores"] = types.ModuleType("langchain.vectorstores")
    sys.modules["langchain.embeddings"] = types.ModuleType("langchain.embeddings")
    sys.modules["langchain.text_splitter"] = types.ModuleType("langchain.text_splitter")
    sys.modules["langchain.document_loaders"] = types.ModuleType("langchain.document_loaders")
    sys.modules["langchain_community"] = types.ModuleType("langchain_community")
    sys.modules["langchain_community.vectorstores"] = types.ModuleType("langchain_community.vectorstores")

try:
    import openai
except ImportError:
    sys.modules["openai"] = types.ModuleType("openai")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.routes import auth, properties, bookings, reviews, users, disputes, ai, ipfs


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events"""
    # Startup
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    await init_db()
    print("✓ Application startup complete")

    yield

    # Shutdown
    await close_db()
    print("✓ Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
    description="Decentralized vacation rental platform on Stacks blockchain"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Register all routers
app.include_router(auth.router, prefix="/api")
app.include_router(properties.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(disputes.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(ipfs.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "network": settings.STACKS_NETWORK
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }