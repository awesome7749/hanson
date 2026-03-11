/**
 * Deterministic HVAC Quote Calculator
 * Replaces LLM-based prediction with formula-driven equipment selection.
 * See QUOTE_CALCULATION_LOGIC.md for full documentation.
 */

// ── Equipment catalog ──────────────────────────────────────────────

export interface EquipmentUnit {
  model: string;
  btu: number;
  tonnage: number;
  price: number;
  seer2?: number;
  hspf2?: number;
  ahri?: number;
  rebate?: number;
}

export interface OduAssignment {
  odu: EquipmentUnit;
  idus: EquipmentUnit[];
  iduCombo: number[]; // BTU in K
  ahri: number;
  rebate: number;
}

export interface QuoteResult {
  systemType: 'ducted' | 'mini-split';
  oduAssignments: OduAssignment[];
  accessories: { model: string; description: string; price: number }[];
  equipmentCost: number;
  laborCost: number;
  totalCost: number;
  rebate: number;
  netCostAfterRebate: number;
  details: {
    totalTonnage: number;
    maxTonnage: number;
    bedroomTonnage?: number;
    remainingTonnage?: number;
    totalZones?: number;
    numberOfODUs?: number;
  };
}

// Ducted system (Advantage Series)
const DUCTED_SYSTEMS: {
  odu: EquipmentUnit;
  idu: EquipmentUnit;
  backupHeater: { model: string; price: number; kw: number };
  ahri: number;
  rebate: number;
}[] = [
  {
    odu: { model: 'H24TDH17XAC', btu: 24000, tonnage: 2.0, price: 1784.20, seer2: 18, hspf2: 9 },
    idu: { model: 'H24AHH17XAE', btu: 24000, tonnage: 2.0, price: 1455.30 },
    backupHeater: { model: 'ATT05KEH', price: 151.80, kw: 5 },
    ahri: 216706227,
    rebate: 5300.00,
  },
  {
    odu: { model: 'H36TDH18XAC', btu: 36000, tonnage: 3.0, price: 2765.40, seer2: 19, hspf2: 9 },
    idu: { model: 'H36AHH18XAE', btu: 36000, tonnage: 3.0, price: 1659.90 },
    backupHeater: { model: 'ATT10KEH', price: 201.30, kw: 10 },
    ahri: 215869484,
    rebate: 7508.33,
  },
  {
    odu: { model: 'H48TDH18XAC', btu: 48000, tonnage: 4.0, price: 3169.10, seer2: 18, hspf2: 8.5 },
    idu: { model: 'H48AHH18XAE', btu: 48000, tonnage: 4.0, price: 1710.50 },
    backupHeater: { model: 'ATT15KEH', price: 345.40, kw: 15 },
    ahri: 216046819,
    rebate: 8500.00,
  },
  {
    odu: { model: 'H60TDH16XAC', btu: 60000, tonnage: 5.0, price: 3333.00, seer2: 17.5, hspf2: 8.2 },
    idu: { model: 'H60AHH16XAE', btu: 60000, tonnage: 5.0, price: 1972.30 },
    backupHeater: { model: 'ATT20KEH', price: 415.80, kw: 20 },
    ahri: 216046818,
    rebate: 8500.00,
  },
];

const THERMOSTAT = { model: 'XK-120D2-100', description: 'Wired Thermostat (50ft wire)', price: 200.20 };

// Mini-split IDUs (BreezeIN Wall Mount)
const MINI_SPLIT_IDUS: EquipmentUnit[] = [
  { model: 'H09SBH23XPE', btu: 9000, tonnage: 0.75, price: 336.60 },
  { model: 'H12SBH23XPE', btu: 12000, tonnage: 1.0, price: 393.90 },
  { model: 'H18SBH22XPE', btu: 18000, tonnage: 1.5, price: 532.40 },
  { model: 'H24SBH20XPE', btu: 24000, tonnage: 2.0, price: 666.60 },
];

// Mini-split single-zone ODUs
const SINGLE_ZONE_ODUS: (EquipmentUnit & { ahri: number; rebate: number })[] = [
  { model: 'H09SBH23XPC', btu: 9000, tonnage: 0.75, price: 858.00, ahri: 215387259, rebate: 1987.50 },
  { model: 'H12SBH23XPC', btu: 12000, tonnage: 1.0, price: 990.00, ahri: 215387260, rebate: 2650.00 },
  { model: 'H18SBH22XPC', btu: 18000, tonnage: 1.5, price: 1261.70, ahri: 215387261, rebate: 3975.00 },
  { model: 'H24SBH20XPC', btu: 24000, tonnage: 2.0, price: 1617.00, ahri: 215387262, rebate: 5079.17 },
];

