import { Router } from 'express';
import { parseWebsiteRequest, RequestConflictError, RequestValidationError } from '../services/websiteRequest';
import type { DatabaseService } from '../services/databaseService';

export function createRequestsRouter(database: Pick<DatabaseService, 'createWebsiteRequest'>) {
  const router = Router();
  router.post('/', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const draft = parseWebsiteRequest(req.body?.draft);
      const receipt = await database.createWebsiteRequest(draft);
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
