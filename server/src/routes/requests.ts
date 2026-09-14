import type { VentrixService } from '../services/ventrixService';
import { Router } from 'express';
import { parseWebsiteRequest, RequestConflictError, RequestValidationError } from '../services/websiteRequest';
import type { DatabaseService } from '../services/databaseService';

export function createRequestsRouter(database: Pick<DatabaseService, 'createWebsiteRequest'>, ventrix?: VentrixService) {
  const router = Router();
  router.post('/', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const draft = parseWebsiteRequest(req.body?.draft);
      // A tab opened before partner sharing was added can still run the old form.
      // Do not acknowledge a new live request while silently skipping delivery.
      if (ventrix && !draft.partnerConsent) {
        throw new RequestValidationError('This form has been updated. Refresh this page, then review the contact and sharing permission before sending. Your answers will be kept.');
      }
      const receipt = await database.createWebsiteRequest(draft, Boolean(ventrix));
      if (ventrix && draft.partnerConsent) {
        try { await ventrix.deliver(receipt.id); }
        catch { console.error('Request saved; partner delivery needs staff review.'); }
      }
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