// Multi-zone ODUs
const MULTI_ZONE_ODUS: (EquipmentUnit & { maxZones: number; ahri: number; rebate: number })[] = [
  { model: 'H18FMH22XPC', btu: 18000, tonnage: 1.5, maxZones: 2, price: 1426.70, ahri: 215387263, rebate: 3975.00 },
  { model: 'H27FMH22XPC', btu: 27000, tonnage: 2.25, maxZones: 3, price: 2009.70, ahri: 215387264, rebate: 5962.50 },
  { model: 'H36FMH21XPC', btu: 36000, tonnage: 3.0, maxZones: 4, price: 2817.10, ahri: 215387265, rebate: 7729.17 },
  { model: 'H42FMH20XPC', btu: 42000, tonnage: 3.5, maxZones: 5, price: 3097.60, ahri: 215387266, rebate: 8500.00 },
];

// Valid multi-zone IDU combinations (BTU in thousands, sorted ascending)
const VALID_COMBOS: Record<string, number[][]> = {
  H18FMH22XPC: [
    [9], [12],
    [9,9], [9,12], [12,12],
  ],
  H27FMH22XPC: [
    [9,9], [9,12], [9,18], [12,12], [12,18], [18,18],
    [9,9,9], [9,9,12], [9,9,18], [9,12,12], [12,12,12],
  ],
  H36FMH21XPC: [
    [9,18], [9,24], [12,12], [12,18], [12,24], [18,18], [18,24], [24,24],
    [9,9,9], [9,9,12], [9,9,18], [9,9,24], [9,12,12], [9,12,18], [9,12,24], [9,18,18],
    [12,12,12], [12,12,18], [12,12,24], [12,18,18],
    [9,9,9,9], [9,9,9,12], [9,9,9,18], [9,9,12,12], [9,9,12,18], [9,12,12,12], [12,12,12,12],
  ],
  H42FMH20XPC: [
    [9,24], [12,24], [18,18], [18,24], [24,24],
    [9,9,18], [9,9,24], [9,12,12], [9,12,18], [9,12,24], [9,18,18], [9,18,24], [9,24,24],
    [12,12,12], [12,12,18], [12,12,24], [12,18,18], [12,18,24], [12,24,24], [18,18,18], [18,18,24],
    [9,9,9,9], [9,9,9,12], [9,9,9,18], [9,9,9,24], [9,9,12,12], [9,9,12,18], [9,9,12,24],
    [9,9,18,18], [9,9,18,24], [9,12,12,12], [9,12,12,18], [9,12,12,24], [9,12,18,18],
    [12,12,12,12], [12,12,12,18], [12,12,12,24], [12,12,18,18], [12,12,18,24],
    [9,9,9,9,9], [9,9,9,9,12], [9,9,9,9,18], [9,9,9,9,24],
    [9,9,9,12,12], [9,9,9,12,18], [9,9,9,12,24],
    [9,9,12,12,12], [9,9,12,12,18],
    [9,12,12,12,12], [12,12,12,12,12],
  ],
};

// ── Helpers ────────────────────────────────────────────────────────

function comboKey(combo: number[]): string {
  return [...combo].sort((a, b) => a - b).join(',');
}

function isValidCombo(oduModel: string, combo: number[]): boolean {
  const validList = VALID_COMBOS[oduModel];
  if (!validList) return false;
  const key = comboKey(combo);
  return validList.some(v => comboKey(v) === key);
}

function findIduByBtu(btu: number): EquipmentUnit {
  const idu = MINI_SPLIT_IDUS.find(u => u.btu === btu * 1000);
  if (!idu) throw new Error(`No IDU found for ${btu}K BTU`);
  return idu;
}

/** Break the largest IDU in the combo into two smaller ones */
function breakLargestIdu(combo: number[]): number[] {
  const sorted = [...combo].sort((a, b) => b - a);
  const largest = sorted[0];

  // Split rules: 24→12+12, 18→9+9, 12→9+9 (can't split 9)
  const rest = sorted.slice(1);
  if (largest === 24) return [...rest, 12, 12].sort((a, b) => a - b);
  if (largest === 18) return [...rest, 9, 9].sort((a, b) => a - b);
  if (largest === 12) return [...rest, 9, 9].sort((a, b) => a - b);
  // Can't break 9K further
  throw new Error(`Cannot break IDU combo further: [${combo.join(',')}]`);
}

/** Pick smallest IDU(s) that cover the given BTU.
 *  Strategy: use the smallest single unit that covers it. If none does, use the
 *  largest available and recurse on the remainder. */
