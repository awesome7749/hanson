import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { PropertyData, HVACPrediction, ActualHVACData, ComparisonResult, TestResults } from '../types';

// Load environment variables
dotenv.config();

const API_BASE_URL = `http://localhost:${process.env.PORT || 3001}/api`;
const TSV_FILE_PATH = path.join(__dirname, '../../../my-app/2025 ToC Summary.tsv');
const RESULTS_DIR = path.join(__dirname, '../../results');

interface TsvRow {
  Location: string;
  '#of ODU': string;
  'Type of ODU': string;
  'ODU size': string;
  '# of IDU': string;
  'Type of IDU': string;
  'IDU size': string;
  'Electrical Work': string;
  'HVAC Work': string;
  Rebate: string;
  'Closed Price': string;
}

// Parse TSV file
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
    
    // Skip example row or invalid rows
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

// Compare predicted vs actual
function compareHVAC(predicted: HVACPrediction, actual: ActualHVACData): { matchType: string; details: string } {
  const details: string[] = [];
  
  // Check ODU count
  const oduMatch = predicted.numberOfODU === actual.numberOfODU;
  details.push(`ODU Count: ${predicted.numberOfODU} vs ${actual.numberOfODU} ${oduMatch ? '✓' : '✗'}`);
  
  // Check ODU type
  const oduTypeMatch = predicted.typeOfODU.toLowerCase() === actual.typeOfODU.toLowerCase();
  details.push(`ODU Type: ${predicted.typeOfODU} vs ${actual.typeOfODU} ${oduTypeMatch ? '✓' : '✗'}`);
  
  // Check ODU size
  const oduSizeMatch = predicted.oduSize === actual.oduSize;
  details.push(`ODU Size: ${predicted.oduSize} vs ${actual.oduSize} ${oduSizeMatch ? '✓' : '✗'}`);
  
  // Check IDU count
  const iduMatch = predicted.numberOfIDU === actual.numberOfIDU;
  details.push(`IDU Count: ${predicted.numberOfIDU} vs ${actual.numberOfIDU} ${iduMatch ? '✓' : '✗'}`);
  
  // Check IDU type
  const iduTypeMatch = predicted.typeOfIDU.toLowerCase() === actual.typeOfIDU.toLowerCase();
  details.push(`IDU Type: ${predicted.typeOfIDU} vs ${actual.typeOfIDU} ${iduTypeMatch ? '✓' : '✗'}`);
  
  // Check IDU size
  const iduSizeMatch = predicted.iduSize === actual.iduSize;
  details.push(`IDU Size: ${predicted.iduSize} vs ${actual.iduSize} ${iduSizeMatch ? '✓' : '✗'}`);

  // Determine match type
  if (oduMatch && oduTypeMatch && oduSizeMatch && iduMatch && iduTypeMatch && iduSizeMatch) {
    return { matchType: 'exact', details: details.join(' | ') };
  }
  
  if (oduMatch && iduMatch && oduTypeMatch && iduTypeMatch) {
    // Counts and types match, but sizes might be slightly off
    return { matchType: 'close', details: details.join(' | ') };
  }
  
  if (oduTypeMatch && iduTypeMatch) {
    // Types match but counts/sizes are off
    return { matchType: 'directional', details: details.join(' | ') };
  }
  
  return { matchType: 'incorrect', details: details.join(' | ') };
}

// Test a single address
async function testAddress(actual: ActualHVACData): Promise<ComparisonResult> {
  console.log(`\n📍 Testing: ${actual.location}`);
  
  try {
    // Step 1: Get property data
    console.log('  Fetching property data...');
    const propertyResponse = await axios.post(`${API_BASE_URL}/rentcast`, {
      address: actual.location,
    });
    const propertyData: PropertyData = propertyResponse.data;
    console.log(`  ✓ Property: ${propertyData.squareFootage || 'N/A'} sq ft, ${propertyData.bedrooms || 'N/A'} bed, ${propertyData.bathrooms || 'N/A'} bath`);

    // Step 2: Predict HVAC
    console.log('  Predicting HVAC...');
    const predictionResponse = await axios.post(`${API_BASE_URL}/predict-hvac`, propertyData);
    const prediction: HVACPrediction = predictionResponse.data;
    console.log(`  ✓ Prediction: ${prediction.numberOfODU} ODU (${prediction.typeOfODU}, ${prediction.oduSize}), ${prediction.numberOfIDU} IDU (${prediction.typeOfIDU}, ${prediction.iduSize})`);

    // Step 3: Compare
    const comparison = compareHVAC(prediction, actual);
    console.log(`  ${comparison.matchType === 'exact' ? '🎯' : comparison.matchType === 'close' ? '✓' : comparison.matchType === 'directional' ? '→' : '✗'} Match Type: ${comparison.matchType.toUpperCase()}`);

    return {
      address: actual.location,
      actual,
      predicted: prediction,
      propertyData,
      matchType: comparison.matchType as any,
      details: comparison.details,
    };
  } catch (error) {
    console.error(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Return a failed comparison
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

// Main test function
async function runTests(limit?: number) {
  console.log('🚀 Starting HVAC Prediction Tests\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`TSV File: ${TSV_FILE_PATH}\n`);

  // Check if server is running
  try {
    await axios.get(`${API_BASE_URL}/health`);
    console.log('✓ Server is running\n');
  } catch (error) {
    console.error('✗ Server is not running. Please start the server first with: npm run dev');
    process.exit(1);
  }

  // Parse TSV
  const actualData = parseTsv(TSV_FILE_PATH);
  console.log(`📊 Found ${actualData.length} addresses in TSV file`);
  
  const testData = limit ? actualData.slice(0, limit) : actualData;
  console.log(`🎯 Testing ${testData.length} addresses\n`);
  console.log('=' .repeat(80));

  // Run tests
  const comparisons: ComparisonResult[] = [];
  
  for (const actual of testData) {
    const result = await testAddress(actual);
    comparisons.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Calculate results
  const exactMatches = comparisons.filter(c => c.matchType === 'exact').length;
  const closeMatches = comparisons.filter(c => c.matchType === 'close').length;
  const directionalMatches = comparisons.filter(c => c.matchType === 'directional').length;
  const incorrectMatches = comparisons.filter(c => c.matchType === 'incorrect').length;

  const results: TestResults = {
    totalTests: comparisons.length,
    exactMatches,
    closeMatches,
    directionalMatches,
    incorrectMatches,
    accuracyRate: ((exactMatches + closeMatches) / comparisons.length) * 100,
    comparisons,
    timestamp: new Date().toISOString(),
  };

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`🎯 Exact Matches: ${exactMatches} (${(exactMatches / results.totalTests * 100).toFixed(1)}%)`);
  console.log(`✓ Close Matches: ${closeMatches} (${(closeMatches / results.totalTests * 100).toFixed(1)}%)`);
  console.log(`→ Directional: ${directionalMatches} (${(directionalMatches / results.totalTests * 100).toFixed(1)}%)`);
  console.log(`✗ Incorrect: ${incorrectMatches} (${(incorrectMatches / results.totalTests * 100).toFixed(1)}%)`);
  console.log(`\n📈 Overall Accuracy (Exact + Close): ${results.accuracyRate.toFixed(1)}%`);

  // Save results
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(RESULTS_DIR, `test-results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  
  console.log('\n✅ Tests completed!');
}

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

// Run tests
runTests(limit).catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});
