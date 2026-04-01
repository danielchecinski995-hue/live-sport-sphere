/**
 * Simulation: Create 20 tournaments concurrently
 * Usage: node scripts/simulate-20-tournaments.js [BASE_URL]
 * Default: https://live-sport-sphere-api-694574979605.europe-west1.run.app
 */

const BASE_URL = process.argv[2] || 'https://live-sport-sphere-api-694574979605.europe-west1.run.app';

const TOURNAMENT_NAMES = [
  'Liga Orlika Warszawa 2026',
  'Turniej Letni Krakow',
  'Puchar Wiosny Gdansk',
  'Liga Amatorska Poznan',
  'Turniej Pilkarski Wroclaw',
  'Copa del Barrio Lodz',
  'Liga Nocna Szczecin',
  'Turniej Charytatywny Lublin',
  'Puchar Jesieni Katowice',
  'Mini Liga Bydgoszcz',
  'Turniej Firmowy IT Cup',
  'Liga Osiedlowa Rzeszow',
  'Puchar Prezydenta Bialystok',
  'Turniej Studencki AGH',
  'Liga Szkolna Torun',
  'Puchar Lata Olsztyn',
  'Turniej Streetball Opole',
  'Liga Weekendowa Kielce',
  'Puchar Niepodleglosci Radom',
  'Turniej Masters 35+ Gliwice',
];

const FORMATS = ['league', 'knockout', 'groups_playoff', 'swiss', 'league_playoff', 'multi_level'];

async function createTournament(name, index) {
  const format = FORMATS[index % FORMATS.length];
  const start = Date.now();

  try {
    const res = await fetch(`${BASE_URL}/api/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        format_type: format,
        config: {
          points: { win: 3, draw: 1, loss: 0 },
        },
      }),
    });

    const data = await res.json();
    const duration = Date.now() - start;

    if (res.ok) {
      console.log(`[OK]  #${index + 1} "${name}" (${format}) - ${duration}ms - code: ${data.data?.share_code}`);
    } else {
      console.log(`[ERR] #${index + 1} "${name}" - ${duration}ms - ${data.error}`);
    }

    return { ok: res.ok, duration, name };
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`[FAIL] #${index + 1} "${name}" - ${duration}ms - ${err.message}`);
    return { ok: false, duration, name, error: err.message };
  }
}

async function main() {
  console.log(`\n=== Simulation: 20 Tournaments ===`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Start: ${new Date().toISOString()}\n`);

  // Health check
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    console.log(`Health: ${health.status} - DB: ${health.database}\n`);
  } catch (err) {
    console.log(`Health check failed: ${err.message}`);
    console.log('Continuing anyway...\n');
  }

  const totalStart = Date.now();

  // Run all 20 concurrently
  const results = await Promise.all(
    TOURNAMENT_NAMES.map((name, i) => createTournament(name, i))
  );

  const totalDuration = Date.now() - totalStart;
  const succeeded = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length);
  const maxDuration = Math.max(...results.map(r => r.duration));
  const minDuration = Math.min(...results.map(r => r.duration));

  console.log(`\n=== Results ===`);
  console.log(`Total time:    ${totalDuration}ms`);
  console.log(`Succeeded:     ${succeeded}/20`);
  console.log(`Failed:        ${failed}/20`);
  console.log(`Avg response:  ${avgDuration}ms`);
  console.log(`Min response:  ${minDuration}ms`);
  console.log(`Max response:  ${maxDuration}ms`);
  console.log(`Throughput:    ${(20 / (totalDuration / 1000)).toFixed(1)} req/s\n`);
}

main().catch(console.error);
