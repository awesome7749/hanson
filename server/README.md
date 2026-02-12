# Hanson HVAC Prediction Backend

Backend API service for predicting HVAC equipment configurations based on property data using OpenAI and RentCast APIs.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```
RENTCAST_API_KEY=your_rentcast_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

**Note:** RentCast API key is already configured. You need to add your OpenAI API key.

### 3. Build TypeScript

```bash
npm run build
```

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /api/health
```

### Get Property Data
```
POST /api/rentcast
Body: { "address": "123 Main St, Boston, MA 02101" }
```

### Predict HVAC Configuration
```
POST /api/predict-hvac
Body: { <PropertyData object> }
```

### Predict from Address (Combined)
```
POST /api/predict-hvac-from-address
Body: { "address": "123 Main St, Boston, MA 02101" }
```

## Testing Predictions

### Run Batch Test Script

The test script compares predictions against actual installations from the 2025 ToC Summary.

**Test all addresses:**
```bash
npm run test:predictions
```

**Test first 5 addresses only:**
```bash
npm run test:predictions -- --limit=5
```

**Test first 10 addresses:**
```bash
npm run test:predictions -- --limit=10
```

### Test Results

Results are saved to `server/results/test-results-{timestamp}.json` with:
- Individual comparisons (predicted vs actual)
- Match types: exact, close, directional, incorrect
- Overall accuracy metrics
- Detailed comparison for each address

### Example Test Output

```
📊 TEST RESULTS SUMMARY

Total Tests: 10
🎯 Exact Matches: 2 (20.0%)
✓ Close Matches: 5 (50.0%)
→ Directional: 2 (20.0%)
✗ Incorrect: 1 (10.0%)

📈 Overall Accuracy (Exact + Close): 70.0%
```

## Project Structure

```
server/
├── src/
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── services/
│   │   ├── rentcastService.ts    # RentCast API client
│   │   └── hvacPredictorService.ts # OpenAI prediction service
│   ├── prompts/
│   │   └── hvacPrompt.ts         # System prompt for HVAC sizing
│   ├── routes/
│   │   └── api.ts                # Express API routes
│   ├── scripts/
│   │   └── testPredictions.ts    # Batch testing script
│   └── index.ts                  # Main server entry point
├── dist/                         # Compiled JavaScript (generated)
├── results/                      # Test results (generated)
├── package.json
├── tsconfig.json
└── .env                          # Environment variables (not in git)
```

## Development Workflow

1. Make changes to TypeScript files in `src/`
2. Run `npm run dev` for development with auto-reload
3. Test API endpoints manually or with curl
4. Run `npm run test:predictions` to validate predictions

## Troubleshooting

### Server won't start
- Check that `.env` has valid API keys
- Verify port 3001 is not already in use
- Run `npm run build` to recompile TypeScript

### Test script fails
- Make sure server is running first (`npm run dev` in another terminal)
- Check that `my-app/2025 ToC Summary.tsv` exists
- Verify OpenAI API key has sufficient credits

### API errors
- Check server logs for detailed error messages
- Verify RentCast API key is valid
- Check OpenAI API rate limits

## Notes

- Frontend (`my-app/`) remains unchanged and uses its own RentCast integration
- This backend is standalone and can be used independently
- Test script calls backend APIs (not direct service calls)
- Results are saved for later analysis
