# Deploying the StackNStay backend to Railway (FastAPI)

This file explains how to deploy the `backend/` FastAPI service to Railway without Docker.

**Quick summary**
- Railway will build using `requirements.txt` and the Python runtime (see `runtime.txt`).
- The `Procfile` exposes a `web` process using `uvicorn` (Railway uses `$PORT`).
- Required secrets: `GROQ_API_KEY`, `COHERE_API_KEY` (see list below).

**Prepare locally**
- From `backend/` you can run locally:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# Or run the included test script to validate env + deps:
python test_setup.py
```

**Railway deployment (GitHub integration)**
1. Push your repo to GitHub.
2. In Railway, create a new project and select "Deploy from GitHub" and choose the repository.
3. Railway will detect Python and run `pip install -r requirements.txt`.
4. Ensure the `Root Directory` (if prompted) is the repository root; Railway will run build in the repo root where `backend/` lives. If your app resides in `backend/`, set the `Build` to run from `backend/` or configure the `Start Command` via the Railway UI to:

```
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1 --proxy-headers
```

5. Add environment variables (see the list below) in the Railway Project Settings → Variables.
6. Deploy and open the service URL. Use `/health` to confirm the service is healthy.

**Railway CLI (alternative)**
- Install & login:

```bash
curl -sSL https://railway.app/install.sh | sh
railway login
```

- From repo root, run:

```bash
cd backend
railway init    # follow prompts to link project
railway up      # builds and deploys
```

You can set variables with the CLI, for example:

```bash
railway variables set GROQ_API_KEY="<your_groq_key>" COHERE_API_KEY="<your_cohere_key>"
```

**Required / Recommended environment variables**
- GROQ_API_KEY: (required) API key used with the `langchain_groq` ChatGroq LLM.
- COHERE_API_KEY: (required) Cohere API key used for embeddings (vector store).
- LLM_MODEL: (optional) Model name for Groq LLM. Default set to `llama-3.3-70b-versatile`.
 - DATABASE_URL: (optional) Postgres connection string. If provided and `VECTOR_BACKEND=auto` or `pgvector`, the app will use Postgres + `pgvector` for embeddings.
 - VECTOR_BACKEND: (optional) `auto|pgvector|faiss|pinecone`. Default `auto`.

Optional blockchain/IPFS variables (only if you use on-chain features):
- STACKS_API_URL: (optional) Base URL for Stacks API (e.g. `https://stacks-node-api.mainnet.stacks.co`).
- STACKS_CONTRACT_ADDRESS: (optional) Contract address for StackNStay contract.
- IPFS_GATEWAY: (optional) IPFS gateway base URL (e.g. `https://ipfs.io/ipfs`).
- PINATA_JWT: (optional) Pinata JWT for fetching pinned content.
- CONTRACT_* overrides: `STACKS_CONTRACT_ESCROW`, `STACKS_CONTRACT_BADGE`, etc.

**Notes & pitfalls**
- FAISS (`faiss-cpu`) is included in `requirements.txt`. Some build environments may fail to compile native extensions if required system libs are missing. If Railway build fails on `faiss-cpu`, either:
  - Use a prebuilt wheel that matches Railway's builder, or
  - Remove `faiss-cpu` and use a different vector store backend (e.g., a cloud vector store) for the hosted environment, or
  - Build via Docker (which you're avoiding) to control native deps.

- Keep secret keys private. Use Railway Project Variables or the CLI to set them.

- If you plan to use Postgres + `pgvector`, run the SQL schema included in `backend/pgvector_schema.sql` against your database (or use migrations). This will create the `property_embeddings` table and the `ivfflat` index.

**Testing / health**
- After deploying, hit `https://<your-service>.railway.app/health` to confirm:
  - `status: healthy`
  - `property_store_loaded` and `knowledge_store_loaded` booleans

**Local quick-check before deploy**
- Create a `.env` file in `backend/` with the required keys and run `python test_setup.py` to validate the setup before pushing.

---
If you want, I can:
- Add a small `backend/.env.example` showing the variables (without real secrets).
- Try a dry-run `railway up` locally (I can show exact commands to run).
- Help switch the vector store to a cloud provider if FAISS fails on Railway.
