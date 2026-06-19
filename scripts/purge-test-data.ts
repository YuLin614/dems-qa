// scripts/purge-test-data.ts
import 'dotenv/config';
import https from 'https';

const BACKEND_URL  = process.env.BACKEND_URL!;
const KEYCLOAK_URL = process.env.KEYCLOAK_URL!;
const REALM        = process.env.KEYCLOAK_REALM!;
const CLIENT_ID    = process.env.KEYCLOAK_CLIENT_ID!;
const USERNAME     = process.env.TEST_OFFICER_USERNAME!;
const PASSWORD     = process.env.TEST_OFFICER_PASSWORD!;
const MAX_AGE_HOURS = parseInt(process.env.PURGE_MAX_AGE_HOURS ?? '24', 10);
const DRY_RUN = process.argv.includes('--dry-run');

async function fetchJson(url: string, opts: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${opts.method ?? 'GET'} ${url} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getToken(): Promise<string> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID, grant_type: 'password',
    username: USERNAME, password: PASSWORD,
  });
  const res = await fetch(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, {
    method: 'POST', body,
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function main() {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // VERIFY: check if GET /records paginates — may need loop
  // VERIFY: GET /records returns array of {id, title, created_at}
  const records = (await fetchJson(`${BACKEND_URL}/records`, { headers })) as Array<{
    id: string; title: string; created_at: string;
  }>;

  const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
  const stale = records.filter(
    (r) => r.title.startsWith('[E2E]') && new Date(r.created_at).getTime() < cutoff,
  );

  console.log(`Found ${stale.length} stale [E2E] records (older than ${MAX_AGE_HOURS}h)${DRY_RUN ? ' [DRY RUN]' : ''}`);

  for (const record of stale) {
    if (DRY_RUN) {
      console.log(`  Would delete: ${record.id} — "${record.title}" (created ${record.created_at})`);
      continue;
    }
    // VERIFY: DELETE /records/{id} is the correct endpoint
    await fetchJson(`${BACKEND_URL}/records/${record.id}`, { method: 'DELETE', headers });
    console.log(`  Deleted: ${record.id} — "${record.title}"`);
  }

  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
