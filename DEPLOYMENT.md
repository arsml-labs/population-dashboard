# Deployment Guide: Cloudflare Pages + Workers

Follow these steps to deploy the Malaysia Population Dashboard to Cloudflare with GitHub integration.

## Step 1: Cloudflare Account Setup

1. Go to https://dash.cloudflare.com
2. Sign up if you don't have an account (free tier is fine)
3. Verify your email

## Step 2: Create Cloudflare Pages Project

1. **Dashboard** → **Pages**
2. Click **Create a project**
3. Select **Connect to Git**
4. Authorize GitHub and select `population-dashboard` repo
5. Configure build settings:
   - **Framework preset**: None (custom)
   - **Build command**: `npm run build`
   - **Build output directory**: `public`
6. Click **Save and Deploy**

## Step 3: Set Environment Variables

1. **Pages** → **population-dashboard** → **Settings** → **Environment variables**
2. Add production environment variable:
   - **Variable name**: `FIRECRAWL_API_KEY`
   - **Value**: `fc-5cd6568e771341069972df076d55e693`
   - **Environment**: Production
3. Click **Save**

4. Repeat for Preview environment if desired

## Step 4: Deploy Worker

The Worker needs to be deployed separately to handle the API endpoint.

### Option A: CLI Deployment (Recommended)

```bash
# Install Wrangler CLI
npm install -g @cloudflare/wrangler

# Login to Cloudflare
wrangler login

# Deploy the worker
cd /root/web-scraping
wrangler deploy
```

### Option B: Dashboard Deployment

1. **Dashboard** → **Workers & Pages** → **Workspace**
2. Click **Create** → **Create a Service**
3. Name it `population-dashboard-worker`
4. Copy code from `src/worker.js` into the editor
5. Click **Deploy**
6. Add environment variable with FireCrawl API key

## Step 5: Connect Worker to Pages

After deploying the Worker, connect it to your Pages project:

1. **Pages** → **population-dashboard** → **Settings** → **Functions**
2. Ensure `/api/*` routes are enabled
3. The worker should automatically route `/api/scrape` requests

## Step 6: Test the Deployment

1. Visit your Pages URL: `https://population-dashboard.pages.dev`
2. Click the **Refresh Data** button
3. Verify charts and data load correctly
4. Check browser console (F12) for any errors

## Step 7: Set Up Auto-Deployment

With Pages connected to GitHub, deployments are automatic:

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Update dashboard"
   git push origin main
   ```

2. Cloudflare automatically detects the push
3. Pages rebuilds and deploys your changes
4. Workers auto-deploys when you run `wrangler deploy`

## Step 8: Configure Custom Domain (Optional)

To use a custom domain:

1. **Pages** → **population-dashboard** → **Custom domains**
2. Add your domain (e.g., `dashboard.myeazy.digital`)
3. Follow DNS setup instructions for your registrar
4. Wait 5-10 minutes for DNS to propagate

## Troubleshooting

### Dashboard not loading
- Check Pages deployment logs: **Pages** → **Deployments**
- Verify build command: `npm run build`
- Check build output directory is `public`

### API returning 404
- Verify Worker is deployed
- Check Worker routes include `/api/*`
- Ensure `FIRECRAWL_API_KEY` is set in env vars

### Refresh button not working
- Open browser console (F12)
- Check for CORS errors
- Verify Worker is responding: `curl https://your-domain/api/scrape`

### Data not updating
- Check FireCrawl API status: https://www.firecrawl.dev/
- Verify API key is correct
- Check Worker logs in Cloudflare Dashboard

## Updating the Deployment

### Update Dashboard (Frontend)

```bash
# Make changes to public/index.html
git add public/
git commit -m "Update dashboard UI"
git push origin master
# Cloudflare Pages auto-deploys
```

### Update Worker (Backend)

```bash
# Make changes to src/worker.js
wrangler deploy
# Or push to GitHub if integrated via GitHub Actions
git add src/
git commit -m "Update worker logic"
git push origin master
```

### Update Configuration

Edit `wrangler.toml` to change:
- Cache settings
- KV namespace bindings
- Scheduled event timing
- Routes

Then:
```bash
wrangler deploy
```

## Performance Optimization

### Enable Caching

The Worker already includes intelligent caching:
- CSV data cached for 1 hour
- Reduces FireCrawl API calls
- Edit cache TTL in `src/worker.js` (line ~65)

### Cloudflare Cache Rules

1. **Dashboard** → **Caching** → **Rules**
2. Create rules for:
   - Cache `/` for 1 hour
   - Cache `/api/data` for 30 minutes
   - Don't cache `/api/scrape`

### Analytics

Enable in Cloudflare Dashboard:
- **Analytics** → **Web Analytics**
- Monitor traffic patterns
- Identify popular features

## Monitoring

### Logs

View Worker logs:
```bash
wrangler tail
```

View Pages logs:
- **Pages** → **population-dashboard** → **View logs**

### Alerts

Set up alerts in Cloudflare Dashboard:
- High error rates
- Slow response times
- DDoS attacks
- Quota usage

## Scaling

Your free tier includes:
- **Requests**: 100,000/day
- **Build**: 500 builds/month
- **Worker CPU**: 50ms/request
- **KV Storage**: 1GB

For production use, upgrade to Paid Plan:
- Unlimited requests
- Unlimited builds
- Longer Worker CPU time
- 50GB KV storage

## GitHub Actions (Optional)

For automated Worker deployment:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Then add to GitHub Secrets:
- `CLOUDFLARE_API_TOKEN`: From Cloudflare dashboard
- `CLOUDFLARE_ACCOUNT_ID`: From Cloudflare dashboard

## Rollback

If deployment breaks:

### Pages Rollback
- **Pages** → **Deployments**
- Click the previous good deployment
- Click **Rollback to this version**

### Worker Rollback
```bash
# View deployment history
wrangler deployments list

# Rollback to previous
wrangler rollback --message "Rollback broken deploy"
```

## Support Resources

- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Workers Docs**: https://developers.cloudflare.com/workers/
- **Pages Docs**: https://developers.cloudflare.com/pages/
- **Wrangler CLI**: https://github.com/cloudflare/wrangler2
- **Community Forum**: https://community.cloudflare.com/

---

**Your dashboard should now be live on Cloudflare! 🚀**