function selectCommonAreaIdus(remainingBtu: number): number[] {
  if (remainingBtu <= 0) return [];
  const sizesK = [9, 12, 18, 24]; // ascending

  // Try to cover with a single unit (pick smallest that's >= needed)
  const neededK = remainingBtu / 1000;
  const singleFit = sizesK.find(s => s >= neededK);
  if (singleFit) return [singleFit];

  // Needs multiple units — use largest and recurse
  const largest = sizesK[sizesK.length - 1]; // 24K
  return [largest, ...selectCommonAreaIdus(remainingBtu - largest * 1000)].sort((a, b) => a - b);
}

// ── Max tonnage cap ────────────────────────────────────────────────
// Upper limit: sqft/500 * 1.2 — prevents oversizing the system
function getMaxTonnage(squareFootage: number): number {
  return (squareFootage / 500) * 1.2;
}

// ── Main calculator ────────────────────────────────────────────────

export function calculateDuctedQuote(squareFootage: number): QuoteResult {
  const tonnage = squareFootage / 500;
  const maxTonnage = getMaxTonnage(squareFootage);

  // Pick smallest system that covers tonnage (round up), but don't exceed max
  const system = DUCTED_SYSTEMS.find(s => s.odu.tonnage >= tonnage && s.odu.tonnage <= maxTonnage)
    // If nothing fits within cap, pick the largest that's under the cap
    || [...DUCTED_SYSTEMS].reverse().find(s => s.odu.tonnage <= maxTonnage)
    // Fallback: smallest system that covers tonnage (round up)
    || DUCTED_SYSTEMS.find(s => s.odu.tonnage >= tonnage)
    || DUCTED_SYSTEMS[DUCTED_SYSTEMS.length - 1];

  const assignment: OduAssignment = {
    odu: { ...system.odu, ahri: system.ahri, rebate: system.rebate },
    idus: [system.idu],
    iduCombo: [system.odu.btu / 1000],
    ahri: system.ahri,
    rebate: system.rebate,
  };

  const equipmentCost = system.odu.price + system.idu.price + system.backupHeater.price + THERMOSTAT.price;
  const laborCost = 4000 + 1000; // $4000 install + $1000 electrical per ODU

  return {
    systemType: 'ducted',
    oduAssignments: [assignment],
    accessories: [
      { model: system.backupHeater.model, description: `Backup Heater ${system.backupHeater.kw}kW`, price: system.backupHeater.price },
      { ...THERMOSTAT },
    ],
    equipmentCost: Math.round(equipmentCost * 100) / 100,
    laborCost,
    totalCost: Math.round((equipmentCost + laborCost) * 100) / 100,
    rebate: system.rebate,
    netCostAfterRebate: Math.round((equipmentCost + laborCost - system.rebate) * 100) / 100,
    details: {
      totalTonnage: Math.round(tonnage * 100) / 100,
      maxTonnage: Math.round(maxTonnage * 100) / 100,
      numberOfODUs: 1,
    },
  };
}

/** Resolve a set of IDUs (in K) to a single valid ODU + combo.
 *  Breaks the largest IDU if no valid combo is found. */
function resolveOduForIdus(iduCombo: number[]): OduAssignment {
  let combo = [...iduCombo].sort((a, b) => a - b);
  const MAX_ITERATIONS = 20;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Single zone
    if (combo.length === 1) {
      const btuK = combo[0];
      const odu = SINGLE_ZONE_ODUS.find(o => o.btu === btuK * 1000)
        || SINGLE_ZONE_ODUS[SINGLE_ZONE_ODUS.length - 1];
      return {
        odu: { ...odu },
        idus: [MINI_SPLIT_IDUS.find(u => u.btu === btuK * 1000)!],
        iduCombo: combo,
        ahri: odu.ahri,
        rebate: odu.rebate,
      };
    }

    // Multi-zone: try each ODU
    for (const odu of MULTI_ZONE_ODUS) {
      if (odu.maxZones >= combo.length && isValidCombo(odu.model, combo)) {
        return {
          odu: { ...odu },
          idus: combo.map(k => findIduByBtu(k)),
          iduCombo: combo,
          ahri: odu.ahri,
          rebate: odu.rebate,
        };
      }
    }

    // No valid combo — break the largest IDU
    try {
      combo = breakLargestIdu(combo);
    } catch {
      // Can't break further — use largest ODU as fallback
      const fallback = MULTI_ZONE_ODUS[MULTI_ZONE_ODUS.length - 1];
      return {
        odu: { ...fallback },
        idus: combo.map(k => findIduByBtu(k)),
        iduCombo: combo,
        ahri: fallback.ahri,
        rebate: fallback.rebate,
      };
    }
  }

  // Safety fallback
  const fallback = MULTI_ZONE_ODUS[MULTI_ZONE_ODUS.length - 1];
  return {
    odu: { ...fallback },
    idus: combo.map(k => findIduByBtu(k)),
    iduCombo: combo,
    ahri: fallback.ahri,
    rebate: fallback.rebate,
  };
}

