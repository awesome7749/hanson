/**
 * Compare deterministic calculator output against real job data.
 * Uses property data (sqft, bedrooms, heating type) as inputs.
 * Does NOT peek at actual installed equipment before running calculator.
 */
import { calculateQuote, QuoteResult } from '../services/quoteCalculatorService';

// Real cases extracted from test-results JSON (property data + actuals)
interface RealCase {
  address: string;
  sqft: number;
  bedrooms: number;
  heatingType?: string;
  actual: {
    numberOfODU: number;
    typeOfODU: string;
    oduSize: string;
    numberOfIDU: number;
    typeOfIDU: string;
    iduSize: string;
    electricalWork: number;
    hvacWork: number;
    rebate: number;
  };
}

const cases: RealCase[] = [
  { address: "28 Madison Ave, Newton", sqft: 1500, bedrooms: 3, actual: { numberOfODU: 1, typeOfODU: "Multi", oduSize: "42", numberOfIDU: 4, typeOfIDU: "Head", iduSize: "12,9,9,9", electricalWork: 800, hvacWork: 4000, rebate: 250 }},
  { address: "8 Porter Ln, Lexington", sqft: 6068, bedrooms: 6, heatingType: "Forced Air", actual: { numberOfODU: 1, typeOfODU: "Duct", oduSize: "36", numberOfIDU: 1, typeOfIDU: "AHU", iduSize: "36", electricalWork: 1500, hvacWork: 3800, rebate: 500 }},
  { address: "14 Hillside Ave, Winchester", sqft: 2605, bedrooms: 3, heatingType: "Hot Water", actual: { numberOfODU: 2, typeOfODU: "Duct", oduSize: "60+36", numberOfIDU: 2, typeOfIDU: "AHU", iduSize: "60+36", electricalWork: 1600, hvacWork: 17565.06, rebate: 500 }},
  { address: "14 Newman St #2, Revere", sqft: 1200, bedrooms: 3, actual: { numberOfODU: 2, typeOfODU: "Multi+Single", oduSize: "27+12", numberOfIDU: 4, typeOfIDU: "Head", iduSize: "12,9,9,9", electricalWork: 1800, hvacWork: 4000, rebate: 500 }},
  { address: "875 Liberty St, Rockland", sqft: 1536, bedrooms: 3, heatingType: "Hot Water", actual: { numberOfODU: 2, typeOfODU: "Multi", oduSize: "36+27", numberOfIDU: 7, typeOfIDU: "Head", iduSize: "12,12,9,9,9,9,9", electricalWork: 0, hvacWork: 7000, rebate: 500 }},
  { address: "15 Oakwood Pl, Lynn", sqft: 931, bedrooms: 3, heatingType: "Steam", actual: { numberOfODU: 1, typeOfODU: "Multi", oduSize: "42", numberOfIDU: 4, typeOfIDU: "Head", iduSize: "12,9,9,9", electricalWork: 800, hvacWork: 4000, rebate: 500 }},
  { address: "11 Parker St, Westwood", sqft: 1736, bedrooms: 3, heatingType: "Hot Water", actual: { numberOfODU: 2, typeOfODU: "Multi", oduSize: "36+27", numberOfIDU: 7, typeOfIDU: "Head", iduSize: "18,9,9,9,9,9,9", electricalWork: 0, hvacWork: 7000, rebate: 0 }},
  { address: "19 Knox Ave, Framingham", sqft: 1296, bedrooms: 3, heatingType: "Forced Air", actual: { numberOfODU: 1, typeOfODU: "Multi", oduSize: "42", numberOfIDU: 5, typeOfIDU: "Head", iduSize: "12,9,9,9,9", electricalWork: 1050, hvacWork: 5000, rebate: 250 }},
  { address: "101 Union St, Gardner", sqft: 2264, bedrooms: 3, heatingType: "Hot Water", actual: { numberOfODU: 2, typeOfODU: "Multi", oduSize: "27+18", numberOfIDU: 5, typeOfIDU: "Head", iduSize: "12,12,9,9,9", electricalWork: 1600, hvacWork: 5000, rebate: 250 }},
  { address: "124 Westford St, Lowell", sqft: 3285, bedrooms: 5, heatingType: "Hot Water", actual: { numberOfODU: 2, typeOfODU: "Multi+Single", oduSize: "36+9", numberOfIDU: 4, typeOfIDU: "Head", iduSize: "12,12,9,9", electricalWork: 0, hvacWork: 4000, rebate: 0 }},
  { address: "109 Milk St, Methuen", sqft: 2749, bedrooms: 4, heatingType: "Forced Air", actual: { numberOfODU: 1, typeOfODU: "Duct", oduSize: "48", numberOfIDU: 1, typeOfIDU: "AHU", iduSize: "48", electricalWork: 1000, hvacWork: 3800, rebate: 0 }},
  { address: "68 Harding Rd, Lexington", sqft: 1544, bedrooms: 3, heatingType: "Hot Water", actual: { numberOfODU: 2, typeOfODU: "Multi", oduSize: "27+27", numberOfIDU: 6, typeOfIDU: "Head", iduSize: "12,12,9,9,9,9", electricalWork: 1600, hvacWork: 6000, rebate: 0 }},
  { address: "22 9th St #707, Medford", sqft: 1180, bedrooms: 2, heatingType: "Baseboard", actual: { numberOfODU: 1, typeOfODU: "Duct", oduSize: "36", numberOfIDU: 1, typeOfIDU: "AHU", iduSize: "36", electricalWork: 1000, hvacWork: 3800, rebate: 0 }},
  { address: "11 Linnaean St, Cambridge", sqft: 4713, bedrooms: 6, heatingType: "Hot Water", actual: { numberOfODU: 2, typeOfODU: "Multi", oduSize: "36+27", numberOfIDU: 4, typeOfIDU: "Head", iduSize: "18,18,9,9", electricalWork: 0, hvacWork: 4600, rebate: 0 }},
  { address: "19 Independence Dr, Woburn", sqft: 1377, bedrooms: 3, heatingType: "Hot Water", actual: { numberOfODU: 1, typeOfODU: "Multi", oduSize: "36", numberOfIDU: 3, typeOfIDU: "Head", iduSize: "18,9,9", electricalWork: 0, hvacWork: 2700, rebate: 500 }},
  { address: "37 Westdale Ave, Wilmington", sqft: 1196, bedrooms: 3, heatingType: "Hot Water", actual: { numberOfODU: 1, typeOfODU: "Multi", oduSize: "27", numberOfIDU: 3, typeOfIDU: "Head", iduSize: "12,9,9", electricalWork: 800, hvacWork: 3000, rebate: 0 }},
  { address: "61 Cliffe Ave, Lexington", sqft: 1471, bedrooms: 3, heatingType: "Forced Air", actual: { numberOfODU: 1, typeOfODU: "Multi", oduSize: "42", numberOfIDU: 5, typeOfIDU: "Head", iduSize: "9,9,9,9,9", electricalWork: 0, hvacWork: 5000, rebate: 0 }},
  { address: "24 Douglas St, Weymouth", sqft: 3018, bedrooms: 3, heatingType: "Forced Air", actual: { numberOfODU: 1, typeOfODU: "Multi", oduSize: "42", numberOfIDU: 3, typeOfIDU: "Head", iduSize: "18,12,12", electricalWork: 1500, hvacWork: 3200, rebate: 0 }},
  { address: "30 Madison Ave, Newton", sqft: 1500, bedrooms: 3, actual: { numberOfODU: 1, typeOfODU: "Multi", oduSize: "42", numberOfIDU: 4, typeOfIDU: "Head", iduSize: "12,9,9,9", electricalWork: 800, hvacWork: 4000, rebate: 250 }},
  { address: "11 Buxton Ct, Andover", sqft: 2218, bedrooms: 4, heatingType: "Hot Water", actual: { numberOfODU: 1, typeOfODU: "Multi", oduSize: "42", numberOfIDU: 5, typeOfIDU: "Head", iduSize: "12,12,9,9,9", electricalWork: 0, hvacWork: 5000, rebate: 0 }},
];

