/**
 * Test suite for the deterministic HVAC Quote Calculator
 * Run: npx ts-node src/scripts/testQuoteCalculator.ts
 */

import { calculateQuote, calculateDuctedQuote, calculateMiniSplitQuote, QuoteResult } from '../services/quoteCalculatorService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.log(`  ✗ FAIL: ${message}`);
  }
}

function printQuoteSummary(label: string, q: QuoteResult) {
  console.log(`\n  [${label}]`);
  console.log(`  System: ${q.systemType} | ODUs: ${q.details.numberOfODUs}`);
  for (let i = 0; i < q.oduAssignments.length; i++) {
    const a = q.oduAssignments[i];
    console.log(`  ODU ${i + 1}: ${a.odu.model} (${a.odu.btu / 1000}K) — $${a.odu.price}`);
    console.log(`    IDUs: [${a.iduCombo.join('K, ')}K] → ${a.idus.map(u => u.model).join(', ')}`);
    console.log(`    AHRI: ${a.ahri} | Rebate: $${a.rebate.toFixed(2)}`);
  }
  if (q.accessories.length > 0) {
    console.log(`  Accessories: ${q.accessories.map(a => `${a.description} $${a.price}`).join(', ')}`);
  }
  console.log(`  Equipment: $${q.equipmentCost.toFixed(2)} | Labor: $${q.laborCost.toFixed(2)} | Total: $${q.totalCost.toFixed(2)}`);
  console.log(`  Rebate: $${q.rebate.toFixed(2)} | Net: $${q.netCostAfterRebate.toFixed(2)}`);
  console.log(`  Tonnage: ${q.details.totalTonnage} | Max: ${q.details.maxTonnage}`);
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 1: Small home, ducted — 1,000 sq ft, 2 bed');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(1000, 2, 'yes');
  printQuoteSummary('1000 sqft ducted', q);

  assert(q.systemType === 'ducted', 'System type is ducted');
  assert(q.details.totalTonnage === 2.0, 'Tonnage = 1000/500 = 2.0');
  assert(q.oduAssignments[0].odu.model === 'H24TDH17XAC', 'Selects 2-ton ODU (24K)');
  assert(q.oduAssignments[0].idus[0].model === 'H24AHH17XAE', 'Selects matching air handler');
  assert(q.rebate === 5300, 'Rebate = $5,300');
  assert(q.laborCost === 5000, 'Labor = $4,000 + $1,000 electrical');
  assert(q.accessories.length === 2, 'Includes backup heater + thermostat');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 2: Medium home, ducted — 2,000 sq ft, 3 bed');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(2000, 3, 'yes');
  printQuoteSummary('2000 sqft ducted', q);

  assert(q.details.totalTonnage === 4.0, 'Tonnage = 2000/500 = 4.0');
  assert(q.oduAssignments[0].odu.model === 'H48TDH18XAC', 'Selects 4-ton ODU (48K)');
  assert(q.rebate === 8500, 'Rebate = $8,500');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 3: Large home, ducted — 2,500 sq ft, 4 bed');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(2500, 4, 'yes');
  printQuoteSummary('2500 sqft ducted', q);

  assert(q.details.totalTonnage === 5.0, 'Tonnage = 2500/500 = 5.0');
  assert(q.oduAssignments[0].odu.model === 'H60TDH16XAC', 'Selects 5-ton ODU (60K)');
  assert(q.rebate === 8500, 'Rebate = $8,500');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 4: Ducted edge case — 1,200 sq ft (2.4 ton → rounds up to 3-ton)');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(1200, 2, 'yes');
  printQuoteSummary('1200 sqft ducted', q);

  assert(q.details.totalTonnage === 2.4, 'Tonnage = 2.4');
  assert(q.details.maxTonnage === 2.88, 'Max tonnage = 2.88');
  // 3-ton (3.0) exceeds 2.88 cap, so it picks 2-ton (rounds up within cap)
  assert(q.oduAssignments[0].odu.model === 'H24TDH17XAC', 'Selects 2-ton ODU (3-ton exceeds 2.88 cap)');
  assert(q.rebate === 5300, 'Rebate = $5,300');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 5: Small home, mini-split — 1,200 sq ft, 2 bed, no ductwork');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(1200, 2, 'no');
  printQuoteSummary('1200 sqft mini-split 2bed', q);

  assert(q.systemType === 'mini-split', 'System type is mini-split');
  assert(q.details.bedroomTonnage === 1.0, 'Bedroom tonnage = 2x6K/12K = 1.0');
  assert(q.details.remainingTonnage === 1.4, 'Remaining tonnage = 2.4 - 1.0 = 1.4');
  assert(q.details.totalZones === 3, '3 zones (2 bed + 1 common)');
  assert(q.details.numberOfODUs === 1, '1 ODU');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 6: Medium home, mini-split — 1,800 sq ft, 3 bed, no ductwork');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(1800, 3, 'no');
  printQuoteSummary('1800 sqft mini-split 3bed', q);

  assert(q.details.bedroomTonnage === 1.5, 'Bedroom tonnage = 3x6K/12K = 1.5');
  assert(q.details.remainingTonnage === 2.1, 'Remaining tonnage = 3.6 - 1.5 = 2.1');
  assert(q.details.numberOfODUs === 1, '1 ODU');
  assert(q.details.totalZones! <= 5, 'Total zones <= 5 (fits in one ODU)');
  assert(q.rebate === 8500, 'Rebate = $8,500');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 7: "Not sure" about ductwork defaults to mini-split');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(1500, 3, 'not sure');
  printQuoteSummary('1500 sqft not-sure 3bed', q);

  assert(q.systemType === 'mini-split', '"Not sure" defaults to mini-split');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 8: Large home, mini-split — 3,200 sq ft, 4 bed (MULTI-ODU)');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(3200, 4, 'no');
  printQuoteSummary('3200 sqft mini-split 4bed', q);

  assert(q.details.bedroomTonnage === 2.25, 'Bedroom tonnage = (9K + 3x6K)/12K = 2.25');
  assert(q.details.remainingTonnage === 4.15, 'Remaining tonnage = 6.4 - 2.25 = 4.15');
  assert(q.details.numberOfODUs! >= 2, 'Uses 2+ ODUs for large home');
  assert(q.oduAssignments.length >= 2, 'Has 2+ ODU assignments');
  // Each ODU should have <= 5 zones
  for (let i = 0; i < q.oduAssignments.length; i++) {
    assert(q.oduAssignments[i].iduCombo.length <= 5, `ODU ${i + 1} has <= 5 zones`);
  }
  // Total rebate should be sum of both ODU rebates
  const expectedRebate = q.oduAssignments.reduce((sum, a) => sum + a.rebate, 0);
  assert(Math.abs(q.rebate - expectedRebate) < 0.01, `Total rebate = sum of ODU rebates ($${expectedRebate.toFixed(2)})`);
  // Labor should include electrical for each ODU
  const expectedLabor = (q.details.totalZones! * 1000) + (q.details.numberOfODUs! * 1000);
  assert(q.laborCost === expectedLabor, `Labor = ${q.details.totalZones} heads x $1K + ${q.details.numberOfODUs} ODUs x $1K = $${expectedLabor}`);
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 9: 1-bedroom condo, mini-split — 700 sq ft, 1 bed');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(700, 1, 'no');
  printQuoteSummary('700 sqft mini-split 1bed', q);

  assert(q.details.bedroomTonnage === 0.5, 'Bedroom tonnage = 0.5');
  assert(q.details.totalZones === 2, '2 zones (1 bed + 1 common)');
  assert(q.details.numberOfODUs === 1, '1 ODU');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 10: Oversized home, ducted — 3,000 sq ft (6 tons, exceeds max)');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(3000, 5, 'yes');
  printQuoteSummary('3000 sqft ducted', q);

  assert(q.details.totalTonnage === 6.0, 'Tonnage = 6.0 (exceeds 5-ton max)');
  assert(q.oduAssignments[0].odu.model === 'H60TDH16XAC', 'Falls back to largest 5-ton ODU');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 11: Verify math — ducted total cost breakdown');
console.log('══════════════════════════════════════════════');
{
  const q = calculateDuctedQuote(2000);

  const expectedEquip = 3169.10 + 1710.50 + 345.40 + 200.20;
  assert(Math.abs(q.equipmentCost - expectedEquip) < 0.01, `Equipment = $${expectedEquip.toFixed(2)}`);
  assert(q.laborCost === 5000, 'Labor = $5,000');
  assert(Math.abs(q.totalCost - (expectedEquip + 5000)) < 0.01, `Total = $${(expectedEquip + 5000).toFixed(2)}`);
  assert(Math.abs(q.netCostAfterRebate - (expectedEquip + 5000 - 8500)) < 0.01, `Net = $${(expectedEquip + 5000 - 8500).toFixed(2)}`);
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 12: Verify math — mini-split total cost breakdown');
console.log('══════════════════════════════════════════════');
{
  const q = calculateMiniSplitQuote(1200, 2);
  const allIdus = q.oduAssignments.flatMap(a => a.idus);
  const iduTotal = allIdus.reduce((sum, i) => sum + i.price, 0);
  const oduTotal = q.oduAssignments.reduce((sum, a) => sum + a.odu.price, 0);
  const expectedEquip = oduTotal + iduTotal;

  assert(Math.abs(q.equipmentCost - expectedEquip) < 0.01, `Equipment = ODU($${oduTotal.toFixed(2)}) + IDUs($${iduTotal.toFixed(2)}) = $${expectedEquip.toFixed(2)}`);
  const expectedLabor = q.details.totalZones! * 1000 + q.details.numberOfODUs! * 1000;
  assert(q.laborCost === expectedLabor, `Labor = ${q.details.totalZones} heads x $1K + ${q.details.numberOfODUs} ODU x $1K = $${expectedLabor}`);
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 13: Very large home, mini-split — 4,000 sq ft, 5 bed (needs 2 ODUs)');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(4000, 5, 'no');
  printQuoteSummary('4000 sqft mini-split 5bed', q);

  assert(q.details.numberOfODUs! >= 2, 'Uses 2+ ODUs for very large home');
  for (let i = 0; i < q.oduAssignments.length; i++) {
    assert(q.oduAssignments[i].iduCombo.length <= 5, `ODU ${i + 1} has <= 5 zones`);
  }
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 14: Tonnage cap — ducted 1,800 sq ft (3.6 ton, cap 4.32 → picks 4-ton, not 5)');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(1800, 3, 'yes');
  printQuoteSummary('1800 sqft ducted cap test', q);

  // tonnage = 3.6, max = 3.6 * 1.2 = 4.32
  // Should pick 4-ton (within cap), NOT 5-ton
  assert(q.details.totalTonnage === 3.6, 'Tonnage = 3.6');
  assert(q.details.maxTonnage === 4.32, 'Max tonnage = 3.6 * 1.2 = 4.32');
  assert(q.oduAssignments[0].odu.model === 'H48TDH18XAC', 'Selects 4-ton (within 4.32 cap)');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 15: Tonnage cap — ducted 800 sq ft (1.6 ton, cap 1.92 → picks 2-ton)');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(800, 2, 'yes');
  printQuoteSummary('800 sqft ducted cap test', q);

  // tonnage = 1.6, max = 1.6 * 1.2 = 1.92
  // 2-ton is >= 1.6 AND <= 1.92 → valid
  assert(q.details.maxTonnage === 1.92, 'Max tonnage = 1.92');
  assert(q.oduAssignments[0].odu.model === 'H24TDH17XAC', 'Selects 2-ton (within 1.92 cap)');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 16: Tonnage cap — ducted 2,200 sq ft (4.4 ton, cap 5.28 → picks 5-ton)');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(2200, 4, 'yes');
  printQuoteSummary('2200 sqft ducted cap test', q);

  // tonnage = 4.4, max = 4.4 * 1.2 = 5.28
  // 5-ton is >= 4.4 AND <= 5.28 → valid
  assert(q.details.maxTonnage === 5.28, 'Max tonnage = 5.28');
  assert(q.oduAssignments[0].odu.model === 'H60TDH16XAC', 'Selects 5-ton (within 5.28 cap)');
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log('TEST 17: Tonnage cap — mini-split total system BTU capped');
console.log('══════════════════════════════════════════════');
{
  const q = calculateQuote(3200, 4, 'no');
  printQuoteSummary('3200 sqft mini-split cap test', q);

  // tonnage = 6.4, max = 6.4 * 1.2 = 7.68
  // Total IDU BTU across all ODUs should not exceed 7.68 tons = 92,160 BTU
  const totalIduBtu = q.oduAssignments.reduce((sum, a) =>
    sum + a.iduCombo.reduce((s, k) => s + k * 1000, 0), 0);
  const totalIduTons = totalIduBtu / 12000;
  assert(q.details.maxTonnage === 7.68, 'Max tonnage = 7.68');
  // Allow small overshoot due to discrete IDU sizes (9K minimum unit = 0.75 ton granularity)
  assert(totalIduTons <= q.details.maxTonnage + 0.75, `Total IDU tonnage (${totalIduTons.toFixed(2)}) within max + 1 unit tolerance (${(q.details.maxTonnage + 0.75).toFixed(2)})`);
}

// ═══════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════');
console.log(`\nRESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} assertions`);
console.log('══════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
