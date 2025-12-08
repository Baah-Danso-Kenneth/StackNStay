# Railway Deployment Quick Start Checklist

## ✅ Pre-Deployment (Do These First)

- [ ] Create Railway account at [railway.app](https://railway.app)
- [ ] GitHub account connected to Railway
- [ ] StackNStay repo pushed to GitHub (`dev` or `main` branch)
- [ ] Have your API keys ready:
  - [ ] GROQ_API_KEY (from [console.groq.com](https://console.groq.com))
  - [ ] COHERE_API_KEY (from [dashboard.cohere.com](https://dashboard.cohere.com))
- [ ] Generate API_KEY_ADMIN: `openssl rand -hex 32` (copy the output)

## 🚀 Deploy on Railway (5 Minutes)

### Step 1: Create Project (1 min)
```
1. Go to railway.app dashboard
2. Click "+ New Project"
3. Select "Deploy from GitHub repo"
4. Search & select your StackNStay repository
5. Wait for build to start (green progress bar)
```

### Step 2: Add Environment Variables (2 min)
```
1. Click on "Backend" service card
2. Go to "Variables" tab (left sidebar)
3. Add these variables (copy from RAILWAY_ENV_VARS.txt):
   - GROQ_API_KEY = <your-groq-key>
   - COHERE_API_KEY = <your-cohere-key>
   - STACKS_API_URL = https://testnet-api.stacks.co
   - STACKS_NETWORK = testnet
   - ALLOWED_ORIGINS = https://yourdomain.com (and http://localhost:3000 for dev)
   - API_KEY_ADMIN = <your-generated-key>
   - ENVIRONMENT = production
   - DEBUG = False
   - LOG_LEVEL = info
```

### Step 3: Add PostgreSQL Database (1 min)
```
1. Stay in Variables tab
2. Scroll down to "Database" section
3. Click "+ New Database" or "New"
4. Select "PostgreSQL"
5. Railway creates DATABASE_URL automatically
6. Done! Database is running
```

### Step 4: Wait for Build & Deploy (1 min)
```
1. Go to "Deployments" tab
2. Watch the build progress
3. Status changes to "✓ Success" when done (usually 2-5 minutes)
4. Your API URL appears in service card
```

## ✅ Post-Deployment (Verify It Works)

### Step 1: Test Health Endpoint
```bash
# Replace with your actual Railway URL
curl https://<your-service>.railway.app/health

# Should return:
# {"status":"healthy","vector_store_loaded":true,"properties_indexed":0}
```

### Step 2: View Swagger Docs
```
Open in browser: https://<your-service>.railway.app/docs
You should see FastAPI Swagger UI with all endpoints
```

### Step 3: Check Logs
```
1. Click on Backend service
2. Go to "Logs" tab
3. Scroll to see recent requests and any errors
4. Should show: "Application startup complete"
```

### Step 4: View Metrics
```
1. Go to "Metrics" tab
2. Check CPU, memory, request count
3. Should show normal usage (low CPU, stable memory)
```

## 🎯 Connect Frontend to Backend

Update your frontend to use Railway API:

**Option A: Environment Variable**
```bash
# .env or .env.production
VITE_API_URL=https://<your-railway-domain>.railway.app
```

**Option B: In your React code**
```javascript
const API_URL = process.env.VITE_API_URL || 'https://<your-railway-domain>.railway.app'
const response = await fetch(`${API_URL}/api/chat`, { ... })
```

## 📊 Your Railway Service Info

After deployment, you'll have:

| Item | Where to Find |
|------|---------------|
| **API URL** | Service card or Deployments tab |
| **Database URL** | Variables tab (DATABASE_URL) |
| **Build Logs** | Deployments tab → click build |
| **Runtime Logs** | Logs tab |
| **Metrics** | Metrics tab |
| **Settings** | Settings tab |

## 🔧 Auto-Deploys

Railway automatically redeploys when you push code:

```bash
# Make changes locally
git add .
git commit -m "Update FastAPI"
git push

# Railway automatically:
# 1. Detects new commit
# 2. Builds Docker image
# 3. Deploys new version
# 4. Switches traffic (zero downtime)
# 5. Keeps old version (easy rollback)
```

## 🆘 Troubleshooting

### Build Fails: "ModuleNotFoundError: No module named 'app'"
```bash
# Fix: Add __init__.py to backend/app
touch backend/app/__init__.py
git add -A && git commit -m "Add __init__.py"
git push
```

### API Returns 502 Bad Gateway
**Check:**
1. Go to Logs tab
2. Look for error messages
3. Common issues:
   - Missing env var → add to Variables tab
   - Database not ready → wait 30s and refresh
   - Gunicorn crash → check requirements.txt has all packages

### Can't Connect to Database
```bash
# Verify DATABASE_URL is set
1. Go to Variables tab
2. Confirm DATABASE_URL exists (Railway creates it automatically)
3. If missing, delete PostgreSQL service and re-add it
```

### Slow Build Time
- First build takes 3-5 minutes (normal)
- Subsequent builds are faster (uses cache)
- If stuck, cancel and restart in Deployments tab

## 💰 Cost & Limits

- **Compute:** ~$3.40/month (small app)
- **Memory:** ~$0.85/month (typical)
- **PostgreSQL:** ~$1.60/month (20GB storage)
- **Total:** ~$6–12/month (including $5 free credits)

## 📚 More Info

- Full guide: See `RAILWAY_DEPLOYMENT.md` in repo
- Environment vars template: See `RAILWAY_ENV_VARS.txt`
- Railway docs: [docs.railway.app](https://docs.railway.app)

---

## ⏰ Timeline

- **0–2 min:** Create project & connect GitHub
- **2–10 min:** Add env vars & database
- **10–15 min:** Build & deploy (Railway handles)
- **15+ min:** API is live and ready! 🎉

**You're done when:**
- ✅ Build shows "✓ Success"
- ✅ `/health` endpoint returns healthy
- ✅ Swagger UI loads at `/docs`
- ✅ Logs show no errors

Good luck! 🚀
