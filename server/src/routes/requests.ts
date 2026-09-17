import type { VentrixService } from '../services/ventrixService';
import type { LeadNotifier } from '../services/leadNotifier';
import type { MetaCapi } from '../services/metaCapi';
import type { GoogleReviews } from '../services/googleReviews';
import type { ChatProvider } from '../services/chatService';
import { Router, Request } from 'express';
import { parseWebsiteRequest, parsePartialRequest, parseUtm, RequestConflictError, RequestValidationError } from '../services/websiteRequest';
import type { DatabaseService } from '../services/databaseService';

export interface LeadHooks {
  notifier?: LeadNotifier | null;
  capi?: MetaCapi | null;
  reviews?: GoogleReviews | null;
  chat?: ChatProvider | null;
}

function capiRequestContext(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || req.socket?.remoteAddress || undefined;
  const sourceUrl = typeof req.body?.sourceUrl === 'string' && req.body.sourceUrl.length <= 2000 ? req.body.sourceUrl : undefined;
  const fbp = typeof req.body?.fbp === 'string' && req.body.fbp.length <= 500 ? req.body.fbp : undefined;
  const fbc = typeof req.body?.fbc === 'string' && req.body.fbc.length <= 500 ? req.body.fbc : undefined;
  return { clientIp, userAgent: req.headers['user-agent'], sourceUrl, fbp, fbc };
}

export function createRequestsRouter(database: Pick<DatabaseService, 'createWebsiteRequest' | 'createPartialRequest'>, ventrix?: VentrixService, hooks: LeadHooks = {}) {
  const router = Router();

  // Step-one partial lead: name + phone + ZIP, saved before the form is done.
  router.post('/partial', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const draft = parsePartialRequest(req.body?.draft);
      const utm = parseUtm(req.body?.utm);
      const receipt = await database.createPartialRequest(draft, utm);
      if (receipt.created) {
        // Follow-up plumbing must never fail or delay the visitor's request.
        hooks.notifier?.partialLead({ leadId: receipt.id, draft, utm })
          .catch(() => console.error('Partial lead saved; notification email failed.'));
        const ctx = capiRequestContext(req);
        hooks.capi?.send({
          eventName: 'Lead', eventId: receipt.id, sourceUrl: ctx.sourceUrl, contentName: draft.intent,
          user: { phone: draft.phone, email: draft.email, firstName: draft.firstName, zip: draft.zip, clientIp: ctx.clientIp, userAgent: ctx.userAgent, fbc: ctx.fbc, fbp: ctx.fbp },
        }).catch(() => console.error('Partial lead saved; Meta CAPI Lead event failed.'));
      }
      res.status(201).json({ receipt: { id: receipt.id, createdAt: receipt.createdAt, status: receipt.status } });
    } catch (error) {
      if (error instanceof RequestValidationError) return res.status(400).json({ error: error.message });
      console.error('Partial lead could not be saved.');
      res.status(503).json({ error: 'We could not save your details. Please continue; you can try again later.' });
    }
  });

  router.post('/', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const draft = parseWebsiteRequest(req.body?.draft);
      const utm = parseUtm(req.body?.utm);
      // A tab opened before partner sharing was added can still run the old form.
      // Do not acknowledge a new live request while silently skipping delivery.
      if (ventrix && !draft.partnerConsent) {
        throw new RequestValidationError('This form has been updated. Refresh this page, then review the contact and sharing permission before sending. Your answers will be kept.');
      }
      const receipt = await database.createWebsiteRequest(draft, Boolean(ventrix), utm);
      if (ventrix && draft.partnerConsent) {
        try { await ventrix.deliver(receipt.id); }
        catch { console.error('Request saved; partner delivery needs staff review.'); }
      }
      const ctx = capiRequestContext(req);
      hooks.capi?.send({
        eventName: 'CompleteRegistration', eventId: `${receipt.id}-complete`, sourceUrl: ctx.sourceUrl, contentName: draft.intent,
        user: { phone: draft.phone, email: draft.email, firstName: draft.firstName, zip: draft.zip, clientIp: ctx.clientIp, userAgent: ctx.userAgent, fbc: ctx.fbc, fbp: ctx.fbp },
      }).catch(() => console.error('Request saved; Meta CAPI CompleteRegistration event failed.'));
      res.status(201).json({ receipt });
    } catch (error) {
      if (error instanceof RequestValidationError) return res.status(400).json({ error: error.message });
      if (error instanceof RequestConflictError) return res.status(409).json({ error: error.message });
      // Do not return or log database details, credentials or the submitted payload.
      console.error('Website request could not be saved.');
      res.status(503).json({ error: 'We could not save your request. Please try again; your answers are still here.' });
    }
  });
  return router;
}
