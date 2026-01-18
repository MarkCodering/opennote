# Deploying Open Notebook to Vercel

⚠️ **IMPORTANT**: Vercel only supports the Next.js frontend. The Python/FastAPI backend must be deployed separately.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│   Frontend (Vercel)                     │
│   - Next.js app                         │
│   - Serves UI at https://your-app.com   │
└────────────────┬────────────────────────┘
                 │ HTTP API calls
┌────────────────▼────────────────────────┐
│   API Backend (Separate Platform)       │
│   - FastAPI + SurrealDB                 │
│   - Deployed to Railway/Fly.io/etc.     │
│   - Available at https://api.your.com   │
└─────────────────────────────────────────┘
```

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **API Hosting**: Choose one of:
   - [Railway](https://railway.app) (recommended for full-stack)
   - [Fly.io](https://fly.io) (great for Docker)
   - [Render](https://render.com)
   - Self-hosted VPS/server

## Step 1: Deploy the API Backend First

Before deploying to Vercel, you **must** deploy the FastAPI backend + SurrealDB. See the main documentation for options:

### Option A: Railway (Recommended)
```bash
# Deploy entire stack to Railway
railway up
```

### Option B: Fly.io
```bash
# Deploy using Docker
fly deploy
```

### Option C: Self-Hosted
```bash
# Use Docker Compose on your server
docker compose --profile multi up -d
```

**After deployment, note your API URL** (e.g., `https://api-your-app.railway.app`)

## Step 2: Configure Environment Variables

### In Vercel Dashboard:

1. Go to your project settings → Environment Variables
2. Add the following variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `INTERNAL_API_URL` | `https://your-api-domain.com` | Server-side API URL (no /api suffix) |
| `NEXT_PUBLIC_API_URL` | `https://your-api-domain.com` | Client-side API URL (optional, for override) |

**Example**:
```env
INTERNAL_API_URL=https://open-notebook-api.railway.app
NEXT_PUBLIC_API_URL=https://open-notebook-api.railway.app
```

⚠️ **Do NOT include `/api` at the end** - Next.js adds it automatically via rewrites.

## Step 3: Deploy to Vercel

### Method 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Method 2: Using Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to https://vercel.com/new
3. Import your repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: Leave as `./` (vercel.json handles the frontend path)
   - **Build Command**: Auto-detected from vercel.json
   - **Output Directory**: Auto-detected
5. Add environment variables (see Step 2)
6. Click "Deploy"

## Step 4: Verify Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Check browser console for API connection
3. Try creating a notebook to test API connectivity
4. Check network tab to verify API calls go to your backend

## Troubleshooting

### Issue: "Failed to fetch" or CORS errors

**Solution**: Ensure your API backend has CORS configured for your Vercel domain.

In `api/main.py`, add your Vercel domain:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",  # Add this
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: API calls timeout

**Solution**: Increase timeout in your API client configuration or use a faster AI provider.

### Issue: 502 Bad Gateway

**Solution**: Verify your `INTERNAL_API_URL` is correct and the API is running.

### Issue: Environment variables not working

**Solution**: 
- Redeploy after adding variables
- Ensure no trailing slashes in URLs
- Don't include `/api` in the URL

## Custom Domain

1. Go to Vercel project → Settings → Domains
2. Add your domain (e.g., `notebook.example.com`)
3. Update DNS records as instructed
4. Update CORS in your API backend to include the new domain

## Monitoring

- **Vercel Dashboard**: View deployment logs and analytics
- **API Logs**: Check your API hosting platform's logs
- **SurrealDB**: Monitor database health on your hosting platform

## Cost Considerations

### Vercel (Frontend)
- **Free Tier**: 100GB bandwidth/month, unlimited projects
- **Pro Tier**: $20/month per seat, 1TB bandwidth

### API Backend (Example: Railway)
- **Free Tier**: $5 credit/month
- **Paid**: ~$5-20/month depending on usage

### Total Estimated Cost
- **Hobby/Personal**: $0-10/month (if within free tiers)
- **Professional**: $20-50/month

## Limitations

1. **No WebSocket support on Vercel**: Real-time features limited
2. **Serverless functions timeout**: 10s (Hobby), 60s (Pro), 300s (Enterprise)
3. **No background jobs**: Podcast generation must run on API backend
4. **Cold starts**: First request may be slow after inactivity

## Alternative: Deploy Entire Stack Together

If you prefer a simpler deployment with frontend + backend + database together:

- **Railway**: Single `railway up` command
- **Fly.io**: Docker-based deployment
- **DigitalOcean App Platform**: Git-based deployment

See the main documentation for these options.

## Support

- **Documentation**: https://open-notebook.ai
- **Discord**: https://discord.gg/37XJPXfz2w
- **Issues**: https://github.com/lfnovo/open-notebook/issues

---

**Last Updated**: January 2026
