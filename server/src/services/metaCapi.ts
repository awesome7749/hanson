import { createHash } from 'crypto';

// Meta Conversions API: mirrors the browser pixel's Lead and
// CompleteRegistration events server-side, recovering conversions lost to
// browser blockers and iOS limits. event_id must match the browser fbq
// eventID so Meta can deduplicate. All personal fields are SHA-256 hashed.
// Disabled (returns null) unless META_CAPI_TOKEN is configured.

export interface CapiUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  zip?: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
}

export interface CapiEvent {
  eventName: 'Lead' | 'CompleteRegistration';
  eventId: string;
  sourceUrl?: string;
  contentName?: string;
  user: CapiUserData;
}

export interface MetaCapi {
  send(event: CapiEvent): Promise<void>;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

function hashedUserData(user: CapiUserData) {
  const digits = (user.phone || '').replace(/\D/g, '');
  const data: Record<string, unknown> = {};
  if (digits.length >= 10) data.ph = [sha256(digits.length === 10 ? `1${digits}` : digits)];
  if (user.email) data.em = [sha256(user.email.trim().toLowerCase())];
  if (user.firstName) data.fn = [sha256(user.firstName.trim().toLowerCase())];
  if (user.zip) data.zp = [sha256(user.zip.trim())];
  if (user.clientIp) data.client_ip_address = user.clientIp;
  if (user.userAgent) data.client_user_agent = user.userAgent;
  if (user.fbc) data.fbc = user.fbc;
  if (user.fbp) data.fbp = user.fbp;
  return data;
}

export function createMetaCapi(env: NodeJS.ProcessEnv = process.env): MetaCapi | null {
  const token = env.META_CAPI_TOKEN;
  if (!token) return null;
  const pixelId = env.META_PIXEL_ID || '28505388679095518';
  const endpoint = `https://graph.facebook.com/v21.0/${pixelId}/events`;
  return {
    async send(event: CapiEvent) {
      const body = {
        data: [{
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          event_source_url: event.sourceUrl || 'https://hansonhome.us/start',
          action_source: 'website',
          user_data: hashedUserData(event.user),
          ...(event.contentName ? { custom_data: { content_name: event.contentName } } : {}),
        }],
      };
      const response = await fetch(`${endpoint}?access_token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`Meta CAPI responded ${response.status}`);
    },
  };
}
