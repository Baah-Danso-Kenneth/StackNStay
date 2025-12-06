# 🏨 StackNStay - Decentralized Vacation Rentals
> **The Future of Travel on the Stacks Blockchain**

StackNStay is a decentralized application (dApp) that enables users to book and list vacation rentals directly on the Stacks blockchain. By leveraging smart contracts and the Bitcoin network (via Stacks), we eliminate intermediaries, reduce fees, and ensure transparent, trustless transactions.

![StackNStay Banner](https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2070)

## ✨ Key Features

### 🌍 Decentralized Booking
- **Direct Peer-to-Peer**: Book directly with hosts using STX tokens.
- **Smart Contract Escrow**: Funds are held safely in a smart contract until the stay is completed.
- **No Middlemen**: Significantly lower fees compared to traditional platforms like Airbnb.

### 💎 Reputation & Identity
- **On-Chain Reputation**: Reviews and ratings are stored permanently on the blockchain.
- **NFT Badges**: Earn "Superhost" and "Verified Traveler" badges as NFTs.
- **Decentralized Identity**: Login with your Stacks wallet (Leather, Xverse).

### 🤖 AI-Powered Assistant
- **Smart Property Search**: "Find me a 2-bedroom villa in Ghana under 100 STX".
- **Knowledge Base**: Ask questions about fees, policies, and blockchain technology.
- **Personalized Recommendations**: AI suggests properties based on your preferences.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Python, LangGraph (AI Agent)
- **Blockchain**: Clarity Smart Contracts (Stacks/Bitcoin)
- **AI/ML**: Groq (LLM), Cohere (Embeddings), FAISS (Vector Store)
- **Storage**: IPFS (Pinata) for decentralized image and metadata storage

---

## 🚀 Quick Start

### Prerequisites
- Node.js & npm
- Python 3.11+
- Stacks Wallet (Leather or Xverse)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/stacknstay.git
cd stacknstay
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Configure Environment
cp .env.example .env
# Add your API keys (Groq, Cohere, Pinata) and Stacks Contract Address
```

### 4. Run the Backend
```bash
uvicorn app.main:app --reload
```

---

## 🤖 AI Chatbot & RAG Engine

The backend powers an advanced **RAG (Retrieval-Augmented Generation)** chatbot that helps users navigate the platform.

### Features
- **Smart Routing**: Automatically detects if a user is searching for properties or asking for help.
- **Dual Vector Store**: 
    - `Property Index`: Searchable database of all listed properties.
    - `Knowledge Index`: FAQ, guides, and platform documentation.
- **Real-Time Indexing**: Fetches property data directly from the blockchain and IPFS.

### API Endpoints

#### Chat
```bash
POST /api/chat
{
  "message": "Find me a house in Ghana"
}
```

#### Re-index Data
```bash
# Force refresh from Blockchain/IPFS
POST /api/admin/reindex
```

---

## 📜 Smart Contracts

The platform runs on a suite of Clarity smart contracts:
- **stackstay-escrow**: Handles bookings, payments, and dispute resolution.
- **stackstay-reputation**: Manages user reviews and reputation scores.
- **stackstay-badge**: Issues NFT badges for achievements.

---

## 📄 License

MIT License
