/**
 * Compare calculator predicted PRICE vs actual Closed Price from real job data.
 */
import { calculateQuote, QuoteResult } from '../services/quoteCalculatorService';

interface Case {
  address: string;
  sqft: number;
  bedrooms: number;
  ductwork: 'yes' | 'no' | 'not sure';
  actualClosedPrice: number;
  actual: { typeOfODU: string; numberOfODU: number; oduSize: string; numberOfIDU: number; iduSize: string; electricalWork: number; hvacWork: number };
}

// Cases with property data available (sqft/bedrooms from RentCast)
// Ductwork inferred from heatingType: Forced Air = yes, else = no, missing = not sure
const cases: Case[] = [
  { address: "28 Madison Ave, Newton", sqft: 1500, bedrooms: 3, ductwork: 'not sure', actualClosedPrice: 13317.50, actual: { typeOfODU: "Multi", numberOfODU: 1, oduSize: "42", numberOfIDU: 4, iduSize: "12,9,9,9", electricalWork: 800, hvacWork: 4000 }},
  { address: "8 Porter Ln, Lexington", sqft: 6068, bedrooms: 6, ductwork: 'yes', actualClosedPrice: 16222.31, actual: { typeOfODU: "Duct", numberOfODU: 1, oduSize: "36", numberOfIDU: 1, iduSize: "36", electricalWork: 1500, hvacWork: 3800 }},
  { address: "14 Hillside Ave, Winchester", sqft: 2605, bedrooms: 3, ductwork: 'no', actualClosedPrice: 35000, actual: { typeOfODU: "Duct", numberOfODU: 2, oduSize: "60+36", numberOfIDU: 2, iduSize: "60+36", electricalWork: 1600, hvacWork: 17565 }},
  { address: "14 Newman St #2, Revere", sqft: 1200, bedrooms: 3, ductwork: 'not sure', actualClosedPrice: 16350.56, actual: { typeOfODU: "Multi+Single", numberOfODU: 2, oduSize: "27+12", numberOfIDU: 4, iduSize: "12,9,9,9", electricalWork: 1800, hvacWork: 4000 }},
  { address: "875 Liberty St, Rockland", sqft: 1536, bedrooms: 3, ductwork: 'no', actualClosedPrice: 23522.19, actual: { typeOfODU: "Multi", numberOfODU: 2, oduSize: "36+27", numberOfIDU: 7, iduSize: "12,12,9,9,9,9,9", electricalWork: 0, hvacWork: 7000 }},
  { address: "15 Oakwood Pl, Lynn", sqft: 931, bedrooms: 3, ductwork: 'no', actualClosedPrice: 16867.69, actual: { typeOfODU: "Multi", numberOfODU: 1, oduSize: "42", numberOfIDU: 4, iduSize: "12,9,9,9", electricalWork: 800, hvacWork: 4000 }},
  { address: "11 Parker St, Westwood", sqft: 1736, bedrooms: 3, ductwork: 'no', actualClosedPrice: 20651.19, actual: { typeOfODU: "Multi", numberOfODU: 2, oduSize: "36+27", numberOfIDU: 7, iduSize: "18,9,9,9,9,9,9", electricalWork: 0, hvacWork: 7000 }},
  { address: "19 Knox Ave, Framingham", sqft: 1296, bedrooms: 3, ductwork: 'yes', actualClosedPrice: 16379.50, actual: { typeOfODU: "Multi", numberOfODU: 1, oduSize: "42", numberOfIDU: 5, iduSize: "12,9,9,9,9", electricalWork: 1050, hvacWork: 5000 }},
  { address: "101 Union St, Gardner", sqft: 2264, bedrooms: 3, ductwork: 'no', actualClosedPrice: 16372.50, actual: { typeOfODU: "Multi", numberOfODU: 2, oduSize: "27+18", numberOfIDU: 5, iduSize: "12,12,9,9,9", electricalWork: 1600, hvacWork: 5000 }},
  { address: "124 Westford St, Lowell", sqft: 3285, bedrooms: 5, ductwork: 'no', actualClosedPrice: 12697.44, actual: { typeOfODU: "Multi+Single", numberOfODU: 2, oduSize: "36+9", numberOfIDU: 4, iduSize: "12,12,9,9", electricalWork: 0, hvacWork: 4000 }},
  { address: "109 Milk St, Methuen", sqft: 2749, bedrooms: 4, ductwork: 'yes', actualClosedPrice: 12955.69, actual: { typeOfODU: "Duct", numberOfODU: 1, oduSize: "48", numberOfIDU: 1, iduSize: "48", electricalWork: 1000, hvacWork: 3800 }},
  { address: "68 Harding Rd, Lexington", sqft: 1544, bedrooms: 3, ductwork: 'no', actualClosedPrice: 21956.63, actual: { typeOfODU: "Multi", numberOfODU: 2, oduSize: "27+27", numberOfIDU: 6, iduSize: "12,12,9,9,9,9", electricalWork: 1600, hvacWork: 6000 }},
  { address: "22 9th St #707, Medford", sqft: 1180, bedrooms: 2, ductwork: 'no', actualClosedPrice: 9028.69, actual: { typeOfODU: "Duct", numberOfODU: 1, oduSize: "36", numberOfIDU: 1, iduSize: "36", electricalWork: 1000, hvacWork: 3800 }},
  { address: "11 Linnaean St, Cambridge", sqft: 4713, bedrooms: 6, ductwork: 'no', actualClosedPrice: 15973, actual: { typeOfODU: "Multi", numberOfODU: 2, oduSize: "36+27", numberOfIDU: 4, iduSize: "18,18,9,9", electricalWork: 0, hvacWork: 4600 }},
  { address: "19 Independence Dr, Woburn", sqft: 1377, bedrooms: 3, ductwork: 'no', actualClosedPrice: 10076.88, actual: { typeOfODU: "Multi", numberOfODU: 1, oduSize: "36", numberOfIDU: 3, iduSize: "18,9,9", electricalWork: 0, hvacWork: 2700 }},
  { address: "37 Westdale Ave, Wilmington", sqft: 1196, bedrooms: 3, ductwork: 'no', actualClosedPrice: 8513.87, actual: { typeOfODU: "Multi", numberOfODU: 1, oduSize: "27", numberOfIDU: 3, iduSize: "12,9,9", electricalWork: 800, hvacWork: 3000 }},
  { address: "61 Cliffe Ave, Lexington", sqft: 1471, bedrooms: 3, ductwork: 'yes', actualClosedPrice: 12868.74, actual: { typeOfODU: "Multi", numberOfODU: 1, oduSize: "42", numberOfIDU: 5, iduSize: "9,9,9,9,9", electricalWork: 0, hvacWork: 5000 }},
  { address: "24 Douglas St, Weymouth", sqft: 3018, bedrooms: 3, ductwork: 'yes', actualClosedPrice: 12818.94, actual: { typeOfODU: "Multi", numberOfODU: 1, oduSize: "42", numberOfIDU: 3, iduSize: "18,12,12", electricalWork: 1500, hvacWork: 3200 }},
  { address: "30 Madison Ave, Newton", sqft: 1500, bedrooms: 3, ductwork: 'not sure', actualClosedPrice: 13317.50, actual: { typeOfODU: "Multi", numberOfODU: 1, oduSize: "42", numberOfIDU: 4, iduSize: "12,9,9,9", electricalWork: 800, hvacWork: 4000 }},
  { address: "11 Buxton Ct, Andover", sqft: 2218, bedrooms: 4, ductwork: 'no', actualClosedPrice: 12215.42, actual: { typeOfODU: "Multi", numberOfODU: 1, oduSize: "42", numberOfIDU: 5, iduSize: "12,12,9,9,9", electricalWork: 0, hvacWork: 5000 }},
];

