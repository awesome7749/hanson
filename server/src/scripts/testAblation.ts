import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { PropertyData, HVACPrediction, ActualHVACData, ComparisonResult, TestResults, UserHints } from '../types';

dotenv.config();

const API_BASE_URL = `http://localhost:${process.env.PORT || 3001}/api`;
const TSV_FILE_PATH = path.join(__dirname, '../../../my-app/2025 ToC Summary.tsv');
const RESULTS_DIR = path.join(__dirname, '../../results');

// Define the 3 ablation test configurations
interface AblationConfig {
  name: string;
  description: string;
  getHints: (actual: ActualHVACData) => UserHints;
}

const ABLATION_CONFIGS: AblationConfig[] = [
  {
    name: 'ductwork-only',
    description: 'Providing only: whether the home has existing ductwork',
    getHints: (actual) => ({
      hasExistingDuctwork: actual.typeOfODU.toLowerCase().includes('duct'),
    }),
  },
  {
    name: 'rooms-only',
    description: 'Providing only: number of rooms/zones to heat and cool',
    getHints: (actual) => ({
      numberOfRooms: actual.numberOfIDU,
    }),
  },
  {
    name: 'ductwork-and-rooms',
    description: 'Providing both: ductwork info AND number of rooms',
    getHints: (actual) => ({
      hasExistingDuctwork: actual.typeOfODU.toLowerCase().includes('duct'),
      numberOfRooms: actual.numberOfIDU,
    }),
  },
];

// Parse TSV file (same logic as testPredictions.ts)
function parseTsv(filePath: string): ActualHVACData[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('TSV file is empty or has no data rows');
  }

  const headers = lines[0].split('\t');
  const data: ActualHVACData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    if (values[0]?.toLowerCase().includes('example')) continue;
    if (values.length < headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.replace(/^"|"$/g, '').trim() || '';
    });

    data.push({
      location: row['Location'],
      numberOfODU: parseInt(row['#of ODU']) || 0,
      typeOfODU: row['Type of ODU'],
      oduSize: row['ODU size'],
      numberOfIDU: parseInt(row['# of IDU']) || 0,
      typeOfIDU: row['Type of IDU'],
      iduSize: row['IDU size'],
      electricalWork: parseFloat(row['Electrical Work']) || 0,
      hvacWork: parseFloat(row['HVAC Work'].replace('#', '0')) || 0,
      rebate: parseFloat(row['Rebate'].replace('#', '0')) || 0,
      closedPrice: row['Closed Price'],
    });
  }

  return data;
}

// Compare predicted vs actual (same logic as testPredictions.ts)
function compareHVAC(predicted: HVACPrediction, actual: ActualHVACData): { matchType: string; details: string } {
  const details: string[] = [];

  const oduMatch = predicted.numberOfODU === actual.numberOfODU;
  details.push(`ODU Count: ${predicted.numberOfODU} vs ${actual.numberOfODU} ${oduMatch ? '✓' : '✗'}`);

  const oduTypeMatch = predicted.typeOfODU.toLowerCase() === actual.typeOfODU.toLowerCase();
  details.push(`ODU Type: ${predicted.typeOfODU} vs ${actual.typeOfODU} ${oduTypeMatch ? '✓' : '✗'}`);

  const oduSizeMatch = predicted.oduSize === actual.oduSize;
  details.push(`ODU Size: ${predicted.oduSize} vs ${actual.oduSize} ${oduSizeMatch ? '✓' : '✗'}`);

  const iduMatch = predicted.numberOfIDU === actual.numberOfIDU;
  details.push(`IDU Count: ${predicted.numberOfIDU} vs ${actual.numberOfIDU} ${iduMatch ? '✓' : '✗'}`);

  const iduTypeMatch = predicted.typeOfIDU.toLowerCase() === actual.typeOfIDU.toLowerCase();
  details.push(`IDU Type: ${predicted.typeOfIDU} vs ${actual.typeOfIDU} ${iduTypeMatch ? '✓' : '✗'}`);

  const iduSizeMatch = predicted.iduSize === actual.iduSize;
  details.push(`IDU Size: ${predicted.iduSize} vs ${actual.iduSize} ${iduSizeMatch ? '✓' : '✗'}`);

  if (oduMatch && oduTypeMatch && oduSizeMatch && iduMatch && iduTypeMatch && iduSizeMatch) {
    return { matchType: 'exact', details: details.join(' | ') };
  }
  if (oduMatch && iduMatch && oduTypeMatch && iduTypeMatch) {
    return { matchType: 'close', details: details.join(' | ') };
  }
  if (oduTypeMatch && iduTypeMatch) {
    return { matchType: 'directional', details: details.join(' | ') };
  }
  return { matchType: 'incorrect', details: details.join(' | ') };
}

