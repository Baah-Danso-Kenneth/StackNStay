"""
Vector Store Service - FAISS + Cohere Embeddings
Handles property indexing and semantic search
"""
import os
import json
import faiss
import numpy as np
import asyncpg
import asyncio
from typing import List, Dict, Any, Optional
from pathlib import Path
import cohere
from dotenv import load_dotenv

load_dotenv()

# Configuration
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
VECTOR_BACKEND = os.getenv("VECTOR_BACKEND", "auto")
VECTOR_STORE_PATH = Path("data/vector_store")
FAISS_INDEX_FILE = VECTOR_STORE_PATH / "faiss_index.bin"
METADATA_FILE = VECTOR_STORE_PATH / "property_metadata.json"


def create_property_text(property_data: Dict[str, Any]) -> str:
    """Create searchable text from property data (shared helper)."""
    parts: List[str] = []

    # Title
    if property_data.get("title"):
        parts.append(f"Property: {property_data['title']}")

    # Location
    if property_data.get("location_city"):
        parts.append(f"Location: {property_data['location_city']}")
    if property_data.get("location_country"):
        parts.append(f"Country: {property_data['location_country']}")

    # Price
    if property_data.get("price_per_night"):
        parts.append(f"Price: {property_data['price_per_night']} STX per night")

    # Amenities
    if property_data.get("amenities"):
        amenities = property_data["amenities"]
        if isinstance(amenities, list):
            parts.append(f"Amenities: {', '.join(amenities)}")
        else:
            parts.append(f"Amenities: {amenities}")

    # Capacity
    if property_data.get("max_guests"):
        parts.append(f"Sleeps {property_data['max_guests']} guests")
    if property_data.get("bedrooms"):
        parts.append(f"{property_data['bedrooms']} bedrooms")
    if property_data.get("bathrooms"):
        parts.append(f"{property_data['bathrooms']} bathrooms")

    # Description
    if property_data.get("description"):
        parts.append(f"Description: {property_data['description']}")

    # Host reputation and badges (NEW - from enriched data)
    if property_data.get("is_superhost"):
        parts.append("Superhost verified property")

    if property_data.get("host_badges"):
        badges = property_data["host_badges"]
        badge_text = ", ".join(badges)
        parts.append(f"Host achievements: {badge_text}")

    if property_data.get("host_reputation"):
        reputation = property_data["host_reputation"]
        avg_rating = reputation.get("average_rating", 0)
        total_reviews = reputation.get("total_reviews", 0)
        if avg_rating > 0:
            parts.append(f"Host rating: {avg_rating:.1f} stars from {total_reviews} reviews")

    return ". ".join(parts)


