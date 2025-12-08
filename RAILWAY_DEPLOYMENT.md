# Railway FastAPI Deployment Guide

Complete step-by-step guide to deploy StackNStay backend to Railway.

## Prerequisites

- GitHub account (for repo access)
- Railway account (free at [railway.app](https://railway.app))
- Your StackNStay repository pushed to GitHub

## Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Start Free"** or **"Sign Up"**
3. **Sign in with GitHub** (recommended)
4. Authorize Railway to access your GitHub repos
5. You'll land on the Railway dashboard

## Step 2: Create New Project

1. Click **"+ New Project"** (top right)
2. Select **"Deploy from GitHub repo"**
3. Search for your StackNStay repository
4. Click to select it
5. Railway will auto-detect the `Dockerfile` and start building

## Step 3: Configure Environment Variables

Once the project is created, you'll see the **Backend service** building. While it builds:

1. Click on the **Backend service** card
2. Go to the **"Variables"** tab (left sidebar)
3. Add the following environment variables:

```
GROQ_API_KEY=<your-groq-api-key>
COHERE_API_KEY=<your-cohere-api-key>
STACKS_API_URL=https://testnet-api.stacks.co
STACKS_NETWORK=testnet
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://<your-frontend-domain>
API_KEY_ADMIN=<generate-secure-random-key>
LOG_LEVEL=info
ENVIRONMENT=production
DEBUG=False
```

**Where to get these values:**

- **GROQ_API_KEY**: Get from [console.groq.com](https://console.groq.com)
- **COHERE_API_KEY**: Get from [cohere.com/dashboard](https://cohere.com/dashboard)
- **STACKS_API_URL**: Use `https://testnet-api.stacks.co` for development
- **ALLOWED_ORIGINS**: Your frontend domain (we'll update later)
- **API_KEY_ADMIN**: Generate a strong random string: `openssl rand -hex 32`

### Add PostgreSQL Database

1. In the **Variables** tab, click **"New Database"** (bottom section)
2. Select **"PostgreSQL"**
3. Railway will auto-create a postgres service and set `DATABASE_URL` env var
4. The database is now running and connected

**Your DATABASE_URL will be automatically set and look like:**
```
postgresql://user:password@host:port/railway
```

## Step 4: Monitor the Build & Deployment

1. Go to the **"Deployments"** tab
2. You'll see real-time build logs
3. Wait for status to show **"✓ Success"** (usually 2-5 minutes)

**Check the build logs if there are errors:**
- Common issue: Missing env vars → add them in Variables tab
- Build fails: Check Dockerfile compatibility

Once deployment succeeds:
- Railway assigns a public URL: `https://<service-name>.railway.app`
- Your API is live!

## Step 5: Verify Deployment

Open a terminal and test the API:

```bash
# Replace with your Railway URL
curl https://<your-service>.railway.app/health

# Should return:
# {"status":"healthy","vector_store_loaded":true,"properties_indexed":0}
```

Or visit in browser:
```
https://<your-service>.railway.app/docs
```

You'll see the Swagger UI with all available endpoints.

## Step 6: Configure Custom Domain (Optional)

1. Go to the service **"Settings"** tab
2. Scroll to **"Domains"**
3. Click **"Add Domain"**
4. Enter your domain (e.g., `api.stacknstay.com`)
5. Add a CNAME record to your DNS:
   ```
   CNAME: api.stacknstay.com → <railway-generated-domain>
   ```
6. Wait for DNS propagation (~5-15 minutes)
7. Test: `curl https://api.stacknstay.com/health`

## Step 7: Connect Frontend

Update your frontend to use the Railway API URL:

**In `frontend/.env` or environment config:**
```
VITE_API_URL=https://<your-railway-domain>
```

**In your React fetch calls:**
```javascript
const API_URL = process.env.VITE_API_URL || 'http://localhost:8000'
fetch(`${API_URL}/api/chat`, { ... })
```

## Step 8: Set Up Auto-Deploys from GitHub

Railway auto-deploys when you push to your repo's default branch:

1. Every `git push` to `main` or `dev` triggers a new build
2. Old deployment stays active while new one builds
3. Once new build succeeds, traffic switches over automatically
4. Rollback available in Deployments tab if needed

**Disable auto-deploy (if needed):**
1. Go to **Settings**
2. Scroll to **"Automatic Deployments"**
3. Toggle off

## Step 9: Monitoring & Logs

### Real-time Logs
1. Click on service
2. Go to **"Logs"** tab
3. See live API requests and errors

### Health Checks
Railway automatically monitors the `/health` endpoint:
- If it fails 3 times, service restarts automatically
- Check **Settings** → **Health Check** to configure interval

### Metrics
1. Go to **"Metrics"** tab
2. View:
   - CPU usage
   - Memory usage
   - Request count
   - Error rate
   - Response time

## Troubleshooting

### Build Fails: `ModuleNotFoundError`
```
Error: No module named 'app'
```
**Fix:** Ensure `backend/app/__init__.py` exists
```bash
touch backend/app/__init__.py
git add -A && git commit -m "Add __init__.py"
git push
```

### Database Connection Error
```
Error: could not connect to server: Connection refused
```
**Fix:** Wait for PostgreSQL to fully initialize (takes ~30s after adding)

### API Returns 502 Bad Gateway
**Causes:** 
- Wrong PORT env var (should be `8000`)
- Gunicorn crashes (check logs)
- Missing dependencies (check requirements.txt)

**Debug:**
1. Go to **Logs** tab
2. Look for error messages
3. Fix and push to GitHub (auto-redeploy)

### Port Already in Use
```
Address already in use
```
Railway manages ports automatically. If you see this:
1. Delete the service and recreate
2. Or restart via **Settings** → **Restart Service**

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `PORT` | Auto | `8000` | Set by Railway |
| `DATABASE_URL` | Auto | `postgresql://...` | Auto-created with DB |
| `GROQ_API_KEY` | Yes | `gsk_xxxx` | Get from Groq |
| `COHERE_API_KEY` | Yes | `key-xxxx` | Get from Cohere |
| `STACKS_API_URL` | Yes | `https://testnet-api.stacks.co` | Testnet URL |
| `ALLOWED_ORIGINS` | Yes | `https://frontend.com` | CORS origins |
| `ENVIRONMENT` | Yes | `production` | or `development` |
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warning` |

## Cost Breakdown

Railway pricing (as of Dec 2024):

| Resource | Usage | Cost |
|----------|-------|------|
| Compute (vCPU) | $0.000463/hour | ~$3.40/month (typical) |
| Memory (GB) | $0.000116/hour | ~$0.85/month (typical) |
| PostgreSQL (GB) | $0.08/GB/month | ~$1.60/month (20GB) |
| **Total** | Small app | **~$6–12/month** |

- New accounts get **$5 free credits/month**
- No charges for inactive projects
- Scale up as needed (simple slider)

## Advanced: Scaling

### Increase CPU/Memory

1. Go to **Settings**
2. Scroll to **"Compute"**
3. Adjust vCPU slider (0.5, 1, 2, etc.)
4. Memory adjusts automatically
5. Service restarts with new resources

### Increase Gunicorn Workers

In `backend/Dockerfile`, change the CMD:
```dockerfile
# More workers = handle more concurrent requests
# Rule: workers = (2 × CPU cores) + 1
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "8", ...]
```

Push to GitHub and Railway auto-redeploys.

## Summary

✅ **You now have:**
- FastAPI backend running on Railway
- PostgreSQL managed database
- Auto-deploys from GitHub
- HTTPS/SSL included
- Health checks & monitoring
- Easy scaling
- Cost: ~$6–12/month

✅ **Next steps:**
1. Add env vars in Railway dashboard
2. Wait for build to complete (2-5 min)
3. Test `/health` endpoint
4. Connect frontend to Railway API URL
5. Monitor logs & metrics

**Questions?** Check Railway docs at [docs.railway.app](https://docs.railway.app) or ask in your logs!
