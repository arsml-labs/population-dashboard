// Cloudflare Pages Function for web scraping
// Route: /api/scrape

const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v0';
const DATA_URL = 'https://open.dosm.gov.my/data-catalogue/population_malaysia';
const CSV_URL = 'https://storage.dosm.gov.my/population/population_malaysia.csv';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Enable CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Only accept POST requests to /api/scrape
  if (url.pathname !== '/api/scrape') {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers,
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  return handleScrape(context, headers);
}

async function handleScrape(context, headers) {
  try {
    const { env } = context;
    // Try to get API key from environment or request
    const apiKey = env?.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY;

    console.log('Starting fresh scrape process...');
    console.log('API Key available:', !!apiKey);

    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured in environment');
    }

    // Always scrape fresh (no caching)
    console.log('Scraping page with FireCrawl...');
    const scrapeResponse = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: DATA_URL,
        formats: ['markdown'],
      }),
    });

    if (!scrapeResponse.ok) {
      throw new Error(`FireCrawl API error: ${scrapeResponse.status}`);
    }

    // Download CSV
    console.log('Downloading CSV file...');
    const csvResponse = await fetch(CSV_URL);

    if (!csvResponse.ok) {
      throw new Error(`Failed to download CSV: ${csvResponse.status}`);
    }

    const csv = await csvResponse.text();

    // Prepare response
    const responseData = JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      csv: csv,
      recordCount: csv.split('\n').length - 2,
    });

    return new Response(responseData, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error in scrape:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers,
      }
    );
  }
}