function inferDuctwork(heatingType?: string): 'yes' | 'no' | 'not sure' {
  if (!heatingType) return 'not sure'; // defaults to mini-split
  if (heatingType === 'Forced Air') return 'yes';
  return 'no'; // Hot Water, Steam, Baseboard → no ductwork
}

function getOduSummary(quote: QuoteResult): string {
  return quote.oduAssignments.map(a => a.odu.btu / 1000).join('+');
}

function getIduSummary(quote: QuoteResult): string {
  const allIdus: number[] = [];
  for (const a of quote.oduAssignments) {
    for (const k of a.iduCombo) allIdus.push(k);
  }
  return allIdus.sort((a, b) => b - a).join(',');
}

function getSystemType(quote: QuoteResult): string {
  if (quote.systemType === 'ducted') return 'Duct';
  const numOdus = quote.oduAssignments.length;
  if (numOdus === 1) {
    return quote.oduAssignments[0].iduCombo.length === 1 ? 'Single' : 'Multi';
  }
  // Multiple ODUs
  const types = quote.oduAssignments.map(a => a.iduCombo.length === 1 ? 'Single' : 'Multi');
  const unique = [...new Set(types)];
  if (unique.length === 1) return unique[0];
  return 'Multi+Single';
}

console.log('='.repeat(120));
console.log('DETERMINISTIC CALCULATOR vs REAL JOB DATA');
console.log('='.repeat(120));
console.log('');

