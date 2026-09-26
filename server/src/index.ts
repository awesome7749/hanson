import express from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { VentrixService, PrismaDeliveryStore } from './services/ventrixService';
import { createApiRouter } from './routes/api';
import { RentCastService } from './services/rentcastService';
import { HVACPredictorService } from './services/hvacPredictorService';
import { DatabaseService, prisma } from './services/databaseService';
import { StorageService } from './services/storageService';
import { createLeadNotifier } from './services/leadNotifier';
import { createMetaCapi } from './services/metaCapi';
import { createGoogleReviews } from './services/googleReviews';
import { createChatProvider } from './services/chatService';
import { apiAllowedOnHost, isOpsHost, opsPage, siteRoute } from './services/siteRouting';

// Load environment variables
dotenv.config();

const app = express();
// Cloud Run terminates TLS at its proxy; use the forwarded scheme and client IP.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// Middleware
app.disable('x-powered-by');
app.use(cors());
app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use(express.json());
app.use('/api', (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !apiAllowedOnHost(req.path, req.get('host'))) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  next();
});

// Initialize services
const rentcastApiKey = process.env.RENTCAST_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const gcsBucket = process.env.GCS_BUCKET;
const gcsProjectId = process.env.GCS_PROJECT_ID;

if (!rentcastApiKey) {
  console.error('ERROR: RENTCAST_API_KEY is not configured in .env');
  process.exit(1);
}

if (!openaiApiKey) {
  console.error('ERROR: OPENAI_API_KEY is not configured in .env');
  process.exit(1);
}

if (!gcsBucket || !gcsProjectId) {
  console.error('ERROR: GCS_BUCKET and GCS_PROJECT_ID are required in .env');
  process.exit(1);
}

const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) {
  console.error('ERROR: ADMIN_PASSWORD is required in .env');
  process.exit(1);
}

const rentcastService = new RentCastService(rentcastApiKey);
const hvacPredictorService = new HVACPredictorService(openaiApiKey);
const databaseService = new DatabaseService();
const storageService = new StorageService(gcsProjectId, gcsBucket);

const ventrix = process.env.VENTRIX_SUBMISSIONS_ENABLED === 'true'
  ? new VentrixService(new PrismaDeliveryStore(prisma), process.env.VENTRIX_API_KEY || '')
  : undefined;

// Optional lead plumbing: partial-lead email alerts (SMTP_* env vars) and
// Meta Conversions API (META_CAPI_TOKEN). Both no-op when unconfigured.
const leadNotifier = createLeadNotifier();
const metaCapi = createMetaCapi();
const googleReviews = createGoogleReviews();
const chatProvider = createChatProvider(leadNotifier);
if (!leadNotifier) console.log('Partial-lead email notifications disabled (SMTP_HOST/SMTP_USER/SMTP_PASS not set).');
if (!metaCapi) console.log('Meta Conversions API disabled (META_CAPI_TOKEN not set).');
if (!googleReviews) console.log('Google reviews disabled (GOOGLE_PLACES_API_KEY/GOOGLE_PLACE_ID not set).');

// Mount API routes
app.use('/api', createApiRouter(rentcastService, hvacPredictorService, databaseService, storageService, adminPassword, ventrix, { notifier: leadNotifier, capi: metaCapi, reviews: googleReviews, chat: chatProvider }));

app.use('/api', (_req, res) => { res.status(404).json({ error: 'Endpoint not found' }); });

// In production, serve the React build as static files
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, '../public');
  app.get('*', (req, res, next) => {
    if (isOpsHost(req.get('host'))) {
      res.set('X-Robots-Tag', 'noindex, nofollow');
      res.set('Referrer-Policy', 'no-referrer');
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
      const page = opsPage(req.path);
      if (page === 'dashboard') {
        res.set('Cache-Control', 'no-store');
        return res.sendFile(path.join(__dirname, '../ops-shell.html'));
      }
      if (page === 'robots') return res.type('text/plain').send('User-agent: *\nDisallow: /\n');
      if (page === 'missing') return res.status(404).send('Not found');
      return next();
    }
    if (/^\/(admin|staff)(\/|$)/.test(req.path)) {
      res.set('X-Robots-Tag', 'noindex, nofollow');
      return res.status(404).send('Not found');
    }
    const route = siteRoute(req.path);
    if (route.redirect) {
      const query = req.originalUrl.slice(req.path.length);
      return res.redirect(route.redirectStatus || 301, route.redirect + query);
    }
    if (route.appOnly) res.set('X-Robots-Tag', 'noindex, nofollow');
    next();
  });
  // extensions: pre-rendered town pages (build/woburn.html) answer /woburn.
  // HTML references hashed bundles, so it must not be cached.
  app.use(express.static(publicDir, {
    extensions: ['html'],
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  }));
  // The SPA handles only form and staff flows. Unknown URLs are real 404s.
  app.get('*', (req, res) => {
    if (isOpsHost(req.get('host'))) return res.status(404).send('Not found');
    res.set('Cache-Control', 'no-cache');
    if (!siteRoute(req.path).appOnly) {
      res.status(404);
      res.set('X-Robots-Tag', 'noindex, nofollow');
    }
    res.sendFile(path.join(publicDir, 'app-shell.html'));
  });
}

// Multer error handling
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 15MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
  next();
});

// Graceful shutdown — disconnect Prisma
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Hanson HVAC Prediction API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
