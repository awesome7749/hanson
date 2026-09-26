import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FAQ, Icon } from "./Shared";
import { energyPrices } from "./heatingCosts";
import {
  CalculatorInputs, ElectricUtility, FUEL, GasUtility, HeatingFuel,
  calculateHeatPump, electricDefaultRate, estimateFuelUse, estimateHomePlan, estimateRooms, gasDefaultRate, initialInputs,
} from "./heatPumpCalculator";
import "./HeatPumpCostCalculator.css";

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const dollars = (n: number) => `$${n.toFixed(2)}`;
const metricTons = (kg: number) => (kg / 1_000).toFixed(1);
const formatFieldValue = (n: number) => String(Number(n.toFixed(4)));

function NumberField({ label, value, onChange, unit, help, min = 0, max, step = 1 }: {
  label: string; value: number; onChange: (value: number) => void; unit?: string; help?: string;
  min?: number; max?: number; step?: number;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const [draft, setDraft] = useState(formatFieldValue(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setDraft(formatFieldValue(value)); }, [value, focused]);
  return <div className="hpc-field">
    <label htmlFor={id}>{label}</label>
    <div className="hpc-input-wrap"><input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={draft} onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setDraft(formatFieldValue(value)); }} onChange={e => { setDraft(e.target.value); if (e.target.value !== "" && Number.isFinite(Number(e.target.value))) onChange(Number(e.target.value)); }} />{unit && <span>{unit}</span>}</div>
    {help && <small>{help}</small>}
  </div>;
}

