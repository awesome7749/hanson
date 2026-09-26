import prices from "./energyPrices.json";
import { Town } from "./towns";

// Heating-cost comparison for the town pages. Prices live in
// energyPrices.json (refreshed monthly); this file holds the conversion
// assumptions. Everything is an estimate and is labelled as such on the page.

export type GasRate = { perTherm: number; period: string; source: string; sourceUrl?: string };
export type ElectricRate = {
  centsPerKwh: number;
  /** All-in winter ¢/kWh on the utility's heat-pump rate, when offered. */
  heatPumpCentsPerKwh?: number | null;
  period: string;
  source: string;
  sourceUrl?: string;
};
type Prices = {
  asOf: string;
  oil: { pricePerGallon: number; asOf: string; source: string; sourceUrl?: string };
  propane: { pricePerGallon: number; asOf: string; source: string; sourceUrl?: string };
  gas: Record<string, GasRate>;
  electric: Record<string, ElectricRate>;
};
export const energyPrices = prices as Prices;

// Heat content (Btu per unit) and typical seasonal efficiency of the
// equipment a heat pump would replace; heat-pump COP is a conservative
// seasonal average for a cold-climate heat pump in eastern Massachusetts.
export const ASSUMPTIONS = {
  oil: { btuPerUnit: 138_500, efficiency: 0.85 },
  propane: { btuPerUnit: 91_500, efficiency: 0.9 },
  gas: { btuPerUnit: 100_000, efficiency: 0.9 },
  heatPump: { btuPerKwh: 3_412, cop: 2.5 },
  defaultOilGallons: 700,
};

export type CostRow = {
  key: "oil" | "propane" | "gas" | "heatPump";
  label: string;
  price: string;
  /** Winter cost range for the given heat need, [low, high]. */
  cost: [number, number];
};

const range = (xs: number[]): [number, number] => [Math.min(...xs), Math.max(...xs)];

/** Delivered heat (Btu) of a home that burns `gallons` of oil a winter. */
export function heatNeedFromOil(gallons: number) {
  return gallons * ASSUMPTIONS.oil.btuPerUnit * ASSUMPTIONS.oil.efficiency;
}

export function townGasRates(town: Town) {
  return (town.gasRates ?? []).map((k) => energyPrices.gas[k]).filter(Boolean);
}

export function townElectricRates(town: Town) {
  return (town.electricRates ?? []).map((k) => energyPrices.electric[k]).filter(Boolean);
}

const fmtRange = (xs: number[], f: (x: number) => string) => {
  const [lo, hi] = range(xs);
  return lo === hi ? f(lo) : `${f(lo)}–${f(hi)}`;
};

export function heatingCostRows(town: Town, heatBtu: number): CostRow[] {
  const { oil, propane, gas, heatPump } = ASSUMPTIONS;
  const rows: CostRow[] = [
    {
      key: "oil",
      label: "Heating oil",
      price: `$${energyPrices.oil.pricePerGallon.toFixed(2)}/gal`,
      cost: range([(heatBtu / (oil.btuPerUnit * oil.efficiency)) * energyPrices.oil.pricePerGallon]),
    },
    {
      key: "propane",
      label: "Propane",
      price: `$${energyPrices.propane.pricePerGallon.toFixed(2)}/gal`,
      cost: range([(heatBtu / (propane.btuPerUnit * propane.efficiency)) * energyPrices.propane.pricePerGallon]),
    },
  ];
  const gasRates = townGasRates(town);
  if (gasRates.length) {
    const per = gasRates.map((g) => g.perTherm);
    rows.push({
      key: "gas",
      label: "Natural gas",
      price: fmtRange(per, (x) => `$${x.toFixed(2)}`) + "/therm",
      cost: range(per.map((p) => (heatBtu / (gas.btuPerUnit * gas.efficiency)) * p)),
    });
  }
  const elec = townElectricRates(town);
  if (elec.length) {
    const cents = elec.map((e) => e.heatPumpCentsPerKwh ?? e.centsPerKwh);
    const kwh = heatBtu / (heatPump.btuPerKwh * heatPump.cop);
    rows.push({
      key: "heatPump",
      label: "Heat pump",
      price: fmtRange(cents, (x) => `${x.toFixed(1)}¢`) + "/kWh",
      cost: range(cents.map((c) => (kwh * c) / 100)),
    });
  }
  return rows;
}
