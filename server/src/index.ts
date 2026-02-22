import express from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { createApiRouter } from './routes/api';
import { RentCastService } from './services/rentcastService';
import { HVACPredictorService } from './services/hvacPredictorService';
import { DatabaseService, prisma } from './services/databaseService';
import { StorageService } from './services/storageService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// Mount API routes
app.use('/api', createApiRouter(rentcastService, hvacPredictorService, databaseService, storageService, adminPassword));

// In production, serve the React build as static files
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, '../public');
  app.use(express.static(publicDir));
  // SPA fallback: any non-API route serves index.html (React Router handles it)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
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