let totalCases = 0;
let systemTypeMatch = 0;
let oduCountMatch = 0;
let oduSizeMatch = 0;
let iduCountMatch = 0;
let iduSizeMatch = 0;
let totalBtuMatch = 0; // within 20%

for (const c of cases) {
  totalCases++;
  const ductwork = inferDuctwork(c.heatingType);
  const quote = calculateQuote(c.sqft, c.bedrooms, ductwork);

  const predType = getSystemType(quote);
  const predOduSize = getOduSummary(quote);
  const predIduSize = getIduSummary(quote);
  const predOduCount = quote.oduAssignments.length;
  const predIduCount = quote.oduAssignments.reduce((s, a) => s + a.iduCombo.length, 0);

  const actualIduSizes = c.actual.iduSize.split(',').map(s => parseInt(s.trim())).sort((a, b) => b - a);
  const predIduSizes = predIduSize.split(',').map(s => parseInt(s)).sort((a, b) => b - a);

  // Total BTU comparison
  const actualTotalBtu = actualIduSizes.reduce((s, v) => s + v, 0) * 1000;
  const predTotalBtu = predIduSizes.reduce((s, v) => s + v, 0) * 1000;
  const btuRatio = predTotalBtu / actualTotalBtu;

  const typeOk = predType === c.actual.typeOfODU;
  const oduCountOk = predOduCount === c.actual.numberOfODU;
  const oduSizeOk = predOduSize === c.actual.oduSize;
  const iduCountOk = predIduCount === c.actual.numberOfIDU;
  const iduSizeOk = predIduSize === actualIduSizes.join(',');
  const btuOk = btuRatio >= 0.8 && btuRatio <= 1.2;

  if (typeOk) systemTypeMatch++;
  if (oduCountOk) oduCountMatch++;
  if (oduSizeOk) oduSizeMatch++;
  if (iduCountOk) iduCountMatch++;
  if (iduSizeOk) iduSizeMatch++;
  if (btuOk) totalBtuMatch++;

  const mark = (ok: boolean) => ok ? '✓' : '✗';

  console.log(`${totalCases}. ${c.address} (${c.sqft} sqft, ${c.bedrooms}BR, ductwork=${ductwork})`);
  console.log(`   ACTUAL:    ${c.actual.typeOfODU} | ${c.actual.numberOfODU} ODU(${c.actual.oduSize}) | ${c.actual.numberOfIDU} IDU(${c.actual.iduSize}) | ${actualTotalBtu/1000}K BTU`);
  console.log(`   PREDICTED: ${predType} | ${predOduCount} ODU(${predOduSize}) | ${predIduCount} IDU(${predIduSize}) | ${predTotalBtu/1000}K BTU`);
  console.log(`   MATCH:     Type=${mark(typeOk)} ODU#=${mark(oduCountOk)} ODUSize=${mark(oduSizeOk)} IDU#=${mark(iduCountOk)} IDUSize=${mark(iduSizeOk)} BTU±20%=${mark(btuOk)}`);
  console.log('');
}

console.log('='.repeat(120));
console.log('SUMMARY');
console.log('='.repeat(120));
console.log(`Total cases:          ${totalCases}`);
console.log(`System type match:    ${systemTypeMatch}/${totalCases} (${(systemTypeMatch/totalCases*100).toFixed(0)}%)`);
console.log(`ODU count match:      ${oduCountMatch}/${totalCases} (${(oduCountMatch/totalCases*100).toFixed(0)}%)`);
console.log(`ODU size exact match: ${oduSizeMatch}/${totalCases} (${(oduSizeMatch/totalCases*100).toFixed(0)}%)`);
console.log(`IDU count match:      ${iduCountMatch}/${totalCases} (${(iduCountMatch/totalCases*100).toFixed(0)}%)`);
console.log(`IDU size exact match: ${iduSizeMatch}/${totalCases} (${(iduSizeMatch/totalCases*100).toFixed(0)}%)`);
console.log(`Total BTU ±20%:       ${totalBtuMatch}/${totalCases} (${(totalBtuMatch/totalCases*100).toFixed(0)}%)`);