// Test a single address with user hints
async function testAddressWithHints(
  actual: ActualHVACData,
  hints: UserHints,
  cachedPropertyData?: PropertyData
): Promise<ComparisonResult> {
  try {
    // Use cached property data if available, otherwise fetch
    let propertyData: PropertyData;
    if (cachedPropertyData) {
      propertyData = cachedPropertyData;
    } else {
      const propertyResponse = await axios.post(`${API_BASE_URL}/rentcast`, {
        address: actual.location,
      });
      propertyData = propertyResponse.data;
    }

    // Predict HVAC with hints
    const predictionResponse = await axios.post(`${API_BASE_URL}/predict-hvac`, {
      ...propertyData,
      userHints: hints,
    });
    const prediction: HVACPrediction = predictionResponse.data;

    // Compare
    const comparison = compareHVAC(prediction, actual);

    return {
      address: actual.location,
      actual,
      predicted: prediction,
      propertyData,
      matchType: comparison.matchType as any,
      details: comparison.details,
    };
  } catch (error) {
    return {
      address: actual.location,
      actual,
      predicted: {
        numberOfODU: 0,
        typeOfODU: 'ERROR',
        oduSize: '0',
        numberOfIDU: 0,
        typeOfIDU: 'ERROR',
        iduSize: '0',
        confidence: 'low',
        reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      matchType: 'incorrect',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function summarizeResults(comparisons: ComparisonResult[]): TestResults {
  const exactMatches = comparisons.filter(c => c.matchType === 'exact').length;
  const closeMatches = comparisons.filter(c => c.matchType === 'close').length;
  const directionalMatches = comparisons.filter(c => c.matchType === 'directional').length;
  const incorrectMatches = comparisons.filter(c => c.matchType === 'incorrect').length;

  return {
    totalTests: comparisons.length,
    exactMatches,
    closeMatches,
    directionalMatches,
    incorrectMatches,
    accuracyRate: ((exactMatches + closeMatches) / comparisons.length) * 100,
    comparisons,
    timestamp: new Date().toISOString(),
  };
}

async function runAblationTests(limit?: number) {
  console.log('🔬 Starting HVAC Prediction Ablation Tests\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`TSV File: ${TSV_FILE_PATH}\n`);

  // Check server
  try {
    await axios.get(`${API_BASE_URL}/health`);
    console.log('✓ Server is running\n');
  } catch {
    console.error('✗ Server is not running. Please start the server first with: npm run dev');
    process.exit(1);
  }

  // Parse TSV
  const actualData = parseTsv(TSV_FILE_PATH);
  const testData = limit ? actualData.slice(0, limit) : actualData;
  console.log(`📊 Testing ${testData.length} addresses across ${ABLATION_CONFIGS.length} configurations\n`);

  // Step 1: Cache all property data first (to avoid redundant RentCast calls)
  console.log('📦 Caching property data from RentCast...');
  const propertyDataCache: Map<string, PropertyData> = new Map();

  for (const actual of testData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/rentcast`, { address: actual.location });
      propertyDataCache.set(actual.location, response.data);
      console.log(`  ✓ ${actual.location}`);
    } catch (error) {
      console.log(`  ✗ ${actual.location} - ${error instanceof Error ? error.message : 'Error'}`);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✓ Cached ${propertyDataCache.size}/${testData.length} properties\n`);

  // Step 2: Run each ablation config
  const allResults: Record<string, TestResults> = {};

  for (const config of ABLATION_CONFIGS) {
    console.log('='.repeat(80));
    console.log(`\n🧪 Test Pass: ${config.name}`);
    console.log(`   ${config.description}\n`);

    const comparisons: ComparisonResult[] = [];

    for (const actual of testData) {
      const cached = propertyDataCache.get(actual.location);
      if (!cached) {
        console.log(`  ⏭ Skipping ${actual.location} (no cached property data)`);
        continue;
      }

      const hints = config.getHints(actual);
      console.log(`  📍 ${actual.location} | hints: ${JSON.stringify(hints)}`);

      const result = await testAddressWithHints(actual, hints, cached);
      const icon = result.matchType === 'exact' ? '🎯' : result.matchType === 'close' ? '✓' : result.matchType === 'directional' ? '→' : '✗';
      console.log(`     ${icon} ${result.matchType.toUpperCase()} | ${result.details}`);

      comparisons.push(result);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const results = summarizeResults(comparisons);
    allResults[config.name] = results;

    console.log(`\n  📊 ${config.name} Results:`);
    console.log(`     Exact: ${results.exactMatches} | Close: ${results.closeMatches} | Directional: ${results.directionalMatches} | Incorrect: ${results.incorrectMatches}`);
    console.log(`     Accuracy (Exact+Close): ${results.accuracyRate.toFixed(1)}%\n`);
  }

  // Step 3: Print comparison summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 ABLATION TEST SUMMARY\n');
  console.log('Baseline (no hints):                   12.5% accuracy (from previous test)');
  console.log('-'.repeat(70));

  for (const config of ABLATION_CONFIGS) {
    const r = allResults[config.name];
    const pad = config.name.padEnd(35);
    console.log(`${pad} ${r.accuracyRate.toFixed(1)}% accuracy (${r.exactMatches} exact, ${r.closeMatches} close, ${r.directionalMatches} directional, ${r.incorrectMatches} incorrect)`);
  }

  // Step 4: Save all results
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(RESULTS_DIR, `ablation-results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify({
    baseline: { accuracyRate: 12.5, note: 'from test-results-2026-02-12' },
    ablationResults: allResults,
    summary: ABLATION_CONFIGS.map(c => ({
      name: c.name,
      description: c.description,
      accuracyRate: allResults[c.name].accuracyRate,
      exact: allResults[c.name].exactMatches,
      close: allResults[c.name].closeMatches,
      directional: allResults[c.name].directionalMatches,
      incorrect: allResults[c.name].incorrectMatches,
    })),
  }, null, 2));

  console.log(`\n💾 Results saved to: ${resultsFile}`);
  console.log('\n✅ Ablation tests completed!');
}

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

runAblationTests(limit).catch(error => {
  console.error('\n❌ Ablation test execution failed:', error);
  process.exit(1);
});
