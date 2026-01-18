# Deploying Open Notebook to Railway

Railway is the recommended platform for deploying the full Open Notebook stack (Frontend + API + Database) together. This guide covers deployment using Railway's single-container setup.

## Overview

Railway will deploy:
- ✅ Next.js frontend (port 8502)
- ✅ FastAPI backend (port 5055)
- ✅ SurrealDB database (embedded)
- ✅ All in one container with automatic HTTPS

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **GitHub/GitLab Account**: Railway deploys from Git repositories
3. **AI Provider API Key**: At least one (OpenAI, Anthropic, Google, etc.) or use Ollama locally

## Method 1: Deploy from GitHub (Recommended)

### Step 1: Push to GitHub

If your code isn't already on GitHub:

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/open-notebook.git
git push -u origin main
```

### Step 2: Connect to Railway

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your repositories
5. Select your Open Notebook repository
6. Railway will auto-detect the Dockerfile and start building

### Step 3: Configure Environment Variables

After deployment starts, add environment variables:

1. Click on your deployed service
2. Go to **"Variables"** tab
3. Click **"Add Variable"** and add these:

#### Required Variables:

```env
# SurrealDB Configuration (embedded mode)
SURREAL_URL=ws://localhost:8000/rpc
SURREAL_USER=root
SURREAL_PASSWORD=your-secure-password-here
SURREAL_NAMESPACE=open_notebook
SURREAL_DATABASE=open_notebook

# At least one AI provider (choose one or more):
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
# or
GOOGLE_API_KEY=...
```

#### Optional but Recommended:

```env
# Security (highly recommended for public deployment)
OPEN_NOTEBOOK_PASSWORD=your-app-password

# API URL (Railway auto-detects, but you can override)
API_URL=https://your-app.railway.app

# For longer operations (local models, large documents)
API_CLIENT_TIMEOUT=600
ESPERANTO_LLM_TIMEOUT=300
```

### Step 4: Configure Port

Railway needs to know which port to expose:

1. In your service settings, go to **"Settings"** tab
2. Under **"Networking"**, ensure port **8502** is exposed
3. Railway will automatically assign a public URL

### Step 5: Deploy

1. Click **"Deploy"** or trigger a redeploy
2. Wait 5-10 minutes for build to complete
3. Railway will provide a URL like: `https://your-app.railway.app`
4. Visit the URL and start using Open Notebook!

## Method 2: Deploy with Railway CLI

### Step 1: Install Railway CLI

```bash
# Install globally
npm i -g @railway/cli

# Or with Homebrew
brew install railway
```

### Step 2: Login

```bash
railway login
```

This opens a browser for authentication.

### Step 3: Initialize Project

```bash
# From your project directory
cd /Users/mark/Documents/Dev/opennote

# Initialize Railway project
railway init
```

Follow the prompts to create a new project or link to existing.

### Step 4: Add Environment Variables

