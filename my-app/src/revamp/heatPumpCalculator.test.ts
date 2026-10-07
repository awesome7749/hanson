import { calculateHeatPump, CO2_KG_PER_UNIT, estimateFuelUse, estimateHomePlan, estimateRooms, GRID_CO2_KG_PER_KWH, initialInputs } from "./heatPumpCalculator";

test("estimated rooms follow heated home size", () => {
  expect(estimateRooms(600)).toBe(2);
  expect(estimateRooms(1800)).toBe(6);
  expect(estimateRooms(2800)).toBe(9);
  expect(estimateRooms(5000)).toBe(12);
  expect(estimateHomePlan(2800, estimateRooms(2800)).roomUnits)
    .toBeGreaterThan(estimateHomePlan(1800, estimateRooms(1800)).roomUnits);
});

test("home size changes the starting fuel use, capacity, room units and cost", () => {
  const small = estimateHomePlan(1000, 4);
  const medium = estimateHomePlan(1800, 6);
  const large = estimateHomePlan(2800, 8);
  expect(small.tons).toBeLessThan(medium.tons);
  expect(medium.tons).toBeLessThan(large.tons);
  expect(small.roomUnits).toBeLessThan(medium.roomUnits);
  expect(medium.roomUnits).toBeLessThan(large.roomUnits);
  expect(estimateHomePlan(2800, 6).roomUnits).toBeGreaterThan(medium.roomUnits);
  expect(small.midpoint).toBeLessThan(medium.midpoint);
  expect(medium.midpoint).toBeLessThan(large.midpoint);
  expect(estimateFuelUse(1800, "oil")).toBe(500);
  expect(estimateFuelUse(2800, "oil")).toBeGreaterThan(500);
});

test("whole-home oil example accounts for delivered heat, electricity and rebate", () => {
  const result = calculateHeatPump(initialInputs);
  expect(result.currentFuelCost).toBeCloseTo(500 * 6.15);
  expect(result.currentMaintenanceCost).toBe(250);
  expect(result.currentCost).toBeCloseTo(500 * 6.15 + 250);
  expect(result.remainingFuelCost).toBe(0);
  expect(result.heatPumpKwh).toBeCloseTo(500 * 138_500 * 0.85 / (3_412 * 2.5));
  expect(result.potentialRebate).toBe(3 * 2650);
  expect(result.netCost).toBe(25_000 - 7950);
  expect(result.heatingSavings).toBeCloseTo(result.currentCost - result.heatPumpCost - result.heatPumpMaintenanceCost);
});

test("$8,500 is a cap, so three tons receives $7,950 and 3.25 tons reaches the cap", () => {
  expect(calculateHeatPump(initialInputs).potentialRebate).toBe(7950);
  expect(calculateHeatPump({ ...initialInputs, tons: 3.25 }).potentialRebate).toBe(8500);
});

test("partial project keeps unconverted fuel in the new heating bill", () => {
  const result = calculateHeatPump({ ...initialInputs, rebateType: "partial", heatShare: 60 });
  expect(result.remainingFuelCost).toBeCloseTo(result.currentFuelCost * 0.4);
  expect(result.remainingMaintenanceCost).toBe(250);
  expect(result.proposedCost).toBeCloseTo(result.remainingFuelCost + result.remainingMaintenanceCost + result.heatPumpCost + result.heatPumpMaintenanceCost);
  expect(result.potentialRebate).toBe(3375);
});

test.each([
  ["oil", 250], ["propane", 200], ["gas", 200], ["resistance", 0],
] as const)("%s annual total adds the applicable service allowance", (fuel, service) => {
  const result = calculateHeatPump({ ...initialInputs, fuel });
  expect(result.currentMaintenanceCost).toBe(service);
  expect(result.currentCost).toBeCloseTo(result.currentFuelCost + service);
  expect(result.heatPumpMaintenanceCost).toBe(200);
  expect(result.proposedCost).toBeCloseTo(result.heatPumpCost + 200);
  expect(result.heatingSavings).toBeCloseTo(result.currentCost - result.proposedCost);
  expect(result.breakEvenElectricRate).toBeCloseTo((result.currentCost - 200) / result.heatPumpKwh);
});

test("rebate screen checks the appropriate sponsor and whole-home load", () => {
  const municipal = { ...initialInputs, electricUtility: "Municipal / other" as const };
  expect(calculateHeatPump(municipal).potentialRebate).toBe(0);
  expect(calculateHeatPump({ ...municipal, fuel: "gas", gasUtility: "National Grid (Boston Gas)" }).potentialRebate).toBe(7950);
  expect(calculateHeatPump({ ...municipal, fuel: "gas", rebateType: "basic" }).potentialRebate).toBe(0);
  expect(calculateHeatPump({ ...initialInputs, heatShare: 90 }).potentialRebate).toBe(0);
});

test("no heating savings means no simple payback", () => {
  const result = calculateHeatPump({ ...initialInputs, electricRate: 1 });
  expect(result.heatingSavings).toBeLessThan(0);
  expect(result.paybackYears).toBeNull();
});

test.each(["oil", "propane", "gas"] as const)("%s CO₂ savings use the fuel-specific combustion factor", fuel => {
  const fuelUse = estimateFuelUse(1800, fuel);
  const result = calculateHeatPump({ ...initialInputs, fuel, fuelUse });
  expect(result.currentCo2Kg).toBeCloseTo(fuelUse * CO2_KG_PER_UNIT[fuel]);
  expect(result.heatPumpCo2Kg).toBeCloseTo(result.heatPumpKwh * GRID_CO2_KG_PER_KWH);
  expect(result.co2SavedKg).toBeCloseTo(result.currentCo2Kg - result.heatPumpCo2Kg);
});

test("electric resistance compares avoided grid electricity with heat-pump electricity", () => {
  const fuelUse = estimateFuelUse(1800, "resistance");
  const result = calculateHeatPump({ ...initialInputs, fuel: "resistance", fuelUse });
  expect(result.currentCo2Kg).toBeCloseTo(fuelUse * GRID_CO2_KG_PER_KWH);
  expect(result.co2SavedKg).toBeCloseTo((fuelUse - result.heatPumpKwh) * GRID_CO2_KG_PER_KWH);
});

test("the default heat-pump electricity rate uses the winter rate", () => {
  expect(initialInputs.heatPumpRate).toBe(true);
  expect(initialInputs.electricRate).toBe(0.2813);
});