class VectorStore:
    """FAISS vector store with Cohere embeddings for property search"""
    
    def __init__(self):
        self.cohere_client = cohere.Client(COHERE_API_KEY) if COHERE_API_KEY else None
        self.index: Optional[faiss.Index] = None
        self.property_metadata: List[Dict[str, Any]] = []
        self.dimension = 1024  # Cohere embed-english-v3.0 dimension
        
        # Create data directory if it doesn't exist
        VECTOR_STORE_PATH.mkdir(parents=True, exist_ok=True)
        
    def _create_property_text(self, property_data: Dict[str, Any]) -> str:
        """
        Create searchable text from property data
        """
        return create_property_text(property_data)
    
    async def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings using Cohere API
        """
        if not self.cohere_client:
            raise ValueError("Cohere API key not configured")
        
        try:
            response = self.cohere_client.embed(
                texts=texts,
                model="embed-english-v3.0",
                input_type="search_document"
            )
            
            embeddings = np.array(response.embeddings, dtype=np.float32)
            return embeddings
            
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            raise
    
    async def embed_query(self, query: str) -> np.ndarray:
        """
        Generate embedding for search query
        """
        if not self.cohere_client:
            raise ValueError("Cohere API key not configured")
        
        try:
            response = self.cohere_client.embed(
                texts=[query],
                model="embed-english-v3.0",
                input_type="search_query"
            )
            
            embedding = np.array(response.embeddings[0], dtype=np.float32)
            return embedding
            
        except Exception as e:
            print(f"Error generating query embedding: {e}")
            raise
    
    async def index_properties(self, properties: List[Dict[str, Any]]) -> int:
        """
        Index all properties into FAISS
        """
        if not properties:
            print("⚠️ No properties to index")
            return 0
        
        print(f"📝 Indexing {len(properties)} properties...")
        
        # Create searchable texts
        texts = [self._create_property_text(prop) for prop in properties]
        
        # Generate embeddings
        print("🔄 Generating embeddings with Cohere...")
        embeddings = await self.embed_texts(texts)
        
        # Create FAISS index
        self.dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner product (cosine similarity)
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        
        # Add to index
        self.index.add(embeddings)
        
        # Store metadata
        self.property_metadata = properties
        
        # Save to disk
        self.save()
        
        print(f"✅ Indexed {len(properties)} properties successfully!")
        return len(properties)
    
    async def search(
        self,
        query: str,
        k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
        min_score: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Semantic search for properties
        """
        if not self.index or not self.property_metadata:
            print("⚠️ Index not loaded. Call load() or index_properties() first.")
            return []
        
        # Generate query embedding
        query_embedding = await self.embed_query(query)
        query_embedding = query_embedding.reshape(1, -1)
        
        # Normalize for cosine similarity
        faiss.normalize_L2(query_embedding)
        
        # Search
        scores, indices = self.index.search(query_embedding, k)
        
        # Get results
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.property_metadata):
                property_data = self.property_metadata[idx].copy()
                property_data["match_score"] = float(scores[0][i])
                
                # Filter by score
                if property_data["match_score"] < min_score:
                    continue
                
                # Apply filters if provided
                if filters:
                    if not self._matches_filters(property_data, filters):
                        continue
                
                results.append(property_data)
        
        return results
    
    def _matches_filters(self, property_data: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """
        Check if property matches filters
        """
        # Price range
        if "min_price" in filters:
            if property_data.get("price_per_night", 0) < filters["min_price"]:
                return False
        
        if "max_price" in filters:
            if property_data.get("price_per_night", float('inf')) > filters["max_price"]:
                return False
        
        # Location (Fuzzy match)
        if "location" in filters:
            search_loc = filters["location"].lower()
            city = property_data.get("location_city", "").lower()
            country = property_data.get("location_country", "").lower()
            title = property_data.get("title", "").lower()
            desc = property_data.get("description", "").lower()
            
            # Check if location term appears in any relevant field
            if (search_loc not in city and 
                search_loc not in country and 
                search_loc not in title and 
                search_loc not in desc):
                return False
        
        # City (Exact match)
        if "city" in filters:
            if property_data.get("location_city", "").lower() != filters["city"].lower():
                return False
        
        # Bedrooms
        if "bedrooms" in filters:
            if property_data.get("bedrooms", 0) < filters["bedrooms"]:
                return False
        
        # Guests
        if "guests" in filters:
            if property_data.get("max_guests", 0) < filters["guests"]:
                return False
        
        return True
    
    async def get_similar_properties(
        self,
        property_id: int,
        k: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Find properties similar to a given property
        """
        # Find the property in metadata
        target_property = None
        target_idx = None
        
        for idx, prop in enumerate(self.property_metadata):
            if prop.get("property_id") == property_id:
                target_property = prop
                target_idx = idx
                break
        
        if not target_property:
            return []
        
        # Get the embedding vector for this property
        if not self.index:
            return []
        
        # Reconstruct the vector from index
        target_vector = self.index.reconstruct(target_idx).reshape(1, -1)
        
        # Search for similar (k+1 to exclude itself)
        scores, indices = self.index.search(target_vector, k + 1)
        
        # Get results (skip first one as it's the property itself)
        results = []
        for i, idx in enumerate(indices[0][1:]):  # Skip first result
            if idx < len(self.property_metadata):
                property_data = self.property_metadata[idx].copy()
                property_data["match_score"] = float(scores[0][i + 1])
                results.append(property_data)
        
        return results
    
    def save(self):
        """Save index and metadata to disk"""
        if self.index:
            faiss.write_index(self.index, str(FAISS_INDEX_FILE))
            print(f"💾 Saved FAISS index to {FAISS_INDEX_FILE}")
        
        if self.property_metadata:
            with open(METADATA_FILE, 'w') as f:
                json.dump(self.property_metadata, f, indent=2)
            print(f"💾 Saved metadata to {METADATA_FILE}")
    
    def load(self) -> bool:
        """Load index and metadata from disk"""
        try:
            if FAISS_INDEX_FILE.exists() and METADATA_FILE.exists():
                self.index = faiss.read_index(str(FAISS_INDEX_FILE))
                
                with open(METADATA_FILE, 'r') as f:
                    self.property_metadata = json.load(f)
                
                print(f"✅ Loaded {len(self.property_metadata)} properties from disk")
                return True
            else:
                print("⚠️ No saved index found")
                return False
                
        except Exception as e:
            print(f"❌ Error loading index: {e}")
            return False


# --- PGVector adapter ---
class PGVectorStore:
    """Postgres + pgvector adapter using asyncpg"""

    def __init__(self):
        self.cohere_client = cohere.Client(COHERE_API_KEY) if COHERE_API_KEY else None
        self.pool: Optional[asyncpg.pool.Pool] = None
        self.property_metadata = []
        self.index = None
        self.dimension = 1024

    async def _ensure_pool(self):
        if not self.pool:
            if not DATABASE_URL:
                raise ValueError("DATABASE_URL is not configured for pgvector backend")
            # Strip +asyncpg suffix if present (SQLAlchemy format)
            db_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
            self.pool = await asyncpg.create_pool(db_url)

    def _embedding_to_pgvector(self, emb: np.ndarray) -> str:
        # Convert numpy array to pgvector literal string: [0.1,0.2,...]
        return "[" + ",".join(f"{float(x):.6f}" for x in emb.tolist()) + "]"

    async def embed_texts(self, texts: List[str]) -> np.ndarray:
        if not self.cohere_client:
            raise ValueError("Cohere API key not configured")
        response = self.cohere_client.embed(
            texts=texts,
            model="embed-english-v3.0",
            input_type="search_document"
        )
        embeddings = np.array(response.embeddings, dtype=np.float32)
        return embeddings

    async def embed_query(self, query: str) -> np.ndarray:
        if not self.cohere_client:
            raise ValueError("Cohere API key not configured")
        response = self.cohere_client.embed(
            texts=[query],
            model="embed-english-v3.0",
            input_type="search_query"
        )
        embedding = np.array(response.embeddings[0], dtype=np.float32)
        return embedding

    async def index_properties(self, properties: List[Dict[str, Any]]) -> int:
        if not properties:
            return 0
        texts = [create_property_text(prop) for prop in properties]
        embeddings = await self.embed_texts(texts)

        await self._ensure_pool()

        async with self.pool.acquire() as conn:
            async with conn.transaction():
                for prop, emb in zip(properties, embeddings):
                    emb_str = self._embedding_to_pgvector(emb)
                    metadata = json.dumps(prop)
                    await conn.execute(
                        "INSERT INTO property_embeddings(property_id, title, embedding, metadata) VALUES($1, $2, $3::vector, $4::jsonb)",
                        prop.get("property_id"), prop.get("title"), emb_str, metadata
                    )

        self.property_metadata = properties
        print(f"✅ Indexed {len(properties)} properties into Postgres")
        return len(properties)

    async def search(self, query: str, k: int = 5, filters: Optional[Dict[str, Any]] = None, min_score: float = 0.0) -> List[Dict[str, Any]]:
        # Quick check whether table has rows
        await self._ensure_pool()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT 1 FROM property_embeddings LIMIT 1")
            if not row:
                print("⚠️ No properties indexed in Postgres")
                return []

        query_emb = await self.embed_query(query)
        emb_str = self._embedding_to_pgvector(query_emb)

        results = []
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT property_id, title, metadata, embedding <-> $1::vector AS distance FROM property_embeddings ORDER BY embedding <-> $1::vector LIMIT $2",
                emb_str, k
            )
            for r in rows:
                meta = r.get("metadata")
                if isinstance(meta, str):
                    try:
                        meta = json.loads(meta)
                    except:
                        meta = {}
                results.append({**(meta or {}), "match_score": float(r.get("distance"))})

        return results

    async def _has_rows(self) -> bool:
        await self._ensure_pool()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT 1 FROM property_embeddings LIMIT 1")
            return bool(row)

    def save(self):
        # No-op for Postgres backend (data is persisted in DB)
        pass

    async def load(self) -> bool:
        """Load metadata from Postgres into memory and set index flag.

        This method is async. Callers may `await` it. The code that uses
        `vector_store.load()` in the app will detect coroutine results and
        await when necessary.
        """
        try:
            await self._ensure_pool()
            async with self.pool.acquire() as conn:
                rows = await conn.fetch("SELECT metadata FROM property_embeddings")
                metas = []
                for r in rows:
                    meta = r.get("metadata")
                    if isinstance(meta, str):
                        try:
                            meta = json.loads(meta)
                        except Exception:
                            meta = {}
                    metas.append(meta or {})

                self.property_metadata = metas
                self.index = bool(self.property_metadata)
                print(f"✅ Loaded {len(self.property_metadata)} properties from Postgres")
                return True
        except Exception as e:
            print(f"⚠️ Error loading properties from Postgres: {e}")
            return False


# Singleton instance selection
if DATABASE_URL and (VECTOR_BACKEND == "pgvector" or VECTOR_BACKEND == "auto"):
    # Use Postgres pgvector backend when DATABASE_URL is provided
    vector_store = PGVectorStore()
else:
    vector_store = VectorStore()
