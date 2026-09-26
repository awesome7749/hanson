import nodemailer from 'nodemailer';
import type { PartialDraft, UtmParams } from './websiteRequest';

export interface PartialLeadNotice {
  leadId: string;
  draft: PartialDraft;
  utm: UtmParams;
}

export interface ChatLeadNotice {
  sessionId: string;
  phone: string;
  transcript: string;
}

export interface CompleteLeadNotice {
  leadId: string;
  intent: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  contactMethod: string;
  timeline: string;
  utm: UtmParams;
}

export interface LeadNotifier {
  partialLead(notice: PartialLeadNotice): Promise<void>;
  completeLead(notice: CompleteLeadNotice): Promise<void>;
  chatLead(notice: ChatLeadNotice): Promise<void>;
}

// Emails the team the moment a step-one partial lead lands, so someone can
// call back even if the visitor never finishes the form. Configured entirely
// through env vars; without SMTP credentials it is disabled (returns null).
export function createLeadNotifier(env: NodeJS.ProcessEnv = process.env): LeadNotifier | null {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const to = env.LEAD_NOTIFY_TO || 'info@hansonhome.us';
  const from = env.LEAD_NOTIFY_FROM || user;
  const transport = nodemailer.createTransport({
    host,
    port: Number(env.SMTP_PORT) || 587,
    secure: Number(env.SMTP_PORT) === 465,
    auth: { user, pass },
  });
  return {
    async partialLead({ leadId, draft, utm }: PartialLeadNotice) {
      const source = utm.utm_source ? `${utm.utm_source} / ${utm.utm_medium || '?'} / ${utm.utm_campaign || '?'}${utm.utm_content ? ` / ${utm.utm_content}` : ''}` : 'direct / unknown';
      await transport.sendMail({
        from,
        to,
        subject: `New partial lead: ${draft.firstName} ${draft.lastName} (${draft.phone})`,
        text: [
          'A visitor completed step 1 of the intake form. Call them even if they never finish.',
          '',
          `Name: ${draft.firstName} ${draft.lastName}`,
          `Phone: ${draft.phone}`,
          draft.email ? `Email: ${draft.email}` : 'Email: not provided',
          `ZIP: ${draft.zip}`,
          `Service: ${draft.intent === 'assessment' ? 'Energy assessment' : 'Heat-pump estimate'}`,
          `Source: ${source}`,
          '',
          `Lead reference: ${leadId}`,
        ].join('\n'),
      });
    },
    async completeLead({ leadId, intent, firstName, lastName, phone, email, address, contactMethod, timeline, utm }: CompleteLeadNotice) {
      const source = utm.utm_source ? `${utm.utm_source} / ${utm.utm_medium || '?'} / ${utm.utm_campaign || '?'}${utm.utm_content ? ` / ${utm.utm_content}` : ''}` : 'direct / unknown';
      await transport.sendMail({
        from,
        to,
        subject: `New quote request: ${firstName} ${lastName} (${phone})`,
        text: [
          `A ${intent === 'assessment' ? 'home energy assessment' : 'heat-pump quote'} request was completed on hansonhome.us.`,
          '',
          `Name: ${firstName} ${lastName}`,
          `Phone: ${phone}`,
          email ? `Email: ${email}` : 'Email: not provided',
          `Address: ${address}`,
          `Preferred contact: ${contactMethod}`,
          `Timeline: ${timeline}`,
          `Source: ${source}`,
          '',
          `Full details: https://hansonhome.us/admin`,
          `Lead reference: ${leadId}`,
        ].join('\n'),
      });
    },
    async chatLead({ sessionId, phone, transcript }: ChatLeadNotice) {
      await transport.sendMail({
        from,
        to,
        subject: `Website chat: visitor left phone ${phone}`,
        text: [
          'A website chat visitor left a phone number. Please follow up within 1 business day.',
          '',
          `Phone: ${phone}`,
          `Chat session: ${sessionId}`,
          '',
          'Transcript:',
          transcript,
        ].join('\n'),
      });
    },
  };
}