Create a `railway.env` file (don't commit this):

```env
# SurrealDB Configuration
SURREAL_URL=ws://localhost:8000/rpc
SURREAL_USER=root
SURREAL_PASSWORD=your-secure-password
SURREAL_NAMESPACE=open_notebook
SURREAL_DATABASE=open_notebook

# AI Provider
OPENAI_API_KEY=sk-...

# Security
OPEN_NOTEBOOK_PASSWORD=your-app-password
```

Then add to Railway:

```bash
railway variables set SURREAL_URL=ws://localhost:8000/rpc
railway variables set SURREAL_USER=root
railway variables set SURREAL_PASSWORD=your-secure-password
railway variables set SURREAL_NAMESPACE=open_notebook
railway variables set SURREAL_DATABASE=open_notebook
railway variables set OPENAI_API_KEY=sk-...
railway variables set OPEN_NOTEBOOK_PASSWORD=your-app-password
```

Or upload from file:

```bash
railway variables set --file railway.env
```

### Step 5: Deploy

```bash
railway up
```

Railway will:
1. Build your Docker image
2. Deploy the container
3. Assign a public URL
4. Start all services (Frontend, API, Database)

### Step 6: Check Logs

```bash
# View deployment logs
railway logs

# Follow logs in real-time
railway logs --follow
```

## Method 3: One-Click Template (Coming Soon)

Railway allows template deployments. Check the Open Notebook repository for a "Deploy to Railway" button.

## Post-Deployment Configuration

### Custom Domain

1. In Railway dashboard, go to your service
2. Click **"Settings"** → **"Domains"**
3. Click **"Add Custom Domain"**
4. Enter your domain (e.g., `notebook.yourdomain.com`)
5. Update your DNS with the provided CNAME record
6. Railway automatically provisions SSL certificate

### Environment Updates

To update environment variables after deployment:

```bash
# Via CLI
railway variables set OPENAI_API_KEY=sk-new-key

# Or via dashboard: Variables tab → Edit
```

After changing variables, redeploy:

```bash
railway up --detach
```

### Volume/Storage (Optional)

Railway provides ephemeral storage by default. For persistent data:

1. Go to your service → **"Settings"** → **"Volumes"**
2. Click **"Add Volume"**
3. Mount path: `/app/data` (for notebooks, uploads)
4. Mount path: `/app/surreal_data` (for database)

> **Note**: Single-container deployment uses embedded SurrealDB, so data persists in `/app/data` by default.

## Monitoring & Maintenance

### View Logs

```bash
# CLI
railway logs --follow

# Dashboard
Service → "Deployments" → Click deployment → "View Logs"
```

### Resource Usage

Check **"Metrics"** tab in Railway dashboard:
- CPU usage
- Memory usage
- Network traffic

### Restart Service

```bash
# CLI
railway restart

# Dashboard
Service → "Settings" → "Restart Service"
```

### Scale Resources

Railway auto-scales, but you can adjust:

1. Go to **"Settings"** → **"Resources"**
2. Adjust memory/CPU limits if needed (on paid plans)

## Troubleshooting

### Build Fails

**Check logs**:
```bash
railway logs
```

Common issues:
- Missing dependencies: Ensure `pyproject.toml` and `package.json` are correct
- Build timeout: Railway free tier has 30-min build limit
- Memory issues: Upgrade plan or optimize build

### "Application Failed to Respond"

**Solution**: Check that port 8502 is exposed:
1. Service → "Settings" → "Networking"
2. Ensure port 8502 is configured

### Database Connection Errors

**Check environment variables**:
```bash
railway variables
```

Ensure:
- `SURREAL_URL=ws://localhost:8000/rpc` (for embedded DB)
- All other `SURREAL_*` variables are set

### API Timeout Errors

**Increase timeouts** in environment variables:
```bash
railway variables set API_CLIENT_TIMEOUT=600
railway variables set ESPERANTO_LLM_TIMEOUT=300
```

### Out of Memory

**Single container uses ~1-2GB RAM**. If exceeded:
1. Upgrade Railway plan for more memory
2. Or deploy with multi-container setup (separate DB)

## Cost Estimates

### Railway Pricing (as of 2026)

- **Hobby Plan**: $5/month credit (good for small usage)
- **Pro Plan**: $20/month + usage ($0.000463/GB-hour RAM, $0.000231/vCPU-hour)
- **Free Trial**: $5 credit for new accounts

### Estimated Monthly Cost:
- **Light usage** (few hours/day): ~$5-10/month
- **Regular usage** (always-on): ~$10-20/month
- **Heavy usage** (high traffic): ~$20-50/month

## Security Best Practices

### 1. Set a Password
Always set `OPEN_NOTEBOOK_PASSWORD` for public deployments:
```bash
railway variables set OPEN_NOTEBOOK_PASSWORD=strong-password-here
```

### 2. Secure Database Credentials
Change default `SURREAL_PASSWORD`:
```bash
railway variables set SURREAL_PASSWORD=$(openssl rand -base64 32)
```

### 3. Use HTTPS
Railway provides automatic HTTPS—always access via `https://`

### 4. Rotate API Keys
Regularly rotate your AI provider API keys

### 5. Monitor Logs
Check for unusual activity:
```bash
railway logs --follow
```

## Backup & Recovery

### Export Data

1. Access your Railway shell:
```bash
railway shell
```

2. Export database:
```bash
# Inside container
cd /app/data
tar -czf backup.tar.gz sqlite-db/ surreal_data/
```

3. Download via Railway dashboard or copy to external storage

### Restore Data

1. Upload backup to new deployment
2. Extract to `/app/data`
3. Restart service

## Scaling Options

### Vertical Scaling (Single Container)
Upgrade Railway plan for more CPU/RAM

### Horizontal Scaling (Multi-Container)
For high traffic, consider:
1. Separate API service from frontend
2. Dedicated SurrealDB instance
3. Use Railway's multi-service setup

See `docker-compose.full.yml` for architecture.

## Alternative Deployment Options

If Railway doesn't meet your needs:

- **Fly.io**: Docker-based, global edge network
- **Render**: Similar to Railway, free tier available
- **DigitalOcean App Platform**: Managed containers
- **Self-hosted VPS**: Full control, requires setup

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Open Notebook Discord**: https://discord.gg/37XJPXfz2w
- **GitHub Issues**: https://github.com/lfnovo/open-notebook/issues
- **Railway Community**: https://discord.gg/railway

## Quick Reference Commands

```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set environment variables
railway variables set KEY=value

# Deploy
railway up

# View logs
railway logs --follow

# Restart service
railway restart

# Open in browser
railway open
```

---

**Last Updated**: January 2026

**Ready to deploy?** Start with Method 1 (GitHub) for the easiest experience! 🚀
