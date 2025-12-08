# FastAPI Backend Deployment Guide

## Overview
Your StackNStay backend is already built with **FastAPI**. This guide shows how to deploy it without AWS.

---

## Local Development

### Option A: Run Directly with Uvicorn
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API available at `http://localhost:8000`  
Docs at `http://localhost:8000/docs`

### Option B: Run with Docker Compose (Recommended for Dev)
```bash
# Copy and set up .env.dev
cp .env.dev.example .env.dev
# Edit .env.dev with your API keys and settings

# Start containers
docker-compose up --build

# First run: Initialize database
docker-compose exec web alembic upgrade head  # if using Alembic for migrations

# View logs
docker-compose logs -f web
```
API available at `http://localhost:8000`  
PostgreSQL at `localhost:5432`

---

## Production Deployment (Choose One)

### **Option 1: Railway (Easiest – Recommended)**

**Pros:** 
- One-click deploy from GitHub
- Free tier ($5/month), pay-as-you-go
- Built-in PostgreSQL, env vars, SSL
- Minimal setup

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project → "Deploy from GitHub repo"
4. Select this repo
5. Configure environment:
   - Set `PORT=8000`
   - Add all `.env` variables (GROQ_API_KEY, DATABASE_URL, etc.)
   - Set `PYTHON_VERSION=3.11`
6. Railway auto-detects `Dockerfile` and deploys
7. Your API runs at `https://<your-project>.railway.app`

**Cost:** ~$5–20/month depending on usage

---

### **Option 2: Fly.io (Solid Free Tier)**

**Pros:**
- Free tier with generous limits
- Global edge deployment
- Simple CLI and near-instant deploys

**Steps:**
1. Install [Fly CLI](https://fly.io/docs/getting-started/installing-flyctl/)
2. Sign up: `flyctl auth signup`
3. Create app: 
   ```bash
   flyctl launch --dockerfile backend/Dockerfile
   ```
   - Name your app
   - Choose region (closest to you)
   - Skip database for now (or use Fly Postgres add-on)
4. Set secrets:
   ```bash
   flyctl secrets set GROQ_API_KEY=xxx COHERE_API_KEY=xxx ...
   ```
5. Deploy:
   ```bash
   flyctl deploy
   ```
6. Your API runs at `https://<app-name>.fly.dev`

**Cost:** Free tier + ~$5/month per GB of RAM

---

### **Option 3: Render (Good Free Tier)**

**Pros:**
- Beginner-friendly dashboard
- Free tier includes 750 compute hours/month
- Built-in PostgreSQL

**Steps:**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Create new "Web Service" → connect your GitHub repo
4. Configure:
   - Publish directory: `backend/`
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:8000 app.main:app`
   - Environment: Python 3.11
5. Add environment variables (click "Advanced"):
   - DATABASE_URL, GROQ_API_KEY, etc.
6. Deploy and monitor from dashboard
7. Your API runs at `https://<service-name>.onrender.com`

**Cost:** Free tier (limited) or ~$7/month for always-on

---

### **Option 4: DigitalOcean App Platform**

**Pros:**
- Full managed container platform
- PostgreSQL managed database included
- Predictable pricing

**Steps:**
1. Go to [digitalocean.com](https://digitalocean.com)
2. Create account (get $200 credit if new)
3. Create App:
   - Connect GitHub repo
   - Auto-detect `Dockerfile`
   - Configure HTTP port: 8000
4. Add environment variables
5. Attach managed PostgreSQL
6. Deploy
7. Your API runs at `https://<app>.ondigitalocean.app`

**Cost:** ~$6/month (basic app) + $15/month (managed DB)

---

## Comparison Table

| Provider | Free Tier | Setup Time | Best For | Cost |
|----------|-----------|-----------|----------|------|
| **Railway** | $5/month | 5 min | Beginners, rapid deploys | $5–20/mo |
| **Fly.io** | 750 hrs/mo | 10 min | Global edge, low latency | Free–$10/mo |
| **Render** | Limited | 10 min | Simple projects | Free–$7/mo |
| **DigitalOcean** | $200 credit | 15 min | Stable, predictable | $21+/mo |

---

## Post-Deployment Checklist

### 1. Health Check
```bash
curl https://<your-api>.com/health
# Expected response: { "status": "healthy", ... }
```

### 2. Test Endpoints
```bash
curl https://<your-api>.com/
curl https://<your-api>.com/docs  # Swagger docs
```

### 3. Set Up Logging & Monitoring
- **Railway:** Built-in logs in dashboard
- **Fly.io:** `flyctl logs`
- **Render:** View in dashboard
- **DigitalOcean:** CloudWatch or Datadog integration

### 4. Configure Database
- If using managed DB, ensure migrations run:
  ```bash
  # For Railway/Render/DO
  <deployed-app> run "alembic upgrade head"
  ```

### 5. Environment Variables
Ensure these are set in your deployment:
```
GROQ_API_KEY=your_key
COHERE_API_KEY=your_key
STACKS_API_URL=https://testnet-api.stacks.co
DATABASE_URL=postgresql://user:pass@host/dbname
ALLOWED_ORIGINS=https://your-frontend.com
```

### 6. Enable HTTPS & Custom Domain
- All providers support custom domains (add CNAME record)
- SSL auto-provisioned by all platforms

---

## Running Tests Locally

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

---

## Docker Build & Test Locally

```bash
# Build image
docker build -f backend/Dockerfile -t stacknstay-backend:latest .

# Run container
docker run -p 8000:8000 \
  -e GROQ_API_KEY=xxx \
  -e DATABASE_URL=postgresql://localhost/stacknstay \
  stacknstay-backend:latest

# Verify
curl http://localhost:8000/health
```

---

## Scaling & Performance Tips

1. **Increase Gunicorn workers** (in Dockerfile):
   ```dockerfile
   CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "8", ...]
   ```
   (adjust `-w` based on CPU cores)

2. **Add caching** (Redis):
   ```bash
   # Add redis service to docker-compose or use Redis add-on in Railway/Fly
   REDIS_URL=redis://redis:6379/0
   ```

3. **Enable request logging** (in FastAPI):
   ```python
   from fastapi.middleware.trustedhost import TrustedHostMiddleware
   app.add_middleware(TrustedHostMiddleware, allowed_hosts=["yourdomain.com"])
   ```

4. **Monitor errors** (Sentry):
   ```python
   import sentry_sdk
   sentry_sdk.init(dsn=os.getenv("SENTRY_DSN"))
   ```

---

## Troubleshooting

### Port Already in Use
```bash
lsof -i :8000  # find process
kill -9 <PID>
```

### Database Connection Error
- Check `DATABASE_URL` format: `postgresql://user:pass@host:5432/dbname`
- Verify PostgreSQL is running (locally or remote)
- Test connection: `psql postgresql://user:pass@host/dbname`

### Import Errors in Container
- Ensure `app/` directory has `__init__.py` files
- Rebuild: `docker-compose build --no-cache`

### API Returns 502 Bad Gateway
- Check logs: `docker-compose logs web`
- Ensure app starts correctly locally first

---

## Summary

**Start here (local):**
```bash
cp .env.dev.example .env.dev
docker-compose up --build
# API at http://localhost:8000/docs
```

**Deploy (pick one):**
- **Railway** (easiest): Connect GitHub repo, set env vars, done
- **Fly.io** (free-friendly): `flyctl launch` → `flyctl deploy`
- **Render** (beginner-friendly): Dashboard web service + PostgreSQL
- **DigitalOcean** (stable): App Platform with managed database

All provide automatic SSL, domain support, and easy scaling. Start with **Railway** or **Fly.io** for simplicity.