function SelectField<T extends string>({ label, value, onChange, options, help }: {
  label: string; value: T; onChange: (value: T) => void; options: [T, string][]; help?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <div className="hpc-field">
    <label htmlFor={id}>{label}</label>
    <select id={id} value={value} onChange={e => onChange(e.target.value as T)}>{options.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select>
    {help && <small>{help}</small>}
  </div>;
}

export default function HeatPumpCostCalculator() {
  const [input, setInput] = useState<CalculatorInputs>(initialInputs);
  const [homeSqft, setHomeSqft] = useState(1800);
  const rooms = estimateRooms(homeSqft);
  const plan = estimateHomePlan(homeSqft, rooms);
  const modeledInput: CalculatorInputs = {
    ...input,
    fuelUse: estimateFuelUse(homeSqft, input.fuel),
    tons: plan.tons,
    installationCost: plan.midpoint,
  };
  const result = calculateHeatPump(modeledInput);
  const costLow = calculateHeatPump({ ...modeledInput, installationCost: plan.low }).netCost;
  const costHigh = calculateHeatPump({ ...modeledInput, installationCost: plan.high }).netCost;
  const oilGallons = estimateFuelUse(homeSqft, "oil");
  const set = <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => setInput(previous => ({ ...previous, [key]: value }));
  const fuel = FUEL[input.fuel];
  const electricitySource = input.electricUtility === "Eversource" || input.electricUtility === "National Grid"
    ? energyPrices.electric[input.electricUtility] : null;
  const savingPositive = result.heatingSavings > 0;
  const chartMax = Math.max(result.currentCost, result.proposedCost, 1);

  const changeFuel = (newFuel: HeatingFuel) => {
    setInput(previous => ({
    ...previous, fuel: newFuel, fuelUse: FUEL[newFuel].defaultUse,
    fuelPrice: newFuel === "resistance" ? electricDefaultRate(previous.electricUtility, false) : FUEL[newFuel].defaultPrice,
  }));
  };
  const changeElectricUtility = (utility: ElectricUtility) => setInput(previous => ({
    ...previous, electricUtility: utility, heatPumpRate: true,
    electricRate: electricDefaultRate(utility, true),
    fuelPrice: previous.fuel === "resistance" ? electricDefaultRate(utility, false) : previous.fuelPrice,
  }));


  return <div className="hpc-page">
    <section className="hpc-hero">
      <div className="wrap hpc-hero-inner">
        <div>
          <span className="eyebrow">MASSACHUSETTS • UPDATED SEPTEMBER 2026</span>
          <h1>Would a heat pump make sense <em>for your home?</em></h1>
          <p>Choose your heating source and home size. We’ll sketch a heat-pump system, installation price, heating bills and possible Mass Save® rebate. See the estimate change as you choose your home details.</p>
          <a className="button" href="#calculator">Calculate my cost <Icon name="arrow" size={18} /></a>
          <span className="hpc-hero-note">Free to use · No contact details needed · About 3 minutes</span>
        </div>
        <aside className="hpc-hero-card" aria-label="What this calculator shows">
          <span className="hpc-hero-card-kicker">THE COMPLETE PICTURE</span>
          <div><span>01</span><strong>Project price</strong><small>Before and after a possible rebate</small></div>
          <div><span>02</span><strong>Annual heating cost</strong><small>Fuel or electricity plus routine service</small></div>
          <div><span>03</span><strong>Up to $8,500</strong><small>Potential 2026 Mass Save whole-home rebate</small></div>
          <p>Every figure is an estimate. A contractor and program administrator must confirm the scope, price and rebate.</p>
        </aside>
      </div>
    </section>

    <div className="wrap hpc-jump" aria-label="On this page"><a href="#calculator">Calculator</a><a href="#how-it-works">How the math works</a><a href="#incentives">2026 incentives</a><a href="#questions">Questions</a><a href="#sources">Sources</a></div>

    <section className="wrap hpc-calculator-section" id="calculator">
      <div className="hpc-section-intro"><span className="eyebrow">YOUR ESTIMATE</span><h2>Start with your home.</h2><p>Choose your current heat source and heated home size. We’ll estimate fuel use, rooms served, system size, installation cost and the potential rebate automatically.</p></div>
      <div className="hpc-grid">
        <div className="hpc-form">
          <section className="hpc-panel"><div className="hpc-step"><span>1</span><div><h3>Tell us about your home</h3><p>Home size gives an automatic fuel-use estimate.</p></div></div>
            <div className="hpc-fields">
              <SelectField label="What heats your home now?" value={input.fuel} onChange={changeFuel} options={[["oil","Heating oil"],["propane","Propane"],["gas","Natural gas"],["resistance","Electric baseboard / resistance"]]} />
              <div className="hpc-size-field"><div className="hpc-size-heading"><label htmlFor="hpc-home-size">Heated home size</label><strong>{homeSqft.toLocaleString()} sq ft</strong></div><input id="hpc-home-size" type="range" min="600" max="5000" step="100" value={homeSqft} onChange={e => setHomeSqft(Number(e.target.value))} /><div className="hpc-size-ends"><span>600 sq ft</span><span>5,000 sq ft</span></div></div>
              <div className="hpc-room-estimate" aria-live="polite"><span>Estimated rooms needing heat</span><strong>About {rooms} rooms</strong><small>Based on roughly one living space per 300 heated sq ft. Open plans and room sizes may differ.</small></div>
              <div className="hpc-fuel-estimate" aria-live="polite"><span className="eyebrow">ESTIMATED SPACE-HEATING FUEL USE</span><strong>About {Math.round(modeledInput.fuelUse).toLocaleString()} {fuel.unit} of {fuel.label.toLowerCase()} per heating season</strong>{input.fuel !== "oil" && <span>About {oilGallons.toLocaleString()} gallons of heating oil equivalent.</span>}<small>Scaled from the EIA’s 497-gallon Massachusetts oil-heating average. Home size alone cannot predict actual use. <a href="#sources">See the source and assumption ↓</a></small></div>
              {input.fuel === "gas" && <SelectField label="Current gas utility" value={input.gasUtility} onChange={(v: GasUtility) => setInput(p => ({...p, gasUtility: v, fuelPrice: gasDefaultRate(v)}))} options={[["National Grid (Boston Gas)","National Grid (Boston Gas)"],["Eversource (NSTAR Gas)","Eversource (NSTAR Gas)"],["Eversource (EGMA)","Eversource (EGMA)"],["Berkshire Gas / Liberty / Unitil","Berkshire Gas, Liberty or Unitil"],["Other","Other / municipal"]]} />}
              <NumberField label={`Current ${fuel.label.toLowerCase()} price`} value={input.fuelPrice} onChange={v => set("fuelPrice", v)} unit={input.fuel === "resistance" ? "$/kWh" : input.fuel === "gas" ? "$/therm" : "$/gal"} step={0.01} help={input.fuel === "gas" && (input.gasUtility === "Berkshire Gas / Liberty / Unitil" || input.gasUtility === "Other") ? "$2.50/therm is a placeholder; use your bill." : "Preset from the latest source listed below; adjust for your bill or contract."} />
            </div>
            <div className="hpc-auto-plan"><span className="eyebrow">ESTIMATED SYSTEM SIZE</span><div><strong>About {modeledInput.tons} tons</strong><strong>{plan.roomUnits} room {plan.roomUnits === 1 ? "unit" : "units"}</strong></div><p>These are rough heating-capacity and indoor-unit allowances based on home area and estimated rooms. Actual equipment count, heating size, and rebate tonnage depend on the final design.</p></div>
          </section>

          <section className="hpc-panel"><div className="hpc-step"><span>2</span><div><h3>Choose your utility</h3><p>We’ll prefill the published rate. You can change it to match your bill.</p></div></div>
            <div className="hpc-fields">
              <SelectField label="Electric utility" value={input.electricUtility} onChange={changeElectricUtility} options={[["Eversource","Eversource"],["National Grid","National Grid"],["Cape Light Compact / Unitil","Cape Light Compact or Unitil"],["Municipal / other","Municipal utility / other"]]} />
              <NumberField label="Winter heat-pump electricity price" value={input.electricRate} onChange={v => set("electricRate", v)} unit="$/kWh" step={0.01} help={electricitySource ? "Starts at this utility’s seasonal heat-pump rate. Enrollment and eligibility are required; adjust to your actual all-in winter rate." : "30¢/kWh is a placeholder. Enter your all-in winter heat-pump rate."} />

            </div>
          </section>

          <section className="hpc-panel"><div className="hpc-step"><span>3</span><div><h3>Your estimated installation</h3><p>We create a planning range from your home size and room count. A site visit is needed for a real quote.</p></div></div>
            <div className="hpc-install-preview"><span>Before rebate, including estimated equipment and installation</span><strong>{money(plan.low)}–{money(plan.high)}</strong><small>Planning midpoint {money(plan.midpoint)} · illustrative range, not a contractor quote.</small></div>
          </section>

          <section className="hpc-panel"><div className="hpc-step"><span>4</span><div><h3>Your estimated rebate</h3><p>See how the 2026 Mass Save® whole-home incentive changes your project cost.</p></div></div>
            <div className="hpc-rebate-preview" aria-live="polite"><span>Potential Mass Save® rebate</span><strong>{money(result.potentialRebate)}</strong><p>{result.sponsored ? `${modeledInput.tons} estimated tons × ${money(result.rebateRate)}/ton = ${money(modeledInput.tons * result.rebateRate)}, capped at $8,500.` : "No Mass Save rebate is counted for this utility. Ask your utility about other incentives."}</p></div>
            <a className="hpc-rebate-link" href="#incentives">See 2026 rebate details and eligibility ↓</a>
          </section>

          <section className="hpc-panel hpc-consultation-panel"><div className="hpc-step"><span>5</span><div><h3>Ready for a free consultation?</h3><p>See how we price a real project. On the pricing page, choose “Get my estimate” to share your home details with our team.</p></div></div>
            <Link className="button" to="/pricing">See pricing and get started <Icon name="arrow" size={18} /></Link>
          </section>
        </div>

        <div className="hpc-results">
          <div className="hpc-result-card"><div className="hpc-result-top"><span className="eyebrow">YOUR LIVE ESTIMATE</span><span>2026 planning view</span></div>
            <div className="hpc-primary-result"><small>Estimated cost after potential rebate</small><strong className="hpc-range" aria-live="polite">{money(costLow)}–{money(costHigh)}</strong><span>{money(plan.low)}–{money(plan.high)} project − {money(result.potentialRebate)} possible rebate</span></div>
            <div className="hpc-results-divider" />
            <div className="hpc-result-heading"><h3>Annual heating + maintenance</h3><small>Fuel or electricity, plus routine service</small></div>
            <p className="hpc-estimate-basis">Based on an estimated {Math.round(modeledInput.fuelUse).toLocaleString()} {fuel.unit} of {fuel.label.toLowerCase()} for a {homeSqft.toLocaleString()} sq ft home.</p>
            <div className="hpc-bars"><div><div className="hpc-bar-label"><span>Current {fuel.label.toLowerCase()} + annual maintenance</span><strong>{money(result.currentCost)}</strong></div><div className="hpc-bar-track"><span style={{width: `${100 * result.currentCost / chartMax}%`}} /></div></div><div><div className="hpc-bar-label"><span>Heat pump + annual maintenance</span><strong>{money(result.proposedCost)}</strong></div><div className="hpc-bar-track hpc-bar-track-new"><span style={{width: `${100 * result.proposedCost / chartMax}%`}} /></div></div></div>
            <div className="hpc-savings"><span>{savingPositive ? "Estimated annual operating savings" : "Estimated added annual operating cost"}</span><strong aria-live="polite">{money(Math.abs(result.heatingSavings))}<small>/year</small></strong></div>
            <div className="hpc-result-foot"><span>Current energy cost ({fuel.label.toLowerCase()})</span><b>{money(result.currentFuelCost)}</b><span>Current-system annual service</span><b>{money(result.currentMaintenanceCost)}</b><span>Heat-pump electricity</span><b>{money(result.heatPumpCost)}</b><span>Heat-pump annual service</span><b>{money(result.heatPumpMaintenanceCost)}</b>{result.remainingFuelCost > 0 && <><span>Remaining old fuel</span><b>{money(result.remainingFuelCost)}</b></>}{result.remainingMaintenanceCost > 0 && <><span>Retained-system service</span><b>{money(result.remainingMaintenanceCost)}</b></>}<span>Heat-pump electricity use</span><b>{Math.round(result.heatPumpKwh).toLocaleString()} kWh</b></div>
            <p className="hpc-service-note">Annual service allowances: oil $250, gas or propane $200, heat pump $200; electric resistance $0. These are planning estimates for a routine visit, excluding repairs. Oil service may already be included in a full-service delivery contract.</p>
            <div className="hpc-carbon" aria-live="polite"><span>{result.co2SavedKg >= 0 ? "Estimated CO₂ saved" : "Estimated CO₂ increase"}</span><strong>{metricTons(Math.abs(result.co2SavedKg))} metric tons <small>CO₂ / heating season</small></strong><small>Current heat: {metricTons(result.currentCo2Kg)} tons · With heat pump: {metricTons(result.proposedCo2Kg)} tons. Includes estimated electricity emissions.</small></div>
            <p className="hpc-break-even">Including the service allowances, annual heating cost breaks even at about <strong>{result.breakEvenElectricRate === null ? "—" : `${Math.round(result.breakEvenElectricRate * 100)}¢/kWh`}</strong>. The winter heat-pump rate above is {Math.round(input.electricRate * 100)}¢/kWh.</p>
            <a className="hpc-print" href="#how-it-works">See the math and assumptions ↓</a>
          </div>
          <p className="hpc-results-caveat">This calculator is educational. It cannot predict a final bill or determine rebate eligibility. Compare an itemized quote and your own utility bills before deciding.</p>
        </div>
      </div>
    </section>

    <section className="hpc-explain" id="how-it-works"><div className="wrap"><span className="eyebrow">HOW WE CALCULATE IT</span><h2>A transparent estimate, not a black box.</h2><div className="hpc-explain-grid"><article><span>01 / HEAT NEEDED</span><h3>Start with home size.</h3><p>EIA reports 497 gallons of oil or kerosene per Massachusetts household using that fuel for space heat in 2020. We round this to 500 gallons at a 1,800 sq ft reference home, then scale by heated area. The 1,800 sq ft reference and proportional scaling are our assumptions. We convert the resulting delivered heat into other fuels using their Btu content and assumed equipment efficiency.</p></article><article><span>02 / SYSTEM PLAN</span><h3>Sketch capacity and cost.</h3><p>We estimate one heated living space per 300 sq ft and a rough heating-capacity allowance of 25 Btu/h per heated square foot, rounded to a half-ton. Estimated rooms and area suggest an indoor-unit allowance. The installation range is our planning formula around a {money(plan.midpoint)} midpoint for this home, informed by Mass Save’s historical $22,000 whole-home average from 2022. The actual rebate uses AHRI cooling capacity, which may differ from this heating estimate.</p></article><article><span>03 / ANNUAL COST</span><h3>Add energy and service.</h3><p>Heat-pump electricity is estimated from delivered heat and an assumed seasonal COP of 2.5, priced at the selected winter heat-pump rate. The current-system total adds estimated fuel or electricity cost and one annual routine service allowance; the heat-pump total adds electricity and a heat-pump service allowance. We use $250 for oil, $200 for gas or propane, $200 for a heat pump and $0 for electric resistance. These are our planning allowances, not measured statewide averages or repair budgets.</p></article></div><p className="hpc-explain-note">Home area alone cannot determine heating load or equipment layout. U.S. DOE recommends a Manual J or equivalent load calculation because shortcuts can oversize equipment. The CO₂ estimate uses EIA fuel factors and EPA’s New England grid factor; it excludes upstream fuel production, refrigerants, equipment manufacturing and future changes in the grid. Fixed customer charges, repairs, and weatherization savings are not modeled. Some oil delivery contracts include annual service, so adding this allowance may overstate your current cost. Compare this estimate with your bill history and an itemized quote before deciding.</p></div></section>

    <section className="wrap hpc-content" id="incentives"><div className="hpc-content-heading"><span className="eyebrow">2026 MASS SAVE®</span><h2>What the rebate estimate means.</h2><p>For eligible air-source heat pumps installed in 2026, Mass Save lists whole-home rebates at $2,650 per ton and partial-home at $1,125 per ton, each capped at $8,500. Basic rebates are $250 per ton, capped at $2,500. Income-based enhanced incentives may be higher and require a separate eligibility review.</p></div><div className="hpc-info-cards"><article><b>Check the sponsor</b><p>Oil, propane and electric resistance replacements generally need a participating Mass Save electric sponsor. Natural gas replacements generally need a participating gas sponsor. Municipal electric utilities may offer different incentives.</p></article><article><b>Check the project</b><p>Eligible cold-climate equipment, a participating installer, installation dates, assessment or weatherization, and integrated controls for some partial projects can affect the final amount.</p></article><article><b>Check the timing</b><p>The federal energy-efficient home improvement credit for heat pumps ended for property placed in service after December 31, 2025. It is not added to this 2026 estimate.</p></article></div><a className="text-link" href="https://www.masssave.com/en/residential/rebates-offers-services/heating-and-cooling/heat-pumps/air-source-heat-pumps" target="_blank" rel="noreferrer">Read the full 2026 Mass Save rules ↗</a></section>

    <section className="hpc-faq" id="questions"><div className="wrap hpc-faq-grid"><div><span className="eyebrow">COMMON QUESTIONS</span><h2>What else should I consider?</h2><p>A good decision includes comfort, cooling, equipment condition and the quality of the installation, along with this cost comparison.</p></div><FAQ items={[
      ["Will a heat pump save me money in Massachusetts?", "It depends on your current fuel price, electricity rate, seasonal heat-pump performance and how much heat the new system supplies. Oil or electric resistance homes often have a different result from natural gas homes. Compare the estimate above with your bills and a contractor’s equipment plan."],
      ["How much does a heat pump cost to install in Massachusetts?", "There is no reliable single price for every home. The number of rooms served, capacity, ductwork, electrical work and weatherization can change a quote substantially. The range above is an illustrative planning formula, informed by Mass Save's historical 2022 installation data. It is not a current statewide average or an offer."],
      ["Can a heat pump replace my furnace or boiler?", "A properly designed cold-climate system may serve the whole home's heating load. Whether backup is needed depends on heat-loss calculations, equipment performance at low temperatures and your home's distribution. Ask for a room-by-room design and the planned switchover strategy."],
      ["How are the CO₂ savings estimated?", "We estimate emissions from your current oil, propane, natural gas or resistance heat, then subtract estimated emissions from the heat pump’s electricity use. The grid factor is a New England marginal proxy, so the result is a planning estimate rather than a measured carbon footprint."],
      ["Does this include a 2026 federal tax credit?", "No. The IRS says the energy-efficient home improvement credit is not available for property placed in service after December 31, 2025. The calculator only screens for the listed 2026 Mass Save rebate."],
    ]} /></div></section>

    <section className="wrap hpc-sources" id="sources"><span className="eyebrow">SOURCES & UPDATE POLICY</span><h2>Where the starting numbers come from.</h2><p>Last reviewed September 26, 2026. Default fuel and utility rates are snapshots, not forecasts. The home-size fuel-use assumption and installation-cost range are illustrative planning models, not measured data for your house. Compare the estimate with your bills and a contractor quote for a more precise answer. Program rules and tariffs can change; we will review this page as new rates and incentives are published.</p><p>Annual service is an illustrative allowance informed by <a href="https://www.mass.gov/doc/consumer-tip-sheet-oil-heat-maintenance/download" target="_blank" rel="noreferrer">Massachusetts DOER oil-maintenance guidance ↗</a>, <a href="https://www.charltonoil.com/heating-system-services" target="_blank" rel="noreferrer">a Massachusetts propane service price ↗</a>, <a href="https://www.dewolfecontracting.com/furnace-tune-up-cost-and-whats-included/" target="_blank" rel="noreferrer">a Massachusetts furnace tune-up price ↗</a>, and <a href="https://www.carrier.com/us/en/residential/hvac-resources/heat-pumps/heat-pump-service/" target="_blank" rel="noreferrer">Carrier heat-pump service guidance ↗</a>. The <a href="https://www.mass.gov/guides/heating-oil-contracts-guide" target="_blank" rel="noreferrer">Massachusetts heating-oil contracts guide ↗</a> notes full-service contracts may include a maintenance visit. These examples do not establish a statewide average.</p><ul><li><a href={energyPrices.oil.sourceUrl} target="_blank" rel="noreferrer">Massachusetts DOER fuel survey ↗</a> — oil {dollars(energyPrices.oil.pricePerGallon)}/gal and propane {dollars(energyPrices.propane.pricePerGallon)}/gal, September 21, 2026.</li><li><a href={energyPrices.electric.Eversource.sourceUrl} target="_blank" rel="noreferrer">Eversource electric rates ↗</a> and <a href={energyPrices.electric["National Grid"].sourceUrl} target="_blank" rel="noreferrer">National Grid electric rates ↗</a> — default all-in rate estimates in the site's September 2026 data. <a href="https://www.mass.gov/info-details/residential-electric-seasonal-heat-pump-rates" target="_blank" rel="noreferrer">Massachusetts DPU explains the seasonal heat-pump rates ↗</a>.</li><li><a href="https://www.mass.gov/info-details/information-on-gas-supply-and-delivery-charges" target="_blank" rel="noreferrer">Massachusetts DPU gas charges ↗</a> — gas utility starting rates from winter 2025–26.</li><li><a href="https://www.eia.gov/consumption/residential/data/2020/state/pdf/ce5.4.st.pdf" target="_blank" rel="noreferrer">U.S. EIA 2020 RECS state table CE5.4.ST ↗</a> — 497 gallons of fuel oil or kerosene per Massachusetts household using it for space heating. The 1,800 sq ft reference and area scaling are our assumptions, not EIA estimates.</li><li><a href="https://www.eia.gov/energyexplained/units-and-calculators/" target="_blank" rel="noreferrer">U.S. EIA energy conversion factors ↗</a> — Btu per gallon, therm and kWh. Existing system efficiencies and the 2.5 seasonal COP are fixed planning assumptions.</li><li><a href="https://www.masssave.com/en/residential/rebates-offers-services/heating-and-cooling/heat-pumps/air-source-heat-pumps" target="_blank" rel="noreferrer">Mass Save 2026 air-source heat pump rebates ↗</a> — rebate amounts, eligibility, and a $22,000 example based on 2022 installations. <a href="https://www.masssave.com/residential/heating-comparison-calculator" target="_blank" rel="noreferrer">Compare with Mass Save's calculator ↗</a>.</li><li><a href="https://www.eia.gov/environment/emissions/co2_vol_mass.php" target="_blank" rel="noreferrer">U.S. EIA fuel CO₂ coefficients ↗</a> — 10.19 kg/gallon heating oil, 5.75 kg/gallon propane and 5.291 kg/therm natural gas.</li><li><a href="https://www.epa.gov/system/files/documents/2025-06/summary_tables_rev2.pdf" target="_blank" rel="noreferrer">EPA eGRID2023 New England rates ↗</a> — 885.1 lb/MWh non-baseload CO₂, adjusted for 4.2% grid losses. <a href="https://www.epa.gov/egrid/frequent-questions-about-egrid" target="_blank" rel="noreferrer">EPA explains non-baseload rates ↗</a> as a proxy for changes in grid emissions.</li><li><a href="https://bsesc.energy.gov/energy-basics/hvac-proper-sizing-hvac-systems" target="_blank" rel="noreferrer">U.S. DOE HVAC sizing guidance ↗</a> — a room-by-room load calculation is needed for equipment selection.</li><li><a href="https://www.irs.gov/instructions/i5695" target="_blank" rel="noreferrer">IRS Form 5695 instructions ↗</a> — federal credit end date.</li></ul></section>

    <section className="wrap hpc-cta"><div><span className="eyebrow">READY FOR A HOME-SPECIFIC NUMBER?</span><h2>Turn your estimate into a real plan.</h2><p>We can review the rooms, equipment, electrical work and rebate path and give you a written scope and price.</p></div><Link className="button" to="/start?intent=heat-pump">Get a home-specific estimate <Icon name="arrow" size={18} /></Link></section>
  </div>;
}