const MAX_ZONES_PER_ODU = 5;

export function calculateMiniSplitQuote(squareFootage: number, bedrooms: number): QuoteResult {
  // Step B1: Bedroom BTU allocation (for calculation only — actual units are 9K min)
  let bedroomBtuCalc: number[];
  if (squareFootage < 3000) {
    bedroomBtuCalc = Array(bedrooms).fill(6000);
  } else {
    bedroomBtuCalc = Array(bedrooms).fill(6000);
    bedroomBtuCalc[0] = 9000; // one bedroom gets 9K
  }

  // Step B2: Remaining tonnage for common areas
  const totalTonnage = squareFootage / 500;
  const bedroomTonnage = bedroomBtuCalc.reduce((sum, b) => sum + b, 0) / 12000;
  const remainingTonnage = totalTonnage - bedroomTonnage;
  const remainingBtu = remainingTonnage * 12000;

  // Step B3: Select IDUs
  // Cap total system BTU at maxTonnage * 12000
  const maxTonnage = getMaxTonnage(squareFootage);
  const maxSystemBtu = maxTonnage * 12000;
  const bedroomIdusK = Array(bedrooms).fill(9);
  const bedroomBtu = bedroomIdusK.reduce((s, k) => s + k * 1000, 0);
  // Cap common area BTU so total doesn't exceed max
  const cappedRemainingBtu = Math.min(remainingBtu, maxSystemBtu - bedroomBtu);
  const commonIdusK = selectCommonAreaIdus(Math.max(0, cappedRemainingBtu));
  const allIdusK = [...bedroomIdusK, ...commonIdusK].sort((a, b) => a - b);
  const totalZones = allIdusK.length;

  // Step B4: Assign IDUs to ODUs
  // Prefer 2 ODUs over 1 — split IDUs into two groups when possible.
  // Single zone stays as 1 ODU.
  const assignments: OduAssignment[] = [];

  if (totalZones <= 1) {
    // Single zone: 1 ODU
    assignments.push(resolveOduForIdus(allIdusK));
  } else if (totalZones <= MAX_ZONES_PER_ODU * 2) {
    // Split into 2 groups, roughly balanced
    const sorted = [...allIdusK]; // already sorted ascending
    const splitPoint = Math.ceil(sorted.length / 2);
    const group1 = sorted.slice(0, splitPoint);
    const group2 = sorted.slice(splitPoint);
    assignments.push(resolveOduForIdus(group1));
    assignments.push(resolveOduForIdus(group2));
  } else {
    // Very large: split into groups of up to MAX_ZONES_PER_ODU
    const sorted = [...allIdusK];
    let remaining = [...sorted];
    while (remaining.length > 0) {
      const chunk = remaining.slice(0, MAX_ZONES_PER_ODU);
      remaining = remaining.slice(MAX_ZONES_PER_ODU);
      assignments.push(resolveOduForIdus(chunk));
    }
  }

  // Calculate totals
  const numberOfODUs = assignments.length;
  let equipmentCost = 0;
  let totalRebate = 0;
  const allIdus: EquipmentUnit[] = [];

  for (const a of assignments) {
    equipmentCost += a.odu.price;
    for (const idu of a.idus) {
      equipmentCost += idu.price;
      allIdus.push(idu);
    }
    totalRebate += a.rebate;
  }

  const laborCost = (totalZones * 1000) + (numberOfODUs * 1000); // $1K/head + $1K electrical/ODU
  equipmentCost = Math.round(equipmentCost * 100) / 100;

  return {
    systemType: 'mini-split',
    oduAssignments: assignments,
    accessories: [],
    equipmentCost,
    laborCost,
    totalCost: Math.round((equipmentCost + laborCost) * 100) / 100,
    rebate: Math.round(totalRebate * 100) / 100,
    netCostAfterRebate: Math.round((equipmentCost + laborCost - totalRebate) * 100) / 100,
    details: {
      totalTonnage: Math.round(totalTonnage * 100) / 100,
      maxTonnage: Math.round(maxTonnage * 100) / 100,
      bedroomTonnage: Math.round(bedroomTonnage * 100) / 100,
      remainingTonnage: Math.round(remainingTonnage * 100) / 100,
      totalZones,
      numberOfODUs,
    },
  };
}

export function calculateQuote(
  squareFootage: number,
  bedrooms: number,
  hasDuctwork: 'yes' | 'no' | 'not sure',
): QuoteResult {
  if (hasDuctwork === 'yes') {
    return calculateDuctedQuote(squareFootage);
  }
  return calculateMiniSplitQuote(squareFootage, bedrooms);
}
