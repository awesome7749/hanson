import { Router, Request, Response } from 'express';
import { RentCastService } from '../services/rentcastService';
import { HVACPredictorService } from '../services/hvacPredictorService';
import { PropertyData, UserHints } from '../types';

export function createApiRouter(
  rentcastService: RentCastService,
  hvacPredictorService: HVACPredictorService
): Router {
  const router = Router();

  // POST /api/rentcast - Get property data from RentCast API
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

  // POST /api/predict-hvac - Predict HVAC configuration from property data
  // Accepts optional userHints: { hasExistingDuctwork?: boolean, numberOfRooms?: number }
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

  // POST /api/predict-hvac-from-address - Combined endpoint: fetch property data and predict HVAC
  router.post('/predict-hvac-from-address', async (req: Request, res: Response) => {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({ error: 'Address is required' });
      }

      // Step 1: Get property data
      const propertyData = await rentcastService.getPropertyData(address);

      // Step 2: Predict HVAC configuration
      const prediction = await hvacPredictorService.predictHVAC(propertyData);

      res.json({
        propertyData,
        prediction,
      });
    } catch (error) {
      console.error('Combined prediction error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to complete prediction',
      });
    }
  });

  // GET /api/health - Health check endpoint
  router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
}
