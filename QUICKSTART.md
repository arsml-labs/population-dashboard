# Quick Start Guide

Get the dashboard running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- Cloudflare account (free tier works!)
- GitHub account (already set up ✓)

## 5-Minute Setup

### Step 1: Install Wrangler (2 minutes)
```bash
npm install -g @cloudflare/wrangler
wrangler login
```

### Step 2: Deploy to Cloudflare (2 minutes)
```bash
cd /root/web-scraping
wrangler deploy
```

### Step 3: Set Environment Variables (1 minute)
In Cloudflare Dashboard:
1. **Workers & Pages** → **Settings** → **Environment variables**
2. Add: `FIRECRAWL_API_KEY` = `fc-5cd6568e771341069972df076d55e693`

### Step 4: Access Dashboard
Visit: `https://population-dashboard-worker.workers.dev/`

✅ Done! Your dashboard is live!

## Auto-Deploy from GitHub

Now any push to GitHub automatically deploys:

```bash
# Make changes
git add .
git commit -m "Update dashboard"
git push origin master
# Cloudflare auto-deploys in ~1 minute!
```

## Using the Dashboard

1. **Refresh Data**: Click "🔄 Refresh Data" to fetch latest population stats
2. **View Charts**: Hover over charts to see detailed information
3. **Check Table**: Scroll to view latest population records

## What Each Chart Shows

- **Ethnicity Chart**: Population breakdown by ethnic group (2026)
- **Age Chart**: Population by age group (2026)
- **Trend Chart**: Historical population growth 1970-2026
- **Gender Chart**: Male vs female population distribution

## Common Tasks

### Add Custom Domain
1. Cloudflare Dashboard → **Workers** → **Settings**
2. Add custom domain (e.g., `population.mydomain.com`)
3. Update DNS at your registrar

### View Logs
```bash
wrangler tail  # Shows real-time logs
```

### Update Dashboard Code
Edit `public/index.html` and push to GitHub

### Update Worker Logic
Edit `src/worker.js` and run `wrangler deploy`

## Troubleshooting

**Dashboard shows error?**
- Check browser console (F12)
- Verify `FIRECRAWL_API_KEY` is set
- Try refreshing the page

**Refresh button not working?**
- Click browser refresh (F5)
- Check internet connection
- Verify Worker deployed: `wrangler deployments list`

**Want to view logs?**
```bash
wrangler tail
```

## Next Steps

- ✅ Dashboard deployed
- ✅ GitHub integration done
- 📊 Explore the data visualizations
- 🔄 Test the refresh functionality
- 📱 Check on mobile device
- 💾 Share your dashboard URL

## Support

- **Docs**: See README.md for detailed documentation
- **Deployment**: See DEPLOYMENT.md for advanced setup
- **Issues**: Check GitHub Issues

---

**Everything is set up! Start exploring your data! 🎉**
