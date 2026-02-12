# Quick Start Guide

## 1️⃣ Add Your OpenAI API Key

Edit `server/.env` and add your OpenAI API key:

```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

## 2️⃣ Start the Server

```bash
cd server
npm run dev
```

You should see:
```
🚀 Hanson HVAC Prediction API server running on port 3001
📍 Health check: http://localhost:3001/api/health
```

## 3️⃣ Test with a Few Addresses

Open a **new terminal** and run:

```bash
cd server
npm run test:predictions -- --limit=5
```

This will test the first 5 addresses from your ToC Summary.

## 4️⃣ Review Results

Check the output in the terminal and the saved JSON in `server/results/`

## 5️⃣ Run Full Test

If the initial test looks good:

```bash
npm run test:predictions
```

This will test all 32 addresses.

## Example API Usage

### Test a single address:

```bash
curl -X POST http://localhost:3001/api/predict-hvac-from-address \
  -H "Content-Type: application/json" \
  -d '{"address": "28 Madison Ave, Newton, MA, 02460"}'
```

## Expected Timeline

- First 5 addresses: ~1-2 minutes
- All 32 addresses: ~8-10 minutes (with 1 second delay between calls)

Each test:
1. Fetches property data from RentCast (~1s)
2. Gets prediction from OpenAI (~2-3s)
3. Compares and logs results

## Troubleshooting

**"Server is not running"**
- Make sure you started the server in a separate terminal
- Check that port 3001 is available

**"OpenAI API key is not configured"**
- Add your actual OpenAI API key to `server/.env`
- Make sure there are no extra spaces or quotes

**"RentCast API Error"**
- The address format might not match RentCast's database
- Some addresses may not be found (this is normal)

## Success Metrics

You're looking for:
- ✅ **50%+ accuracy** (exact + close matches)
- 🎯 **Exact matches** = Perfect predictions
- ✓ **Close matches** = Right type and count, sizing slightly off
- → **Directional** = Right approach, wrong numbers
- ✗ **Incorrect** = Major mismatch

Good luck! 🚀