console.log('='.repeat(130));
console.log('PRICE COMPARISON: Calculator vs Actual Closed Price');
console.log('='.repeat(130));
console.log('');
console.log(
  'Case'.padEnd(4) +
  'Address'.padEnd(35) +
  'SqFt'.padStart(6) +
  'BR'.padStart(4) +
  'Duct'.padStart(6) +
  'Predicted$'.padStart(12) +
  'Actual$'.padStart(12) +
  'Diff$'.padStart(12) +
  'Diff%'.padStart(8) +
  '  Notes'
);
console.log('-'.repeat(130));

let totalPredicted = 0;
let totalActual = 0;
let withinTen = 0;
let withinTwenty = 0;
let withinThirty = 0;
let overCount = 0;
let underCount = 0;

for (let i = 0; i < cases.length; i++) {
  const c = cases[i];
  const quote = calculateQuote(c.sqft, c.bedrooms, c.ductwork);

  const predicted = quote.totalCost * 1.40;
  const actual = c.actualClosedPrice;
  const diff = predicted - actual;
  const diffPct = (diff / actual) * 100;

  totalPredicted += predicted;
  totalActual += actual;

  if (diff > 0) overCount++;
  else underCount++;

  const absPct = Math.abs(diffPct);
  if (absPct <= 10) withinTen++;
  if (absPct <= 20) withinTwenty++;
  if (absPct <= 30) withinThirty++;

  let notes = '';
  if (absPct <= 10) notes = '✓ CLOSE';
  else if (absPct <= 20) notes = '~ OK';
  else if (absPct <= 30) notes = '⚠ OFF';
  else notes = '✗ WAY OFF';

  console.log(
    `${(i + 1).toString().padEnd(4)}` +
    `${c.address.padEnd(35)}` +
    `${c.sqft.toString().padStart(6)}` +
    `${c.bedrooms.toString().padStart(4)}` +
    `${c.ductwork.padStart(6)}` +
    `${('$' + predicted.toFixed(0)).padStart(12)}` +
    `${('$' + actual.toFixed(0)).padStart(12)}` +
    `${((diff >= 0 ? '+$' : '-$') + Math.abs(diff).toFixed(0)).padStart(12)}` +
    `${((diff >= 0 ? '+' : '') + diffPct.toFixed(1) + '%').padStart(8)}` +
    `  ${notes}`
  );
}

