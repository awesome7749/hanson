import { randomUUID } from 'crypto';
import type { PartnerDelivery, PrismaClient } from '@prisma/client';

const ENDPOINT = 'https://erp.ventrixsupply.com/api/d2d/partner-portal/submit';
const CLAIM_WINDOW_MS = 60000;
export interface DeliveryStore {
  get(id: string): Promise<PartnerDelivery | null>;
  claim(row: PartnerDelivery, token: string): Promise<boolean>;
  finish(id: string, token: string, status: string, error: string | null, remoteId?: string): Promise<void>;
}
export class PrismaDeliveryStore implements DeliveryStore {
  constructor(private db: PrismaClient) {}
  get(id: string) { return this.db.partnerDelivery.findUnique({ where: { leadId: id } }); }
  async claim(row: PartnerDelivery, token: string) {
    const result = await this.db.partnerDelivery.updateMany({
      where: { leadId: row.leadId, status: row.status, updatedAt: row.updatedAt },
      data: { status: 'sending', claimToken: token, attempts: { increment: 1 }, lastAttemptAt: new Date(), lastError: null },
    });
    return result.count === 1;
  }
  async finish(id: string, token: string, status: string, error: string | null, remoteId?: string) {
    await this.db.partnerDelivery.updateMany({
      where: { leadId: id, claimToken: token },
      data: { status, lastError: error, claimToken: null, ...(remoteId ? { remoteId, sentAt: new Date() } : {}) },
    });
  }
}

export class VentrixService {
  constructor(private store: DeliveryStore, private apiKey: string, private transport: typeof fetch = fetch, private timeoutMs = 8000) {
    if (!apiKey.trim()) throw new Error('Ventrix secret is not configured.');
  }
  async deliver(id: string, options: { retry?: boolean; confirmDuplicateCheck?: boolean } = {}) {
    const row = await this.store.get(id);
    if (!row || row.status === 'sent') return row;
    if (row.status === 'sending' && row.lastAttemptAt && Date.now() - row.lastAttemptAt.getTime() < CLAIM_WINDOW_MS) return row;
    if (row.status !== 'pending' && !options.retry) return row;
    if (['sending', 'unknown'].includes(row.status) && !options.confirmDuplicateCheck) return row;
    const token = randomUUID();
    if (!await this.store.claim(row, token)) return this.store.get(id);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let status = 'unknown';
    let error: string | null = 'Delivery could not be confirmed. Check Ventrix before retrying to avoid a duplicate.';
    let remoteId: string | undefined;
    try {
      const response = await this.transport(ENDPOINT, {
        method: 'POST', redirect: 'error', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': this.apiKey },
        body: JSON.stringify(row.payload),
      });
      if (response.ok) {
        const body = await response.json() as { success?: boolean; id?: string };
        if (body.success === true && typeof body.id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(body.id)) {
          status = 'sent'; error = null; remoteId = body.id;
        }
      } else if ([400, 401, 403, 422, 429].includes(response.status)) {
        status = 'failed';
        error = response.status === 401 || response.status === 403
          ? 'Ventrix rejected access. Check the partner key and account before retrying.'
          : response.status === 429 ? 'Ventrix is limiting requests. Retry later.'
          : 'Ventrix rejected the request details. Review the request before retrying.';
      }
    } catch {
      // Fetch/HTTP errors can contain authentication headers or submitted data.
      // Persist only the safe outcome above; a timeout must not trigger blind retries.
    } finally { clearTimeout(timer); }
    await this.store.finish(id, token, status, error, remoteId);
    return this.store.get(id);
  }
}

export function deliverySummary(row: PartnerDelivery | null) {
  if (!row) return null;
  const stale = row.status === 'sending' && row.lastAttemptAt && Date.now() - row.lastAttemptAt.getTime() >= CLAIM_WINDOW_MS;
  return { status: stale ? 'unknown' : row.status, remoteId: row.remoteId, attempts: row.attempts, sentAt: row.sentAt, lastAttemptAt: row.lastAttemptAt, lastError: stale ? 'Delivery was interrupted. Check Ventrix before retrying.' : row.lastError };
}
