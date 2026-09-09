# Malaysia Population Dashboard

A real-time interactive dashboard displaying Malaysia's population data from the Department of Statistics Malaysia, powered by FireCrawl API for web scraping and deployed on Cloudflare Workers + Pages.

## Features

- 🇲🇾 **Real-time Data**: Scrapes latest population data using FireCrawl API
- 📊 **Interactive Charts**: Multiple visualizations for population trends and demographics
- 🔄 **One-Click Refresh**: Update data on-demand via refresh button
- ⚡ **Serverless Architecture**: Deployed on Cloudflare Workers (backend) + Pages (frontend)
- 🚀 **Auto-Deploy**: GitHub → Cloudflare CI/CD pipeline
- 💾 **Caching**: Intelligent caching with Cloudflare KV to reduce API calls
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Dashboard Visualizations

1. **Population by Ethnicity (2026)** - Doughnut chart showing ethnic distribution
2. **Population by Age Group (2026)** - Bar chart of age demographics
3. **Historical Population Trend** - Line chart showing growth from 1970-2026
4. **Gender Distribution (2026)** - Pie chart of male/female split
5. **Latest Data Table** - Detailed population statistics

## Architecture

```
┌─────────────────────┐
│   GitHub Repo       │
│  (Source Code)      │
└──────────┬──────────┘
           │ Push
           ▼
┌─────────────────────┐
│  Cloudflare Pages   │
│  (Frontend/Static)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│  Cloudflare Workers (API)   │ ◄─ Refresh Data
│  - FireCrawl Integration    │
│  - CSV Download             │
│  - KV Caching               │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  FireCrawl API              │
│  + CSV Storage              │
└─────────────────────────────┘
```

## Setup & Deployment

### Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier works!)
- GitHub account
- FireCrawl API key

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Add FIRECRAWL_API_KEY to .env
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```
   
   Visit: `http://localhost:8787`

### Deploy to Cloudflare

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Deploy Worker and Pages:**
   ```bash
   npm run deploy
   ```

### GitHub → Cloudflare Auto-Deploy

1. **Create repository on GitHub**
2. **Connect to Cloudflare Pages:**
   - Go to Cloudflare Dashboard
   - Navigate to Pages
   - Click "Create a project"
   - Select "Connect to Git"
   - Authorize GitHub and select this repo
   - Set build command: `npm run build`
   - Set publish directory: `public`

3. **Set Environment Variables in Cloudflare:**
   - Go to Pages → Settings → Environment variables
   - Add `FIRECRAWL_API_KEY` with your API key

4. **Done!** Any push to main branch will auto-deploy

## File Structure

```
web-scraping/
├── public/
│   └── index.html          # Dashboard UI
├── src/
│   └── worker.js           # Cloudflare Worker (API)
├── wrangler.toml           # Cloudflare config
├── package.json            # Dependencies
├── .env.example            # Environment template
└── README.md              # This file
```

## API Endpoints

### POST /api/scrape

Trigger data refresh from FireCrawl API and download latest CSV.

**Request:**
```bash
curl -X POST https://your-domain/api/scrape
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-09-09T14:30:00Z",
  "csv": "date,sex,age,ethnicity,population\n...",
  "recordCount": 1234
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### GET / (or /index.html)

Serves the dashboard UI.

## Data Source

- **Website**: https://open.dosm.gov.my/data-catalogue/population_malaysia
- **CSV URL**: https://storage.dosm.gov.my/population/population_malaysia.csv
- **Updated**: Annually (July 31st)
- **Format**: CSV with columns: date, sex, age, ethnicity, population

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Charts**: Chart.js 3.9.1
- **Backend**: Cloudflare Workers
- **Caching**: Cloudflare KV
- **Deployment**: Cloudflare Pages
- **Web Scraping**: FireCrawl API
- **CI/CD**: GitHub Actions (via Cloudflare)

## Environment Variables

Required:
- `FIRECRAWL_API_KEY` - Your FireCrawl API key from https://www.firecrawl.dev/

Optional:
- `ENVIRONMENT` - Set to `production` or `development`
- `CACHE_TTL` - Cache duration in seconds (default: 3600)

## Performance

- **Page Load**: < 1s (cached)
- **Data Refresh**: 5-15s (depends on FireCrawl API)
- **Cache Duration**: 1 hour (configurable)
- **Storage**: < 1MB (CSV + metadata)

## Troubleshooting

### Dashboard not loading
- Check browser console for errors (F12)
- Verify Cloudflare Pages deployment status
- Ensure Worker is deployed: `wrangler deploy`

### Refresh button not working
- Check Worker is deployed
- Verify `FIRECRAWL_API_KEY` is set in Cloudflare env vars
- Check browser network tab for API errors

### Data not updating
- Check cache settings in worker.js
- Verify FireCrawl API is working: https://www.firecrawl.dev/
- Review Worker logs in Cloudflare Dashboard

## Contributing

To contribute:
1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature/name`
5. Open Pull Request

## License

MIT License - Feel free to use this project for any purpose!

## Support

- **Issues**: Create an issue on GitHub
- **Questions**: Check existing issues and discussions
- **FireCrawl Docs**: https://docs.firecrawl.dev/
- **Cloudflare Docs**: https://developers.cloudflare.com/

## Roadmap

- [ ] Add data export (CSV, JSON, Excel)
- [ ] Add filtering by date range and demographics
- [ ] Add comparison charts between years
- [ ] Implement predictions using ML
- [ ] Add SMS/Email alerts for new data
- [ ] Support multiple data sources
- [ ] Add dark mode toggle
- [ ] Create mobile app

---

**Built with ❤️ using Cloudflare Workers & FireCrawl API**
