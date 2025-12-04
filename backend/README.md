# StackNStay Backend - RAG Chatbot & Recommendations

AI-powered property search with LangGraph conversational agent and FAISS vector store.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

- **GROQ_API_KEY**: Get from [console.groq.com](https://console.groq.com)
- **COHERE_API_KEY**: Get from [dashboard.cohere.com](https://dashboard.cohere.com) (FREE tier)

### 3. Configure Blockchain

Update in `.env`:
- `STACKS_CONTRACT_ADDRESS`: Your deployed contract address
- `STACKS_API_URL`: `https://api.testnet.hiro.so` or `https://api.mainnet.hiro.so`

### 4. Run the Server

```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Index Properties

```bash
curl -X POST http://localhost:8000/api/index
```

This fetches properties from blockchain and creates the FAISS index.

---

## 📡 API Endpoints

### Chat (LangGraph RAG)

```bash
POST /api/chat
{
  "message": "Find me a 2-bedroom apartment in Stockholm under 100 STX",
  "conversation_id": "optional-uuid",
  "filters": {
    "city": "Stockholm",
    "max_price": 100
  }
}
```

**Response:**
```json
{
  "response": "I found 3 great apartments in Stockholm...",
  "properties": [...],
  "conversation_id": "uuid",
  "suggested_actions": ["Show me cheaper options", "Tell me more"]
}
```

### Semantic Search

```bash
POST /api/search
{
  "query": "luxury villa with pool near beach",
  "limit": 10,
  "filters": {
    "min_price": 50,
    "max_price": 200
  }
}
```

### Recommendations

```bash
POST /api/recommendations
{
  "property_id": 5,
  "limit": 4
}
```

### Manual Indexing

```bash
POST /api/index
```

### Health Check

```bash
GET /health
```

---

## 🏗️ Architecture

```
User Query
    ↓
LangGraph Agent
    ├─ Extract Intent (LLM)
    ├─ Search FAISS (Cohere embeddings)
    └─ Generate Response (Groq LLM)
    ↓
Response + Property Cards
```

### Components

- **blockchain.py**: Fetches properties from Stacks smart contract
- **vector_store.py**: FAISS indexing with Cohere embeddings
- **chat.py**: LangGraph conversational agent with memory
- **search.py**: Recommendations and search endpoints
- **main.py**: FastAPI application

---

## 🔑 API Keys

### Required

1. **Groq** (FREE): https://console.groq.com
   - Used for: LLM chat responses
   - Free tier: Generous limits

2. **Cohere** (FREE): https://dashboard.cohere.com
   - Used for: Text embeddings
   - Free tier: 1000 calls/month

### Optional

3. **LangSmith** (FREE tier): https://smith.langchain.com
   - Used for: Debugging and monitoring
   - Free tier: 5K traces/month

---

## 📦 Data Storage

- **FAISS Index**: `data/vector_store/faiss_index.bin`
- **Property Metadata**: `data/vector_store/property_metadata.json`

The index is automatically loaded on startup. Re-index with `POST /api/index`.

---

## 🚢 Deployment (Railway)

1. Push to GitHub
2. Connect Railway to your repo
3. Add environment variables in Railway dashboard
4. Deploy!

Railway will automatically:
- Install dependencies from `requirements.txt`
- Run the FastAPI server
- Persist the vector store

---

## 🧪 Testing

```bash
# Health check
curl http://localhost:8000/health

# Index properties
curl -X POST http://localhost:8000/api/index

# Chat
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me properties in Stockholm"}'

# Search
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "beachfront villa", "limit": 5}'
```

---

## 🎯 Features

✅ **LangGraph Conversational Agent** - Multi-turn conversations with memory  
✅ **Semantic Search** - Find properties by natural language  
✅ **Smart Recommendations** - Similar property suggestions  
✅ **FAISS Vector Store** - Fast similarity search  
✅ **Cohere Embeddings** - Lightweight, no PyTorch needed  
✅ **Groq LLM** - Fast, free chat responses  
✅ **Blockchain Integration** - Fetch from Stacks smart contract  
✅ **IPFS Metadata** - Decentralized property data  

---

## 🐛 Troubleshooting

**"Vector store not initialized"**
- Run `POST /api/index` to create the index

**"Cohere API error"**
- Check your `COHERE_API_KEY` in `.env`
- Verify you haven't exceeded free tier limits

**"No properties found"**
- Verify `STACKS_CONTRACT_ADDRESS` is correct
- Check that properties exist on blockchain
- Ensure IPFS gateway is accessible

---

## 📝 License

MIT
