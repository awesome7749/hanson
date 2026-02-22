import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { RentCastService } from '../services/rentcastService';
import { HVACPredictorService } from '../services/hvacPredictorService';
import { DatabaseService } from '../services/databaseService';
import { StorageService } from '../services/storageService';
import { PropertyData, UserHints } from '../types';

// ─── Multer config: memory storage for GCS upload ───
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, HEIC, WebP) are allowed'));
    }
  },
});

// ─── Admin session tokens (in-memory, cleared on restart) ───
const adminTokens = new Set<string>();

export function createApiRouter(
  rentcastService: RentCastService,
  hvacPredictorService: HVACPredictorService,
  databaseService: DatabaseService,
  storageService: StorageService,
  adminPassword: string
): Router {
  const router = Router();

  // ─── Admin auth middleware ───
  // Accepts token via Authorization header or ?token= query param (for <img> tags)
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token || !adminTokens.has(token)) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // ────────────────────────────────────────────────
  // POST /api/leads — Create a new lead + fetch property data
  // ────────────────────────────────────────────────
  router.post('/leads', async (req: Request, res: Response) => {
    try {
      const { address, firstName, lastName, email, phone } = req.body;

      if (!address) {
        return res.status(400).json({ error: 'Address is required' });
      }

      // Create lead in DB
      const lead = await databaseService.createLead({
        addressRaw: address,
        firstName,
        lastName,
        email,
        phone,
      });

      // Fetch property data from RentCast
      let propertyData: PropertyData | null = null;
      try {
        propertyData = await rentcastService.getPropertyData(address);
        await databaseService.updateLead(lead.id, {
          formattedAddress: propertyData.formattedAddress,
          propertyData: propertyData as any,
          status: 'property_loaded',
        });
      } catch (rentcastError) {
        console.error('RentCast lookup failed:', rentcastError);
        // Lead is created but without property data — continue
      }

      // Return the full lead + property data
      const updatedLead = await databaseService.getLeadById(lead.id);
      res.json({ lead: updatedLead, propertyData });
    } catch (error) {
      console.error('Create lead error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create lead',
      });
    }
  });

  // ────────────────────────────────────────────────
  // PATCH /api/leads/:id — Update lead fields (survey, details, utilities)
  // ────────────────────────────────────────────────
  router.patch('/leads/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const allowedFields = [
        'firstName', 'lastName', 'email', 'phone',
        'hasAttic', 'basementType', 'hasDuctwork', 'numberOfFloors', 'corrections',
        'ownershipStatus', 'currentHeating', 'installationTimeline',
        'electricityProvider', 'gasProvider',
        'status',
        'adminNotes',
      ];

      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const lead = await databaseService.updateLead(id, updateData);
      res.json({ lead });
    } catch (error) {
      console.error('Update lead error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to update lead',
      });
    }
  });

  // ────────────────────────────────────────────────
  // POST /api/leads/:id/predict — Run HVAC prediction and save results
  // ────────────────────────────────────────────────
  router.post('/leads/:id/predict', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Fetch lead from DB to get propertyData and hasDuctwork
      const lead = await databaseService.getLeadById(id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const propertyData = lead.propertyData as PropertyData | null;
      if (!propertyData || !propertyData.formattedAddress) {
        return res.status(400).json({ error: 'Lead has no property data' });
      }

      const numberOfRooms = (propertyData.bedrooms || 3) + 2;
      const hasDuctwork = lead.hasDuctwork;
      const noDucts = hasDuctwork === 'no';

      const predictions: Array<{ variant: string; prediction: any }> = [];

      if (noDucts) {
        // Single prediction: ductless only
        const prediction = await hvacPredictorService.predictHVAC(propertyData, {
          hasExistingDuctwork: false,
          numberOfRooms,
        });
        predictions.push({ variant: 'ductless', prediction });
      } else {
        // Two predictions in parallel: ducted + ductless
        const [ducted, ductless] = await Promise.all([
          hvacPredictorService.predictHVAC(propertyData, {
            hasExistingDuctwork: true,
            numberOfRooms,
          }),
          hvacPredictorService.predictHVAC(propertyData, {
            hasExistingDuctwork: false,
            numberOfRooms,
          }),
        ]);
        predictions.push({ variant: 'ducted', prediction: ducted });
        predictions.push({ variant: 'ductless', prediction: ductless });
      }

      // Save predictions to DB
      const saved = await databaseService.savePredictions(id, predictions);

      // Update lead status
      await databaseService.updateLead(id, { status: 'quoted' });

      res.json({ predictions: saved });
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to predict HVAC',
      });
    }
  });

  // ────────────────────────────────────────────────
  // POST /api/leads/:id/photos — Upload a photo to GCS
  // ────────────────────────────────────────────────
  router.post('/leads/:id/photos', upload.single('photo'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { id } = req.params;
      const { photoKey } = req.body;

      if (!photoKey) {
        return res.status(400).json({ error: 'photoKey is required' });
      }

      // Upload to GCS
      const { gcsUrl, gcsPath } = await storageService.uploadPhoto(
        req.file.buffer,
        id,
        photoKey,
        req.file.mimetype
      );

      // Save record in DB
      const photo = await databaseService.savePhoto({
        leadId: id,
        photoKey,
        gcsUrl,
        gcsPath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.json({ success: true, photo });
    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to upload photo',
      });
    }
  });

  // ────────────────────────────────────────────────
  // POST /api/admin/login — Authenticate admin
  // ────────────────────────────────────────────────
  router.post('/admin/login', (req: Request, res: Response) => {
    const { password } = req.body;
    if (!password || password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    adminTokens.add(token);
    res.json({ token });
  });

  // ────────────────────────────────────────────────
  // GET /api/admin/leads — List all leads (admin view)
  // ────────────────────────────────────────────────
  router.get('/admin/leads', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const leads = await databaseService.getLeads();
      res.json({ leads });
    } catch (error) {
      console.error('Admin list error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch leads',
      });
    }
  });

  // ────────────────────────────────────────────────
  // GET /api/admin/leads/:id — Single lead detail (admin view)
  // ────────────────────────────────────────────────
  router.get('/admin/leads/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const lead = await databaseService.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      res.json({ lead });
    } catch (error) {
      console.error('Admin detail error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch lead',
      });
    }
  });

  // ────────────────────────────────────────────────
  // GET /api/admin/photos/:photoId — Proxy a photo from GCS (admin only)
  // ────────────────────────────────────────────────
  router.get('/admin/photos/:photoId', requireAdmin, async (req: Request, res: Response) => {
    try {
      const photo = await databaseService.getPhotoById(req.params.photoId);
      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      const stream = storageService.getReadStream(photo.gcsPath);
      res.set('Content-Type', photo.mimeType);
      res.set('Cache-Control', 'private, max-age=3600');
      stream.pipe(res);
      stream.on('error', () => {
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream photo' });
        }
      });
    } catch (error) {
      console.error('Photo proxy error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch photo',
      });
    }
  });

  // ────────────────────────────────────────────────
  // Legacy endpoints (kept for backward compatibility during transition)
  // ────────────────────────────────────────────────

  // POST /api/rentcast - Direct property lookup (used by tests)
  router.post('/rentcast', async (req: Request, res: Response) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ error: 'Address is required' });
      }
      const propertyData = await rentcastService.getPropertyData(address);
      res.json(propertyData);
    } catch (error) {
      console.error('RentCast API error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch property data',
      });
    }
  });

  // POST /api/predict-hvac - Direct HVAC prediction (used by tests)
  router.post('/predict-hvac', async (req: Request, res: Response) => {
    try {
      const { userHints, ...propertyData } = req.body as PropertyData & { userHints?: UserHints };
      if (!propertyData || !propertyData.formattedAddress) {
        return res.status(400).json({ error: 'Property data is required' });
      }
      const prediction = await hvacPredictorService.predictHVAC(propertyData, userHints);
      res.json(prediction);
    } catch (error) {
      console.error('HVAC prediction error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to predict HVAC configuration',
      });
    }
  });

  // GET /api/health - Health check
  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
}