const avgDiffPct = ((totalPredicted - totalActual) / totalActual) * 100;

console.log('-'.repeat(130));
console.log('');
console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Total cases:            ${cases.length}`);
console.log(`Avg predicted price:    $${(totalPredicted / cases.length).toFixed(0)}`);
console.log(`Avg actual price:       $${(totalActual / cases.length).toFixed(0)}`);
console.log(`Avg diff:               ${avgDiffPct >= 0 ? '+' : ''}${avgDiffPct.toFixed(1)}%`);
console.log(`Over-predicted:         ${overCount}/${cases.length}`);
console.log(`Under-predicted:        ${underCount}/${cases.length}`);
console.log(`Within ±10%:            ${withinTen}/${cases.length} (${(withinTen/cases.length*100).toFixed(0)}%)`);
console.log(`Within ±20%:            ${withinTwenty}/${cases.length} (${(withinTwenty/cases.length*100).toFixed(0)}%)`);
console.log(`Within ±30%:            ${withinThirty}/${cases.length} (${(withinThirty/cases.length*100).toFixed(0)}%)`);

// Show details for under-predicted cases
console.log('');
console.log('='.repeat(130));
console.log('UNDER-PREDICTED CASES (Detail)');
console.log('='.repeat(130));

for (let i = 0; i < cases.length; i++) {
  const c = cases[i];
  const quote = calculateQuote(c.sqft, c.bedrooms, c.ductwork);
  const predicted = quote.totalCost * 1.40;
  const actual = c.actualClosedPrice;
  const diff = predicted - actual;
  if (diff >= 0) continue;

  const diffPct = (diff / actual) * 100;
  const oduSize = quote.oduAssignments.map(a => a.odu.btu / 1000).join('+');
  const iduSizes = quote.oduAssignments.flatMap(a => a.iduCombo).sort((a, b) => b - a).join(',');
  const totalZones = quote.oduAssignments.flatMap(a => a.iduCombo).length;

  // Parse actual IDU from the TSV data
  const actualType = c.actual?.typeOfODU || '?';
  const actualOduSize = c.actual?.oduSize || '?';
  const actualIduSize = c.actual?.iduSize || '?';
  const actualOduCount = c.actual?.numberOfODU || 0;
  const actualIduCount = c.actual?.numberOfIDU || 0;

  console.log(`\n${i + 1}. ${c.address} — ${c.sqft} sqft, ${c.bedrooms}BR, ductwork=${c.ductwork}`);
  console.log(`   Predicted: $${predicted.toFixed(0)} | ${quote.systemType} | ${quote.oduAssignments.length} ODU(${oduSize}) | ${totalZones} IDU(${iduSizes})`);
  console.log(`   Actual:    $${actual.toFixed(0)} | ${actualType} | ${actualOduCount} ODU(${actualOduSize}) | ${actualIduCount} IDU(${actualIduSize})`);
  console.log(`   Diff:      ${diffPct.toFixed(1)}% ($${diff.toFixed(0)})`);
  console.log(`   Equip cost: $${quote.equipmentCost.toFixed(0)} | Labor: $${quote.laborCost} | Rebate: $${quote.rebate.toFixed(0)}`);

  // Why is it under?
  const reasons: string[] = [];
  if (actualIduCount > totalZones) reasons.push(`Real install has more zones (${actualIduCount} vs ${totalZones})`);
  if (actualOduCount > quote.oduAssignments.length) reasons.push(`Real install has more ODUs (${actualOduCount} vs ${quote.oduAssignments.length})`);
  if (quote.systemType === 'mini-split' && actualType === 'Duct') reasons.push('Predicted mini-split but actual was ducted');
  if (quote.systemType === 'ducted' && actualType !== 'Duct') reasons.push('Predicted ducted but actual was mini-split');
  if (reasons.length > 0) console.log(`   Likely cause: ${reasons.join('; ')}`);
}
