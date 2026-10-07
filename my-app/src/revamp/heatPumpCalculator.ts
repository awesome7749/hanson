import { energyPrices } from "./heatingCosts";

export type HeatingFuel = "oil" | "propane" | "gas" | "resistance";
export type ElectricUtility = "Eversource" | "National Grid" | "Cape Light Compact / Unitil" | "Municipal / other";
export type GasUtility = "National Grid (Boston Gas)" | "Eversource (NSTAR Gas)" | "Eversource (EGMA)" | "Berkshire Gas / Liberty / Unitil" | "Other";
export type RebateType = "whole" | "partial" | "basic" | "none";

export const FUEL = {
  oil: { label: "Heating oil", unit: "gallons", btu: 138_500, efficiency: 0.85, defaultUse: 500, defaultPrice: energyPrices.oil.pricePerGallon },
  propane: { label: "Propane", unit: "gallons", btu: 91_500, efficiency: 0.9, defaultUse: 900, defaultPrice: energyPrices.propane.pricePerGallon },
  gas: { label: "Natural gas", unit: "therms", btu: 100_000, efficiency: 0.9, defaultUse: 900, defaultPrice: energyPrices.gas["National Grid (Boston Gas)"].perTherm },
  resistance: { label: "Electric resistance", unit: "kWh", btu: 3_412, efficiency: 1, defaultUse: 10_000, defaultPrice: energyPrices.electric.Eversource.centsPerKwh / 100 },
} as const;

// Direct combustion CO₂ from EIA's fuel coefficients (kg/unit). The gas
// coefficient is 52.91 kg/MMBtu = 5.291 kg/therm. Electric resistance uses
// the same grid factor as the proposed heat pump.
export const CO2_KG_PER_UNIT = { oil: 10.19, propane: 5.75, gas: 5.291 } as const;

// EPA eGRID2023 revision 2, New England (NEWE) non-baseload CO₂ rate:
// 885.1 lb/MWh. Divide by 1 - 0.042 to account for grid gross losses and
// convert pounds to kilograms and MWh to kWh. This marginal proxy is suited
// to comparing a change in electricity demand, not a carbon inventory.
export const GRID_CO2_KG_PER_KWH = 885.1 * 0.45359237 / 1_000 / (1 - 0.042);

// Illustrative annual professional tune-up allowances. These are planning
// figures, not statewide averages or repair/service-contract premiums.
export const ANNUAL_SERVICE_COST = { oil: 250, propane: 200, gas: 200, resistance: 0, heatPump: 200 } as const;

export const electricDefaultRate = (utility: ElectricUtility, heatPumpRate: boolean) => {
  const rate = utility === "National Grid" ? energyPrices.electric["National Grid"] : energyPrices.electric.Eversource;
  if (utility === "Cape Light Compact / Unitil" || utility === "Municipal / other") return 0.30;
  return Math.round((heatPumpRate ? rate.heatPumpCentsPerKwh ?? rate.centsPerKwh : rate.centsPerKwh) * 100) / 10_000;
};

export const gasDefaultRate = (utility: GasUtility) => {
  const rate = energyPrices.gas[utility];
  return rate?.perTherm ?? 2.5;
};

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

// A planning proxy for the number of conditioned living spaces. This is not
// a floor plan: open layouts and room sizes can differ substantially.
export function estimateRooms(squareFeet: number) {
  const area = Math.min(5_000, Math.max(600, squareFeet));
  return Math.min(12, Math.max(2, Math.round(area / 300)));
}

// Planning estimates only. Area cannot replace a room-by-room heat-loss
// calculation; these assumptions are intentionally visible on the page.
export function estimateHomePlan(squareFeet: number, rooms: number, heatShare = 100, capacityTons?: number) {
  const area = Math.min(5_000, Math.max(600, squareFeet));
  const roomCount = Math.min(12, Math.max(1, rooms));
  const share = Math.min(1, Math.max(0, heatShare / 100));
  const designBtuPerHour = area * 25 * share;
  const tons = share === 0 ? 0 : capacityTons === undefined ? Math.max(0.5, roundTo(designBtuPerHour / 12_000, 0.5)) : Math.max(0.5, capacityTons);
  const roomUnits = share === 0 ? 0 : Math.max(1, Math.min(8,
    Math.round(Math.max(roomCount / 1.5, area / 550) * share)));
  // The $25k reference is an illustrative 2026 planning midpoint for a
  // 1,800-sq-ft, four-area project, informed by Mass Save's $22k historical
  // average (2022 installations). It is not a current market average.
  const midpoint = share === 0 ? 0 : roundTo(Math.max(8_000, 25_000 + (roomUnits - 4) * 2_250 + (tons - 4) * 1_800), 500);
  return {
    designBtuPerHour,
    tons,
    roomUnits,
    midpoint,
    low: roundTo(midpoint * 0.75, 500),
    high: roundTo(midpoint * 1.35, 500),
  };
}

export function estimateFuelUse(squareFeet: number, fuel: HeatingFuel) {
  const area = Math.min(5_000, Math.max(600, squareFeet));
  // EIA's 2020 RECS reports 497 gallons of oil/kerosene used for space
  // heating per Massachusetts household using that end use. We round to
  // 500 gallons at an illustrative 1,800 sq ft reference; proportional
  // scaling by home area is our planning assumption, not an EIA estimate.
  const referenceHeatBtu = 500 * FUEL.oil.btu * FUEL.oil.efficiency * area / 1_800;
  const unit = FUEL[fuel];
  const raw = referenceHeatBtu / (unit.btu * unit.efficiency);
  return roundTo(raw, fuel === "resistance" ? 100 : 10);
}

