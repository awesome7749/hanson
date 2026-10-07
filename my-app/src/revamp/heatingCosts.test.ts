import { heatNeedFromOil, heatingCostRows, energyPrices } from "./heatingCosts";
import { townBySlug, towns } from "./towns";

test("oil cost for the reference home equals gallons × price", () => {
  const rows = heatingCostRows(townBySlug("woburn")!, heatNeedFromOil(700));
  const oil = rows.find((r) => r.key === "oil")!;
  expect(oil.cost[0]).toBeCloseTo(700 * energyPrices.oil.pricePerGallon, 5);
});

test("heat pump uses the heat-pump rate where the utility offers one", () => {
  const woburn = townBySlug("woburn")!; // Eversource
  const hp = heatingCostRows(woburn, heatNeedFromOil(700)).find((r) => r.key === "heatPump")!;
  expect(hp.price).toBe(`${energyPrices.electric.Eversource.heatPumpCentsPerKwh!.toFixed(1)}¢/kWh`);
});

test("towns without a confirmed electric rate get no heat-pump row", () => {
  const concord = townBySlug("concord")!;
  expect(heatingCostRows(concord, heatNeedFromOil(700)).some((r) => r.key === "heatPump")).toBe(false);
});

test("every rate key referenced by a town is spelled like a known company", () => {
  const known = [
    ...Object.keys(energyPrices.gas), "Wakefield Municipal Gas & Light Department",
    ...Object.keys(energyPrices.electric), "Concord Municipal Light Plant",
    "Marblehead Municipal Light Department", "Norwood Municipal Light Department",
    "Peabody Municipal Light Plant", "Wellesley Municipal Light Plant",
  ];
  for (const t of towns) for (const k of [...(t.gasRates ?? []), ...(t.electricRates ?? [])]) expect(known).toContain(k);
});
