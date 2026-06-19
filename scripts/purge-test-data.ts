// scripts/purge-test-data.ts
import 'dotenv/config';

const BACKEND_URL  = process.env.BACKEND_URL!;
const KEYCLOAK_URL = process.env.KEYCLOAK_URL!;
const REALM        = process.env.KEYCLOAK_REALM!;
const CLIENT_ID    = process.env.KEYCLOAK_CLIENT_ID!;
// Use sysops credentials for broader record list scope
const USERNAME     = process.env.TEST_SYSOPS_USERNAME!;
const PASSWORD     = process.env.TEST_SYSOPS_PASSWORD!;
const MAX_AGE_HOURS = parseInt(process.env.PURGE_MAX_AGE_HOURS ?? '24', 10);
const DRY_RUN = process.argv.includes('--dry-run');

// RESOLVED: actual field names confirmed from source
interface Record {
  id: string;
  external_record_id: string;
  created_timestamp: string;
}

// RESOLVED: GET /api/v1/records returns paginated response
interface PaginatedRecords {
  items: Record[];
  total: number;
  pages: number;
  page: number;
  has_next: boolean;
}

async function fetchJson<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${opts.method ?? 'GET'} ${url} → ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function getToken(): Promise<string> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID, grant_type: 'password',
    username: USERNAME, password: PASSWORD,
  });
  // RESOLVED: Keycloak token endpoint uses /oidc/ prefix
  const res = await fetch(`${KEYCLOAK_URL}/oidc/realms/${REALM}/protocol/openid-connect/token`, {
    method: 'POST', body,
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function main() {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // RESOLVED: GET /api/v1/records is paginated — loop through all pages
  const allRecords: Record[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const data = await fetchJson<PaginatedRecords>(
      `${BACKEND_URL}/api/v1/records?page=${page}`,
      { headers },
    );
    allRecords.push(...data.items);
    hasNext = data.has_next;
    page++;
  }

  const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
  // RESOLVED: filter field is external_record_id (no title field), date field is created_timestamp
  const stale = allRecords.filter(
    (r) => r.external_record_id.startsWith('[E2E] ') && new Date(r.created_timestamp).getTime() < cutoff,
  );

  console.log(`Found ${stale.length} stale [E2E] records (older than ${MAX_AGE_HOURS}h)${DRY_RUN ? ' [DRY RUN]' : ''}`);

  for (const record of stale) {
    if (DRY_RUN) {
      console.log(`  Would delete: ${record.id} — "${record.external_record_id}" (created ${record.created_timestamp})`);
      continue;
    }
    // RESOLVED: DELETE /api/v1/records/{id}
    await fetchJson<unknown>(`${BACKEND_URL}/api/v1/records/${record.id}`, { method: 'DELETE', headers });
    console.log(`  Deleted: ${record.id} — "${record.external_record_id}"`);
  }

  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
