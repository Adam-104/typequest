// TypeQuest API benchmark. Needs Node 18+ (built-in fetch). Run from the project folder:
//   node scripts/api-benchmark.mjs https://typequest-api.onrender.com you@example.com YourPassword [rounds]
// It only READS data (plus a few logins), so it is safe on the live site.
// Keep the rounds modest: the free Render plan has little CPU, and the login endpoint is rate limited.

const [base, email, password, roundsArg] = process.argv.slice(2);

if (!base || !email || !password) {
    console.log('Usage: node scripts/api-benchmark.mjs <api-base-url> <email> <password> [rounds=30]');
    process.exit(1);
}

const API = base.replace(/\/$/, '');
const ROUNDS = Math.max(5, Number(roundsArg) || 30);
const now = () => performance.now();

function percentile(sorted, p) {
    return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

async function timed(path, options = {}) {
    const start = now();
    let status = 0;
    let bytes = 0;

    try {
        const response = await fetch(API + path, options);
        status = response.status;
        bytes = (await response.arrayBuffer()).byteLength;
    } catch {
        status = 0;
    }

    return {ms: now() - start, status, bytes};
}

function summarise(name, runs) {
    const ok = runs.filter((run) => run.status >= 200 && run.status < 300);
    const times = ok.map((run) => run.ms).sort((a, b) => a - b);

    if (times.length === 0) {
        return {name, note: `no successful responses (last status ${runs.at(-1)?.status})`};
    }

    return {
        name,
        ok: `${ok.length}/${runs.length}`,
        p50: Math.round(percentile(times, 50)),
        p95: Math.round(percentile(times, 95)),
        max: Math.round(times.at(-1)),
        kb: (ok[0].bytes / 1024).toFixed(1),
    };
}

console.log(`\nTypeQuest API benchmark: ${API}   (${ROUNDS} requests per endpoint)\n`);

// 1. Cold start: the first request after the free server has been idle.
const first = await timed('/actuator/health');
console.log(`1. First request (cold start check): ${Math.round(first.ms)} ms, HTTP ${first.status}`);
console.log(first.ms > 8000
    ? '   -> the server was asleep. This is the biggest delay your users feel.\n'
    : '   -> the server was already awake.\n');

// 2. Login: BCrypt is deliberately slow, so this is the heaviest single call.
const logins = [];
let token = '';

for (let i = 0; i < 3; i += 1) {
    const start = now();
    const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
    }).catch(() => null);

    logins.push({ms: now() - start, status: response?.status ?? 0, bytes: 0});

    if (response?.ok && !token) {
        token = (await response.json()).accessToken;
    }
}

console.log(`2. Login x3: ${logins.map((l) => `${Math.round(l.ms)} ms (HTTP ${l.status})`).join(', ')}\n`);

if (!token) {
    console.log('Login failed, so only public endpoints are measured below.\n');
}

const auth = token ? {headers: {Authorization: `Bearer ${token}`}} : null;

const endpoints = [
    ['GET /actuator/health', '/actuator/health', {}],
    ['GET /api/lessons (public)', '/api/lessons', {}],
    ['GET /api/leaderboard', '/api/leaderboard', auth],
    ['GET /api/achievements', '/api/achievements', auth],
    ['GET /api/users/me', '/api/users/me', auth],
    ['GET /api/games/history', '/api/games/history', auth],
    ['GET /api/lesson-progress/completed-count', '/api/lesson-progress/completed-count', auth],
].filter(([, , options]) => options !== null);

// 3. Sequential timings, after 3 warm-up calls that are thrown away.
const rows = [];

for (const [name, path, options] of endpoints) {
    for (let i = 0; i < 3; i += 1) {
        await timed(path, options);
    }

    const runs = [];

    for (let i = 0; i < ROUNDS; i += 1) {
        runs.push(await timed(path, options));
    }

    rows.push(summarise(name, runs));
}

console.log('3. One request at a time (milliseconds):\n');
console.log('| Endpoint | OK | p50 | p95 | max | size KB |');
console.log('|---|---|---|---|---|---|');

for (const row of rows) {
    console.log(row.note
        ? `| ${row.name} | ${row.note} | | | | |`
        : `| ${row.name} | ${row.ok} | ${row.p50} | ${row.p95} | ${row.max} | ${row.kb} |`);
}

// 4. Ten users at once, five times over.
async function burst(name, path, options) {
    const start = now();
    const results = [];

    for (let round = 0; round < 5; round += 1) {
        results.push(...await Promise.all(Array.from({length: 10}, () => timed(path, options))));
    }

    const seconds = (now() - start) / 1000;
    const times = results.filter((r) => r.status === 200).map((r) => r.ms).sort((a, b) => a - b);
    const failed = results.length - times.length;

    console.log(`| ${name} | ${results.length} | ${(results.length / seconds).toFixed(1)} | ${times.length ? Math.round(percentile(times, 50)) : '-'} | ${times.length ? Math.round(percentile(times, 95)) : '-'} | ${failed} |`);
}

console.log('\n4. Ten requests at the same time, five rounds:\n');
console.log('| Endpoint | Requests | Req/sec | p50 ms | p95 ms | Failed |');
console.log('|---|---|---|---|---|---|');
await burst('GET /api/lessons', '/api/lessons', {});

if (auth) {
    await burst('GET /api/leaderboard', '/api/leaderboard', auth);
    await burst('GET /api/games/history', '/api/games/history', auth);
}

console.log('\nHow to read it: under 200 ms feels instant, 200 to 500 ms is fine, over 1000 ms is slow.');
console.log('If the database is far from the server, every query adds its own round trip to these numbers.\n');
