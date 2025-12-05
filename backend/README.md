# StackNStay Backend - RAG Chatbot & Recommendations

AI-powered property search with **Smart Routing** - handles both property search AND general StackNStay knowledge questions!

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

- **GROQ_API_KEY**: Get from [console.groq.com](https://console.groq.com) (FREE)
- **COHERE_API_KEY**: Get from [dashboard.cohere.com](https://dashboard.cohere.com) (FREE)

### 3. Configure Blockchain

Update in `.env`:
- `STACKS_CONTRACT_ADDRESS`: Your deployed contract address
- `STACKS_API_URL`: `https://api.testnet.hiro.so` or `https://api.mainnet.hiro.so`

### 4. Run the Server

```bash
cd app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Index Everything

```bash
# Index properties from blockchain
curl -X POST http://localhost:8000/api/index

# Index knowledge base (FAQ, guides)
curl -X POST http://localhost:8000/api/index/knowledge
```

---

## 🎯 Smart Routing Chat

The chatbot **automatically detects** what type of question you're asking:

### **Property Search Questions**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me a 2-bedroom apartment in Stockholm"}'
```

**Response:**
- `query_type`: "property_search"
- `properties`: [list of matching properties]
- `knowledge_snippets`: []

### **Knowledge Questions**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is StackNStay and how do fees work?"}'
```

**Response:**
- `query_type`: "knowledge"
- `properties`: []
- `knowledge_snippets`: [relevant FAQ sections]

### **Mixed Questions**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is StackNStay and show me properties in Berlin"}'
```

**Response:**
- `query_type`: "mixed"
- `properties`: [list of properties in Berlin]
- `knowledge_snippets`: [info about StackNStay]

---

## 📡 API Endpoints

### Chat (Smart Routing)

```bash
POST /api/chat
{
  "message": "Your question here",
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
  "response": "AI-generated response",
  "properties": [...],
  "knowledge_snippets": [...],
  "conversation_id": "uuid",
  "suggested_actions": ["...", "...", "..."],
  "query_type": "property_search|knowledge|mixed"
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

### Indexing

```bash
# Index properties from blockchain
POST /api/index

# Index knowledge base
POST /api/index/knowledge

# Check status
GET /api/index/status
```

### Health Check

```bash
GET /health
```

---

## 🏗️ Architecture

```
User Query: "What is StackNStay and find me a villa"
                    ↓
         Smart Routing Agent (LLM)
                    ↓
         Classifies as: "mixed"
                    ↓
    ┌───────────────┴───────────────┐
    │                               │
Property RAG                  Knowledge RAG
(FAISS + Properties)          (FAISS + FAQ)
    │                               │
    └───────────────┬───────────────┘
                    ↓
         Unified Response (LLM)
                    ↓
    "StackNStay is a decentralized platform...
     Here are 3 villas I found for you..."
```

### Components

- **blockchain.py**: Fetches properties from Stacks smart contract
- **vector_store.py**: FAISS indexing for property search
- **knowledge_store.py**: FAISS indexing for FAQ/knowledge base
- **chat.py**: Smart routing LangGraph agent
- **search.py**: Recommendations and indexing endpoints
- **main.py**: FastAPI application
- **knowledge_base.md**: All StackNStay information (fees, policies, guides)

---

## 🎨 Frontend Integration

### Chat Component Example

```typescript
const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  
  const sendMessage = async (message) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    const data = await response.json();
    
    // Display based on query type
    if (data.query_type === 'knowledge') {
      // Show FAQ answer
      displayAnswer(data.response);
    } else if (data.query_type === 'property_search') {
      // Show property cards
      displayProperties(data.properties);
    } else {
      // Show both
      displayAnswer(data.response);
      displayProperties(data.properties);
    }
  };
};
```

---

## 🔑 API Keys

### Required

1. **Groq** (FREE): https://console.groq.com
   - Used for: LLM chat responses and query routing
   - Free tier: Generous limits

2. **Cohere** (FREE): https://dashboard.cohere.com
   - Used for: Text embeddings (both properties and knowledge)
   - Free tier: 1000 calls/month

### Optional

3. **LangSmith** (FREE tier): https://smith.langchain.com
   - Used for: Debugging and monitoring
   - Free tier: 5K traces/month

---

## 📦 Data Storage

- **Property FAISS Index**: `data/vector_store/faiss_index.bin`
- **Property Metadata**: `data/vector_store/property_metadata.json`
- **Knowledge FAISS Index**: `knowledge_store/knowledge_index.bin`
- **Knowledge Chunks**: `knowledge_store/knowledge_chunks.json`

Indexes are automatically loaded on startup. Re-index with:
- `POST /api/index` (properties)
- `POST /api/index/knowledge` (FAQ)

---

## 🧪 Testing

```bash
# Run test suite
python test_setup.py

# Test smart routing
python test_smart_chat.py

# Manual tests
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is StackNStay?"}'

curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me a villa in Miami"}'
```

---

## 🚢 Deployment (Railway)

1. Push to GitHub
2. Connect Railway to your repo
3. Add environment variables:
   - `GROQ_API_KEY`
   - `COHERE_API_KEY`
   - `STACKS_CONTRACT_ADDRESS`
   - `STACKS_API_URL`
4. Deploy!
5. Index both stores:
   ```bash
   curl -X POST https://your-app.railway.app/api/index
   curl -X POST https://your-app.railway.app/api/index/knowledge
   ```

---

## 🎯 Features

✅ **Smart Query Routing** - Auto-detects property search vs knowledge questions  
✅ **Dual RAG System** - Separate indexes for properties and FAQ  
✅ **LangGraph Agent** - Multi-turn conversations with memory  
✅ **Semantic Search** - Natural language property search  
✅ **Knowledge Base** - Answers about fees, policies, how-to guides  
✅ **Smart Recommendations** - Similar property suggestions  
✅ **FAISS Vector Store** - Fast similarity search  
✅ **Cohere Embeddings** - Lightweight, no PyTorch!  
✅ **Groq LLM** - Fast, free chat responses  
✅ **Blockchain Integration** - Fetch from Stacks smart contract  
✅ **IPFS Support** - Decentralized metadata  

---

## 💡 Example Queries

**Knowledge Questions:**
- "What is StackNStay?"
- "How do fees work?"
- "What is block height?"
- "How do I cancel a booking?"
- "Why are fees so low?"
- "How does escrow work?"

**Property Search:**
- "Find me a 2-bedroom in Stockholm"
- "Show me villas with pools"
- "Properties under 100 STX per night"
- "Beachfront apartments"

**Mixed:**
- "What is StackNStay and show me properties"
- "Explain fees and find me a cheap apartment"
- "How does booking work? Also show me villas"

---

## 🐛 Troubleshooting

**"Vector store not initialized"**
→ Run `POST /api/index` and `POST /api/index/knowledge`

**"Cohere API error"**
→ Check API key in `.env`

**"No properties found"**
→ Verify contract address and run indexing

**"Knowledge base not loaded"**
→ Run `POST /api/index/knowledge`

**"Import errors"**
→ Run `pip install -r requirements.txt`

---

## 📝 License

MIT
