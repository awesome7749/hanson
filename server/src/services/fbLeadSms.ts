import type { PrismaClient } from '@prisma/client';

// Facebook Instant Form leads land in a link-shared Google Sheet (one tab per
// form version — Meta adds a new tab every time the form is replaced). This
// service polls every tab, and texts each brand-new lead from the Hanson
// RingCentral line to set up a call. The FbLeadSms table is the send ledger,
// so a restarted server never texts the same person twice. Enabled only when
// the RingCentral credentials are configured; otherwise the server runs as
// before.

export interface FbLead {
  id: string;
  createdTime: Date;
  name: string;
  phone: string; // E.164, e.g. +15089718822
  zip: string;
  adName: string;
}

export interface FbLeadSmsConfig {
  sheetId: string;
  knownGids: string[];
  clientId: string;
  clientSecret: string;
  jwt: string;
  from: string;
  template: string;
  serverUrl: string;
}

// Minimal CSV parser that honors quoted fields (ad names may contain commas).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); if (row.length > 1 || row[0] !== '') rows.push(row); }
  return rows;
}

const TEST_MARKERS = ['test lead', 'dummy', 'test@meta.com'];

// Turns one tab's CSV into leads, dropping Meta test submissions and rows
// without a usable US phone number.
export function extractLeads(csv: string): FbLead[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];
  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const idIdx = col('id');
  const timeIdx = col('created_time');
  const nameIdx = col('full_name');
  const phoneIdx = col('phone_number');
  const zipIdx = col('zip_code');
  const adIdx = col('ad_name');
  if (idIdx < 0 || timeIdx < 0 || phoneIdx < 0) return [];
  const leads: FbLead[] = [];
  for (const row of rows.slice(1)) {
    const joined = row.join(' ').toLowerCase();
    if (TEST_MARKERS.some(m => joined.includes(m))) continue;
    const id = row[idIdx]?.trim();
    const createdTime = new Date(row[timeIdx]?.trim() || '');
    const phone = (row[phoneIdx] || '').replace(/^p:/, '').replace(/[^+\d]/g, '');
    if (!id || Number.isNaN(createdTime.getTime())) continue;
    if (!/^\+1\d{10}$/.test(phone)) continue;
    leads.push({
      id,
      createdTime,
      name: (row[nameIdx] || '').trim(),
      phone,
      zip: (row[zipIdx] || '').replace(/^z:/, '').trim(),
      adName: (row[adIdx] || '').trim(),
    });
  }
  return leads;
}

// Texting window: 8:00–20:30 Eastern. Leads arriving overnight are held and
// sent when the window opens; nobody gets a 3 AM text.
export function withinSendWindow(now: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour12: false, hour: 'numeric', minute: 'numeric',
  }).formatToParts(now);
  const hour = Number(parts.find(p => p.type === 'hour')?.value);
  const minute = Number(parts.find(p => p.type === 'minute')?.value);
  const mins = hour * 60 + minute;
  return mins >= 8 * 60 && mins <= 20 * 60 + 30;
}

export function renderTemplate(template: string, lead: FbLead): string {
  const firstName = (lead.name.split(/\s+/)[0] || 'there').trim() || 'there';
  return template.replace(/\{firstName\}/g, firstName).replace(/\{fullName\}/g, lead.name || 'there');
}

export const DEFAULT_TEMPLATE =
  'Hi {firstName}, this is Hanson Home \u2014 thanks for your heat pump quote request! ' +
  'When is a good time for a quick 5-minute call about options and pricing for your home? ' +
  'Reply with a time that works, or call/text us here anytime. Reply STOP to opt out.';

// How far back a lead can be and still get a text. Anything older when first
// seen (e.g. rows that pre-date this feature) is recorded as skipped so the
// ledger stays complete without texting stale leads.
const MAX_LEAD_AGE_MS = 24 * 60 * 60 * 1000;

interface RcToken { accessToken: string; expiresAt: number }

