import { calculateQuote } from '../services/quoteCalculatorService';

const cases = [
  { sqft: 1500, br: 3, d: 'not sure' as const, actual: 13317.50 },
  { sqft: 6068, br: 6, d: 'yes' as const, actual: 16222.31 },
  { sqft: 2605, br: 3, d: 'no' as const, actual: 35000 },
  { sqft: 1200, br: 3, d: 'not sure' as const, actual: 16350.56 },
  { sqft: 1536, br: 3, d: 'no' as const, actual: 23522.19 },
  { sqft: 931, br: 3, d: 'no' as const, actual: 16867.69 },
  { sqft: 1736, br: 3, d: 'no' as const, actual: 20651.19 },
  { sqft: 1296, br: 3, d: 'yes' as const, actual: 16379.50 },
  { sqft: 2264, br: 3, d: 'no' as const, actual: 16372.50 },
  { sqft: 3285, br: 5, d: 'no' as const, actual: 12697.44 },
  { sqft: 2749, br: 4, d: 'yes' as const, actual: 12955.69 },
  { sqft: 1544, br: 3, d: 'no' as const, actual: 21956.63 },
  { sqft: 1180, br: 2, d: 'no' as const, actual: 9028.69 },
  { sqft: 4713, br: 6, d: 'no' as const, actual: 15973 },
  { sqft: 1377, br: 3, d: 'no' as const, actual: 10076.88 },
  { sqft: 1196, br: 3, d: 'no' as const, actual: 8513.87 },
  { sqft: 1471, br: 3, d: 'yes' as const, actual: 12868.74 },
  { sqft: 3018, br: 3, d: 'yes' as const, actual: 12818.94 },
  { sqft: 1500, br: 3, d: 'not sure' as const, actual: 13317.50 },
  { sqft: 2218, br: 4, d: 'no' as const, actual: 12215.42 },
];

console.log('Markup | Under    | Avg Diff  | ±10% | ±20% | ±30%');
console.log('-------|----------|-----------|------|------|------');

for (let pct = 25; pct <= 55; pct += 5) {
  const m = 1 + pct / 100;
  let under = 0, w10 = 0, w20 = 0, w30 = 0, totalP = 0, totalA = 0;
  for (const c of cases) {
    const q = calculateQuote(c.sqft, c.br, c.d);
    const p = q.totalCost * m;
    const diff = (p - c.actual) / c.actual * 100;
    totalP += p; totalA += c.actual;
    if (diff < 0) under++;
    if (Math.abs(diff) <= 10) w10++;
    if (Math.abs(diff) <= 20) w20++;
    if (Math.abs(diff) <= 30) w30++;
  }
  const avg = ((totalP - totalA) / totalA * 100).toFixed(1);
  console.log(
    `  ${pct}%  | ${under}/20 (${(under/20*100).toFixed(0).padStart(2)}%) | ${(+avg >= 0 ? '+' : '') + avg}%`.padEnd(35) +
    ` |  ${w10.toString().padStart(2)}  |  ${w20.toString().padStart(2)}  |  ${w30.toString().padStart(2)}`
  );
}
