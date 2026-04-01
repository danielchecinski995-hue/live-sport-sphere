/**
 * Load Test: 50 virtual users x 5 minutes
 * Usage: node scripts/load-test.js [BASE_URL] [USERS] [DURATION_SEC]
 * Default: 50 users, 300 seconds (5 min)
 */

const BASE_URL = process.argv[2] || 'https://live-sport-sphere-api-694574979605.europe-west1.run.app';
const NUM_USERS = parseInt(process.argv[3] || '50');
const DURATION_SEC = parseInt(process.argv[4] || '300');

const ENDPOINTS = [
  { method: 'GET', path: '/api/health', weight: 1 },
  { method: 'GET', path: '/api/tournaments/public', weight: 3 },
  { method: 'GET', path: '/api/tournaments/search?q=Liga', weight: 2 },
  { method: 'POST', path: '/api/tournaments', weight: 1, body: { name: `LoadTest-${Date.now()}`, format_type: 'league', config: {} } },
];

const stats = {
  total: 0,
  success: 0,
  errors: 0,
  latencies: [],
  statusCodes: {},
  byEndpoint: {},
};

function pickEndpoint() {
  const totalWeight = ENDPOINTS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const ep of ENDPOINTS) {
    r -= ep.weight;
    if (r <= 0) return ep;
  }
  return ENDPOINTS[0];
}

async function makeRequest(endpoint) {
  const start = Date.now();
  const key = `${endpoint.method} ${endpoint.path}`;

  try {
    const opts = {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (endpoint.body) {
      opts.body = JSON.stringify({ ...endpoint.body, name: `LoadTest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
    }

    const res = await fetch(`${BASE_URL}${endpoint.path}`, opts);
    const duration = Date.now() - start;

    stats.total++;
    stats.latencies.push(duration);
    stats.statusCodes[res.status] = (stats.statusCodes[res.status] || 0) + 1;

    if (!stats.byEndpoint[key]) stats.byEndpoint[key] = { total: 0, success: 0, errors: 0, latencies: [] };
    stats.byEndpoint[key].total++;
    stats.byEndpoint[key].latencies.push(duration);

    if (res.ok) {
      stats.success++;
      stats.byEndpoint[key].success++;
    } else {
      stats.errors++;
      stats.byEndpoint[key].errors++;
    }
  } catch (err) {
    const duration = Date.now() - start;
    stats.total++;
    stats.errors++;
    stats.latencies.push(duration);

    if (!stats.byEndpoint[key]) stats.byEndpoint[key] = { total: 0, success: 0, errors: 0, latencies: [] };
    stats.byEndpoint[key].total++;
    stats.byEndpoint[key].errors++;
    stats.byEndpoint[key].latencies.push(duration);
  }
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function virtualUser(userId, endTime) {
  while (Date.now() < endTime) {
    const endpoint = pickEndpoint();
    await makeRequest(endpoint);
    // Random delay 100-500ms between requests
    await new Promise(r => setTimeout(r, 100 + Math.random() * 400));
  }
}

async function main() {
  console.log(`\n=== Load Test ===`);
  console.log(`Target:    ${BASE_URL}`);
  console.log(`Users:     ${NUM_USERS}`);
  console.log(`Duration:  ${DURATION_SEC}s`);
  console.log(`Start:     ${new Date().toISOString()}\n`);

  const endTime = Date.now() + DURATION_SEC * 1000;
  const progressInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - (endTime - DURATION_SEC * 1000)) / 1000);
    const rps = (stats.total / elapsed).toFixed(1);
    process.stdout.write(`\r  ${elapsed}/${DURATION_SEC}s | ${stats.total} reqs | ${rps} rps | ${stats.errors} errors`);
  }, 2000);

  // Launch all virtual users
  const users = Array.from({ length: NUM_USERS }, (_, i) => virtualUser(i, endTime));
  await Promise.all(users);

  clearInterval(progressInterval);
  console.log('\n');

  // Print results
  const avg = Math.round(stats.latencies.reduce((s, l) => s + l, 0) / stats.latencies.length);
  const p50 = percentile(stats.latencies, 50);
  const p95 = percentile(stats.latencies, 95);
  const p99 = percentile(stats.latencies, 99);
  const rps = (stats.total / DURATION_SEC).toFixed(1);

  console.log(`=== Results ===`);
  console.log(`Total requests:  ${stats.total}`);
  console.log(`Success:         ${stats.success} (${((stats.success / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Errors:          ${stats.errors} (${((stats.errors / stats.total) * 100).toFixed(1)}%)`);
  console.log(`RPS:             ${rps}`);
  console.log(`Latency avg:     ${avg}ms`);
  console.log(`Latency p50:     ${p50}ms`);
  console.log(`Latency p95:     ${p95}ms`);
  console.log(`Latency p99:     ${p99}ms`);
  console.log(`\nStatus codes:`, stats.statusCodes);

  console.log(`\n--- Per Endpoint ---`);
  for (const [key, s] of Object.entries(stats.byEndpoint)) {
    const epAvg = Math.round(s.latencies.reduce((sum, l) => sum + l, 0) / s.latencies.length);
    const epP95 = percentile(s.latencies, 95);
    console.log(`  ${key}`);
    console.log(`    Requests: ${s.total} | OK: ${s.success} | Err: ${s.errors} | Avg: ${epAvg}ms | P95: ${epP95}ms`);
  }
  console.log('');
}

main().catch(console.error);