export class RingCentralSms {
  private token: RcToken | null = null;
  constructor(private cfg: Pick<FbLeadSmsConfig, 'clientId' | 'clientSecret' | 'jwt' | 'from' | 'serverUrl'>) {}

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt - 60_000) return this.token.accessToken;
    const basic = Buffer.from(`${this.cfg.clientId}:${this.cfg.clientSecret}`).toString('base64');
    const res = await fetch(`${this.cfg.serverUrl}/restapi/oauth/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: this.cfg.jwt,
      }),
    });
    if (!res.ok) throw new Error(`RingCentral auth failed: ${res.status} ${await res.text()}`);
    const data = await res.json() as { access_token: string; expires_in: number };
    this.token = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return this.token.accessToken;
  }

  async send(to: string, text: string): Promise<void> {
    const token = await this.getToken();
    const res = await fetch(`${this.cfg.serverUrl}/restapi/v1.0/account/~/extension/~/sms`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: { phoneNumber: this.cfg.from }, to: [{ phoneNumber: to }], text }),
    });
    if (!res.ok) throw new Error(`RingCentral SMS failed: ${res.status} ${await res.text()}`);
  }
}

export interface FbLeadSmsDeps {
  fetchText: (url: string) => Promise<string>;
  sendSms: (to: string, text: string) => Promise<void>;
  prisma: Pick<PrismaClient, '$queryRawUnsafe' | '$executeRawUnsafe'> & {
    fbLeadSms: {
      findUnique(args: { where: { id: string } }): Promise<unknown | null>;
      create(args: { data: Record<string, unknown> }): Promise<unknown>;
      update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
    };
  };
  now?: () => Date;
}

export class FbLeadSmsPoller {
  private timer: NodeJS.Timeout | null = null;
  constructor(
    private cfg: Pick<FbLeadSmsConfig, 'sheetId' | 'knownGids' | 'template'>,
    private deps: FbLeadSmsDeps,
  ) {}

  start(intervalMs = 90_000): void {
    const run = () => this.poll().catch(err => console.error('FB lead SMS poll failed:', err?.message || err));
    this.ensureTable()
      .then(run)
      .catch(err => console.error('FB lead SMS ledger init failed; auto-SMS disabled:', err?.message || err));
    this.timer = setInterval(run, intervalMs);
    this.timer.unref?.();
  }

  // The production database predates Prisma migration history (see
  // docs/production-deployment.md), so additive DDL ships with the service.
  // Mirrors prisma/sql/20261007-fb-lead-sms.sql.
  private async ensureTable(): Promise<void> {
    await this.deps.prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "FbLeadSms" (
      "id" TEXT PRIMARY KEY,
      "phone" TEXT NOT NULL,
      "name" TEXT,
      "leadCreatedAt" TIMESTAMP(3) NOT NULL,
      "status" TEXT NOT NULL,
      "sentAt" TIMESTAMP(3),
      "error" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  // Tabs can appear over time; merge the configured list with whatever gids
  // the sheet's public htmlview mentions.
  private async discoverGids(): Promise<string[]> {
    const gids = new Set(this.cfg.knownGids);
    try {
      const html = await this.deps.fetchText(`https://docs.google.com/spreadsheets/d/${this.cfg.sheetId}/htmlview`);
      for (const m of html.matchAll(/gid[=":]+?(\d{1,12})/g)) if (m[1] !== '0') gids.add(m[1]);
    } catch { /* discovery is best-effort; the known tabs still get polled */ }
    return [...gids];
  }

  async poll(): Promise<void> {
    const now = this.deps.now ? this.deps.now() : new Date();
    const leads: FbLead[] = [];
    for (const gid of await this.discoverGids()) {
      try {
        const csv = await this.deps.fetchText(
          `https://docs.google.com/spreadsheets/d/${this.cfg.sheetId}/export?format=csv&gid=${gid}`,
        );
        if (csv.trimStart().startsWith('<')) continue; // HTML error page, not CSV
        leads.push(...extractLeads(csv));
      } catch { /* a single unreadable tab shouldn't stop the others */ }
    }
    for (const lead of leads) {
      const existing = await this.deps.prisma.fbLeadSms.findUnique({ where: { id: lead.id } });
      if (existing) continue;
      if (now.getTime() - lead.createdTime.getTime() > MAX_LEAD_AGE_MS) {
        await this.deps.prisma.fbLeadSms.create({ data: {
          id: lead.id, phone: lead.phone, name: lead.name, leadCreatedAt: lead.createdTime, status: 'skipped_backlog',
        } });
        continue;
      }
      if (!withinSendWindow(now)) continue; // stays unrecorded; retried when the window opens
      const text = renderTemplate(this.cfg.template, lead);
      try {
        await this.deps.sendSms(lead.phone, text);
        await this.deps.prisma.fbLeadSms.create({ data: {
          id: lead.id, phone: lead.phone, name: lead.name, leadCreatedAt: lead.createdTime, status: 'sent', sentAt: now,
        } });
        console.log(`FB lead SMS sent to ${lead.name} (${lead.phone})`);
      } catch (err: any) {
        await this.deps.prisma.fbLeadSms.create({ data: {
          id: lead.id, phone: lead.phone, name: lead.name, leadCreatedAt: lead.createdTime, status: 'failed', error: String(err?.message || err).slice(0, 500),
        } }).catch(() => undefined);
        console.error(`FB lead SMS to ${lead.phone} failed:`, err?.message || err);
      }
    }
  }
}

export function createFbLeadSms(prisma: FbLeadSmsDeps['prisma']): FbLeadSmsPoller | null {
  const clientId = process.env.RC_CLIENT_ID;
  const clientSecret = process.env.RC_CLIENT_SECRET;
  const jwt = process.env.RC_JWT;
  const sheetId = process.env.FB_LEADS_SHEET_ID;
  if (!clientId || !clientSecret || !jwt || !sheetId) return null;
  const sms = new RingCentralSms({
    clientId,
    clientSecret,
    jwt,
    from: process.env.RC_SMS_FROM || '+13399994516',
    serverUrl: process.env.RC_SERVER_URL || 'https://platform.ringcentral.com',
  });
  return new FbLeadSmsPoller(
    {
      sheetId,
      knownGids: (process.env.FB_LEADS_SHEET_GIDS || '516229175,7226798,1364994244').split(',').map(s => s.trim()).filter(Boolean),
      template: process.env.FB_LEAD_SMS_TEMPLATE || DEFAULT_TEMPLATE,
    },
    {
      fetchText: async url => {
        const res = await fetch(url, { redirect: 'follow' });
        if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
        return res.text();
      },
      sendSms: (to, text) => sms.send(to, text),
      prisma,
    },
  );
}