export interface CalculatorInputs {
  fuel: HeatingFuel;
  fuelUse: number;
  fuelPrice: number;
  electricUtility: ElectricUtility;
  gasUtility: GasUtility;
  electricRate: number;
  heatPumpRate: boolean;
  rebateType: RebateType;
  heatShare: number;
  seasonalCop: number;
  tons: number;
  installationCost: number;
  otherUpfrontCost: number;
  coolingSavings: number;
  alternativeReplacementCost: number;
}

export const initialInputs: CalculatorInputs = {
  fuel: "oil",
  fuelUse: FUEL.oil.defaultUse,
  fuelPrice: FUEL.oil.defaultPrice,
  electricUtility: "Eversource",
  gasUtility: "National Grid (Boston Gas)",
  electricRate: electricDefaultRate("Eversource", true),
  heatPumpRate: true,
  rebateType: "whole",
  heatShare: 100,
  seasonalCop: 2.5,
  tons: 3,
  installationCost: 25_000,
  otherUpfrontCost: 0,
  coolingSavings: 0,
  alternativeReplacementCost: 0,
};

export function calculateHeatPump(input: CalculatorInputs) {
  const fuel = FUEL[input.fuel];
  const heatShare = Math.min(1, Math.max(0, input.heatShare / 100));
  const deliveredBtu = Math.max(0, input.fuelUse) * fuel.btu * fuel.efficiency;
  const currentFuelCost = Math.max(0, input.fuelUse) * Math.max(0, input.fuelPrice);
  const currentMaintenanceCost = ANNUAL_SERVICE_COST[input.fuel];
  const currentCost = currentFuelCost + currentMaintenanceCost;
  const heatPumpKwh = deliveredBtu * heatShare / (3_412 * Math.max(1, input.seasonalCop));
  const heatPumpCost = heatPumpKwh * Math.max(0, input.electricRate);
  const currentCo2Kg = input.fuel === "resistance"
    ? Math.max(0, input.fuelUse) * GRID_CO2_KG_PER_KWH
    : Math.max(0, input.fuelUse) * CO2_KG_PER_UNIT[input.fuel];
  const heatPumpCo2Kg = heatPumpKwh * GRID_CO2_KG_PER_KWH;
  const proposedCo2Kg = heatPumpCo2Kg + currentCo2Kg * (1 - heatShare);
  const co2SavedKg = currentCo2Kg - proposedCo2Kg;
  const remainingFuelCost = currentFuelCost * (1 - heatShare);
  // A retained fuel system still needs its full annual service visit.
  const remainingMaintenanceCost = heatShare < 1 ? currentMaintenanceCost : 0;
  const heatPumpMaintenanceCost = heatShare > 0 ? ANNUAL_SERVICE_COST.heatPump : 0;
  const proposedCost = heatPumpCost + heatPumpMaintenanceCost + remainingFuelCost + remainingMaintenanceCost;
  const heatingSavings = currentCost - proposedCost;
  const annualSavings = heatingSavings + Math.max(0, input.coolingSavings);
  const electricSponsor = input.electricUtility !== "Municipal / other";
  const gasSponsor = input.gasUtility !== "Other";
  // Basic rebates use the electric sponsor even for gas-heated homes. The
  // whole-home category requires the pump to supply the modeled full load.
  const sponsored = (input.rebateType === "basic" ? electricSponsor : input.fuel === "gas" ? gasSponsor : electricSponsor)
    && (input.rebateType !== "whole" || heatShare === 1);
  const rebateRate = input.rebateType === "whole" ? 2650 : input.rebateType === "partial" ? 1125 : input.rebateType === "basic" ? 250 : 0;
  const rebateCap = input.rebateType === "basic" ? 2500 : 8500;
  const potentialRebate = sponsored ? Math.min(Math.max(0, input.tons) * rebateRate, rebateCap, Math.max(0, input.installationCost)) : 0;
  const grossCost = Math.max(0, input.installationCost) + Math.max(0, input.otherUpfrontCost);
  const netCost = grossCost - potentialRebate;
  const incrementalCost = Math.max(0, netCost - Math.max(0, input.alternativeReplacementCost));
  const paybackYears = annualSavings > 0 ? incrementalCost / annualSavings : null;
  const breakEvenElectricRate = heatPumpKwh > 0
    ? (currentCost - remainingFuelCost - remainingMaintenanceCost - heatPumpMaintenanceCost) / heatPumpKwh
    : null;
  return {
    deliveredBtu, currentFuelCost, currentMaintenanceCost, currentCost, heatPumpKwh, heatPumpCost, heatPumpMaintenanceCost,
    currentCo2Kg, heatPumpCo2Kg, proposedCo2Kg, co2SavedKg, remainingFuelCost, remainingMaintenanceCost,
    proposedCost, heatingSavings, annualSavings, sponsored, rebateRate, rebateCap, potentialRebate,
    grossCost, netCost, incrementalCost, paybackYears, breakEvenElectricRate,
  };
}
