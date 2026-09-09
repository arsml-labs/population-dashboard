/**
 * Cloudflare Worker for Malaysia Population Data Scraping
 * Handles FireCrawl API calls and CSV retrieval
 */

const FIRECRAWL_API_KEY = 'fc-5cd6568e771341069972df076d55e693';
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v0';
const DATA_URL = 'https://open.dosm.gov.my/data-catalogue/population_malaysia';
const CSV_URL = 'https://storage.dosm.gov.my/population/population_malaysia.csv';

export default {
  async fetch(request, env, ctx) {
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

    const url = new URL(request.url);
    const path = url.pathname;

    // Routes
    if (path === '/api/scrape' && request.method === 'POST') {
      return handleScrape(env, headers);
    }

    if (path === '/' || path === '/index.html') {
      return serveStatic('index.html', env);
    }

    // Serve static files
    if (path.startsWith('/public/') || path.match(/\.(css|js|png|jpg|gif|svg|ico)$/)) {
      return serveStatic(path.replace(/^\/public\//, ''), env);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers,
    });
  },
};

async function handleScrape(env, headers) {
  try {
    console.log('Starting scrape process...');

    // Check cache first
    const cache = caches.default;
    const cacheKey = new Request(new URL('/cache/population-data', 'http://cache'), {
      method: 'GET',
    });

    let cachedData = await cache.match(cacheKey);
    if (cachedData) {
      console.log('Returning cached data');
      return new Response(cachedData.body, {
        status: 200,
        headers: { ...headers, 'X-Cache': 'hit' },
      });
    }

    // Scrape page with FireCrawl
    console.log('Scraping page with FireCrawl...');
    const scrapeResponse = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
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

    // Cache the response for 1 hour
    const response = new Response(responseData, {
      status: 200,
      headers: { ...headers, 'X-Cache': 'miss' },
    });

    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return new Response(responseData, {
      status: 200,
      headers: { ...headers, 'X-Cache': 'miss' },
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

async function serveStatic(filePath, env) {
  try {
    // Get file from Cloudflare R2 or serve from embedded content
    const content = getStaticContent(filePath);

    if (!content) {
      return new Response('Not found', { status: 404 });
    }

    const contentType = getContentType(filePath);
    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}

function getStaticContent(filePath) {
  // This will be replaced with actual file content during build
  // For now, return index.html as default
  if (filePath === 'index.html' || filePath === '') {
    return EMBEDDED_INDEX_HTML;
  }
  return null;
}

function getContentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.js')) return 'application/javascript';
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.ico')) return 'image/x-icon';
  return 'application/octet-stream';
}

// Embedded HTML - will be injected during build
const EMBEDDED_INDEX_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Malaysia Population Dashboard</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
        }

        .header p {
            color: #666;
            font-size: 1.1em;
            margin-bottom: 20px;
        }

        .controls {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .status {
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 0.95em;
            font-weight: 500;
        }

        .status.loading {
            background: #fef3c7;
            color: #92400e;
        }

        .status.success {
            background: #dcfce7;
            color: #166534;
        }

        .status.error {
            background: #fee2e2;
            color: #991b1b;
        }

        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .card h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5em;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }

        .stat-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
        }

        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
            margin-bottom: 10px;
        }

        .stat-value {
            font-size: 2.5em;
            font-weight: 700;
        }

        .table-container {
            overflow-x: auto;
            margin-top: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: #f3f4f6;
            color: #333;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #e5e7eb;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #666;
        }

        tr:hover {
            background: #f9fafb;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }

        .spinner {
            display: inline-block;
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .last-updated {
            color: #999;
            font-size: 0.9em;
            margin-top: 20px;
        }

        @media (max-width: 768px) {
            .dashboard {
                grid-template-columns: 1fr;
            }

            .header h1 {
                font-size: 1.8em;
            }

            .controls {
                flex-direction: column;
                align-items: stretch;
            }

            .btn {
                width: 100%;
            }

            .stats {
                grid-template-columns: 1fr;
            }
        }

        .error-message {
            background: #fee2e2;
            color: #991b1b;
            padding: 15px;
            border-radius: 6px;
            margin-top: 15px;
            display: none;
        }

        .error-message.show {
            display: block;
        }

        .data-info {
            background: #f0f9ff;
            border-left: 4px solid #0284c7;
            padding: 15px;
            border-radius: 4px;
            margin-top: 15px;
            font-size: 0.9em;
            color: #0c4a6e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🇲🇾 Malaysia Population Dashboard</h1>
            <p>Real-time population data analysis from Department of Statistics Malaysia</p>

            <div class="controls">
                <button class="btn btn-primary" id="refreshBtn" onclick="refreshData()">
                    🔄 Refresh Data
                </button>
                <div class="status" id="status" style="display: none;"></div>
            </div>
            <div class="error-message" id="errorMessage"></div>
            <div class="last-updated" id="lastUpdated"></div>
        </div>

        <div class="stats" id="statsContainer">
            <div class="stat-box">
                <div class="stat-label">Total Population (2026)</div>
                <div class="stat-value" id="totalPop">-</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Male Population</div>
                <div class="stat-value" id="malePop">-</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Female Population</div>
                <div class="stat-value" id="femalePop">-</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Total Records</div>
                <div class="stat-value" id="totalRecords">-</div>
            </div>
        </div>

        <div class="dashboard">
            <div class="card">
                <h2>Population by Ethnicity (2026)</h2>
                <canvas id="ethnicityChart"></canvas>
            </div>

            <div class="card">
                <h2>Population by Age Group (2026)</h2>
                <canvas id="ageChart"></canvas>
            </div>

            <div class="card">
                <h2>Historical Population Trend</h2>
                <canvas id="trendChart"></canvas>
            </div>

            <div class="card">
                <h2>Gender Distribution (2026)</h2>
                <canvas id="genderChart"></canvas>
            </div>
        </div>

        <div class="card">
            <h2>Latest Population Data</h2>
            <div class="table-container">
                <table id="dataTable">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Sex</th>
                            <th>Age Group</th>
                            <th>Ethnicity</th>
                            <th>Population ('000)</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                        <tr>
                            <td colspan="5" class="loading">
                                <div class="spinner"></div>
                                Loading data...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="data-info">
                Data source: Department of Statistics Malaysia | Updated via FireCrawl API
            </div>
        </div>
    </div>

    <script>
        let charts = {};

        async function refreshData() {
            const btn = document.getElementById('refreshBtn');
            const statusDiv = document.getElementById('status');
            const errorDiv = document.getElementById('errorMessage');

            btn.disabled = true;
            statusDiv.style.display = 'block';
            statusDiv.className = 'status loading';
            statusDiv.textContent = '⏳ Refreshing data...';
            errorDiv.classList.remove('show');

            try {
                const response = await fetch('/api/scrape', {
                    method: 'POST',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch data: ' + response.status);
                }

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                // Update UI with new data
                updateDashboard(data);

                statusDiv.className = 'status success';
                statusDiv.textContent = '✓ Data refreshed successfully!';

                const now = new Date().toLocaleString();
                document.getElementById('lastUpdated').textContent = 'Last updated: ' + now;

                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 5000);

            } catch (error) {
                console.error('Error:', error);
                statusDiv.className = 'status error';
                statusDiv.textContent = '✗ Error refreshing data';

                errorDiv.textContent = 'Error: ' + error.message;
                errorDiv.classList.add('show');
            } finally {
                btn.disabled = false;
            }
        }

        function updateDashboard(data) {
            // Parse CSV data
            const lines = data.csv.split('\\n');
            const headers = lines[0].split(',');
            const records = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',');
                records.push({
                    date: values[0],
                    sex: values[1],
                    age: values[2],
                    ethnicity: values[3],
                    population: parseFloat(values[4])
                });
            }

            // Get latest year data (2026)
            const latestYear = records.filter(r => r.date.startsWith('2026'));

            // Calculate stats
            const overall2026 = latestYear.find(r =>
                r.sex === 'both' && r.age === 'overall' && r.ethnicity === 'overall'
            );

            const male2026 = latestYear.find(r =>
                r.sex === 'male' && r.age === 'overall' && r.ethnicity === 'overall'
            );

            const female2026 = latestYear.find(r =>
                r.sex === 'female' && r.age === 'overall' && r.ethnicity === 'overall'
            );

            document.getElementById('totalPop').textContent =
                overall2026 ? (overall2026.population * 1000).toLocaleString() : '-';
            document.getElementById('malePop').textContent =
                male2026 ? (male2026.population * 1000).toLocaleString() : '-';
            document.getElementById('femalePop').textContent =
                female2026 ? (female2026.population * 1000).toLocaleString() : '-';
            document.getElementById('totalRecords').textContent = records.length.toLocaleString();

            // Update charts
            updateEthnicityChart(latestYear);
            updateAgeChart(latestYear);
            updateTrendChart(records);
            updateGenderChart(latestYear);
            updateTable(latestYear.slice(0, 15));
        }

        function updateEthnicityChart(data) {
            const ethnicData = data.filter(r =>
                r.age === 'overall' && r.sex === 'both'
            );

            const ctx = document.getElementById('ethnicityChart').getContext('2d');
            if (charts.ethnicity) charts.ethnicity.destroy();

            charts.ethnicity = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ethnicData.map(d => d.ethnicity.toUpperCase()),
                    datasets: [{
                        data: ethnicData.map(d => d.population),
                        backgroundColor: [
                            '#667eea', '#764ba2', '#f093fb', '#4facfe',
                            '#00f2fe', '#43e97b', '#fa709a', '#feca57'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        function updateAgeChart(data) {
            const ageData = data.filter(r =>
                r.age !== 'overall' && r.sex === 'both' && r.ethnicity === 'overall'
            ).sort((a, b) => {
                const aStart = parseInt(a.age.split('-')[0]);
                const bStart = parseInt(b.age.split('-')[0]);
                return aStart - bStart;
            });

            const ctx = document.getElementById('ageChart').getContext('2d');
            if (charts.age) charts.age.destroy();

            charts.age = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ageData.map(d => d.age),
                    datasets: [{
                        label: 'Population (thousands)',
                        data: ageData.map(d => d.population),
                        backgroundColor: '#667eea'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true } }
                }
            });
        }

        function updateTrendChart(data) {
            const trendData = data.filter(r =>
                r.sex === 'both' && r.age === 'overall' && r.ethnicity === 'overall'
            ).sort((a, b) => new Date(a.date) - new Date(b.date));

            const ctx = document.getElementById('trendChart').getContext('2d');
            if (charts.trend) charts.trend.destroy();

            charts.trend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trendData.map(d => d.date.substring(0, 4)),
                    datasets: [{
                        label: 'Total Population (thousands)',
                        data: trendData.map(d => d.population),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true } }
                }
            });
        }

        function updateGenderChart(data) {
            const genderData = data.filter(r =>
                r.age === 'overall' && r.ethnicity === 'overall' && r.sex !== 'both'
            );

            const ctx = document.getElementById('genderChart').getContext('2d');
            if (charts.gender) charts.gender.destroy();

            charts.gender = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: genderData.map(d => d.sex.charAt(0).toUpperCase() + d.sex.slice(1)),
                    datasets: [{
                        data: genderData.map(d => d.population),
                        backgroundColor: ['#667eea', '#764ba2']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }

        function updateTable(data) {
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = data.map(d => '<tr><td>' + d.date + '</td><td>' + d.sex + '</td><td>' + d.age + '</td><td>' + d.ethnicity + '</td><td>' + d.population.toLocaleString() + '</td></tr>').join('');
        }

        // Load initial data on page load
        window.addEventListener('load', () => {
            refreshData();
        });
    </script>
</body>
</html>
`;
