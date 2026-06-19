// scripts/purge-test-data.ts
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const FRONTEND_URL = process.env.FRONTEND_URL!;
const BACKEND_URL  = process.env.BACKEND_URL!;
const MAX_AGE_HOURS = parseInt(process.env.PURGE_MAX_AGE_HOURS ?? '24', 10);
const DRY_RUN = process.argv.includes('--dry-run');

// RESOLVED: actual field names confirmed from source
interface EvidenceRecord {
  id: string;
  external_record_id: string;
  created_timestamp: string;
}

// RESOLVED: GET /api/v1/records returns paginated response
interface PaginatedRecords {
  items: EvidenceRecord[];
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
  // Read session from Playwright auth state (same approach as API tests)
  // Try sysops first, fall back to officer
  const candidates = ['sysops', 'officer'];
  for (const role of candidates) {
    const authFile = path.join(__dirname, '../.auth', `${role}.json`);
    if (!fs.existsSync(authFile)) continue;
    const authState = JSON.parse(fs.readFileSync(authFile, 'utf8'));
    const cookies: Record<string, string> = {};
    for (const c of authState.cookies ?? []) {
      if (c.name.includes('session-token')) cookies[c.name] = c.value;
    }
    if (!Object.keys(cookies).length) continue;
    const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(`${FRONTEND_URL}/api/auth/session`, {
      headers: { Cookie: cookieHeader },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as { user?: { accessToken?: string } };
    if (data?.user?.accessToken) return data.user.accessToken;
  }
  throw new Error('No valid session found — run `npm run setup:auth` first');
}

async function main() {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // RESOLVED: GET /api/v1/records is paginated — loop through all pages
  const allRecords: EvidenceRecord[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const data = await fetchJson<PaginatedRecords>(
      `${BACKEND_URL}/api/v1/records?page=${page}&page_size=100`,
      { headers },
    );
    // Extract records — may be nested under .record key
    const recs = (data.items ?? []).map((item: any) => item.record ?? item);
    allRecords.push(...recs);
    hasNext = data.has_next ?? false;
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
    const delRes = await fetch(`${BACKEND_URL}/api/v1/records/${record.id}`, { method: 'DELETE', headers });
    if (delRes.status === 403) {
      console.log(`  SKIP (403): ${record.id} — "${record.external_record_id}" (insufficient permissions)`);
      continue;
    }
    if (!delRes.ok) {
      console.log(`  FAIL (${delRes.status}): ${record.id} — "${record.external_record_id}"`);
      continue;
    }
    console.log(`  Deleted: ${record.id} — "${record.external_record_id}"`);
  }

  console.log('Done.');
}

main().catch((err) => { console.error(err); process.exit(1); });
