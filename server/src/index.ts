import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createApiRouter } from './routes/api';
import { RentCastService } from './services/rentcastService';
import { HVACPredictorService } from './services/hvacPredictorService';

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

if (!rentcastApiKey) {
  console.error('ERROR: RENTCAST_API_KEY is not configured in .env');
  process.exit(1);
}

if (!openaiApiKey) {
  console.error('ERROR: OPENAI_API_KEY is not configured in .env');
  process.exit(1);
}

const rentcastService = new RentCastService(rentcastApiKey);
const hvacPredictorService = new HVACPredictorService(openaiApiKey);

// Mount API routes
app.use('/api', createApiRouter(rentcastService, hvacPredictorService));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Hanson HVAC Prediction API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      rentcast: 'POST /api/rentcast',
      predictHvac: 'POST /api/predict-hvac',
      predictFromAddress: 'POST /api/predict-hvac-from-address',
    },
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Hanson HVAC Prediction API server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
