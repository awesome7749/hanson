// Search engines and visitors without JavaScript receive the useful guide
// content. React takes over the calculator when the bundle loads.
const SITE = 'https://hansonhome.us';
const ROUTE = '/heat-pump-cost-calculator';
const { pages, replacePageHead } = require('./seo-pages.cjs');
const { title, description } = pages[ROUTE];

function renderCalculatorPage(indexHtml) {
  const url = SITE + ROUTE;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Massachusetts Heat Pump Cost Calculator',
    description,
    url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    provider: { '@type': 'Organization', name: 'Hanson Home', url: SITE },
    dateModified: '2026-09-26',
  };
  const structuredData = `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  const body = `<main>
    <h1>Massachusetts heat pump cost calculator: would switching make sense for your home?</h1>
    <p>Compare installation price, possible 2026 Mass Save rebates and space-heating costs for a heat pump versus oil, propane, natural gas or electric resistance. The interactive calculator starts with your current heat source and heated home size, then estimates rooms served, system size, installation range, a possible rebate and heating costs. The default 2026 whole-home Mass Save rebate can reach $8,500 for eligible projects. Enable JavaScript to use the calculator.</p>
    <h2>How much does a heat pump cost to install in Massachusetts?</h2>
    <p>There is no single price for every home. Equipment size, rooms served, ductwork, electrical work and weatherization affect an installed quote. The calculator creates an illustrative installation range from home size and an estimated number of rooms, informed by Mass Save's $22,000 historical average for whole-home systems installed in 2022. The range is a planning tool, not a current statewide average or an offer. It separates gross cost from any potential rebate.</p>
    <h2>What are the 2026 Mass Save heat pump rebates?</h2>
    <p>Mass Save lists 2026 air-source heat pump rebates of $2,650 per ton for whole-home projects and $1,125 per ton for partial-home projects, each capped at $8,500. Basic rebates are $250 per ton up to $2,500. Eligibility depends on the utility sponsor, existing heating system, qualifying cold-climate equipment, installer and program conditions. <a href="https://www.masssave.com/en/residential/rebates-offers-services/heating-and-cooling/heat-pumps/air-source-heat-pumps">Read current Mass Save rebate rules</a>.</p>
    <h2>Will a heat pump lower my heating bill?</h2>
    <p>That depends on your current fuel use and price, electricity rate, seasonal heat-pump efficiency and the portion of heat the new system supplies. The calculator shows an estimated oil use as soon as you select a heated home size. It starts from the U.S. EIA’s 497 gallons of space-heating oil or kerosene per Massachusetts household using that fuel, rounds to 500 gallons at an illustrative 1,800 square feet, and scales with home area. That size scaling is our assumption. It converts delivered heat into expected electricity use, priced at the selected winter heat-pump electricity rate, then adds illustrative annual service allowances: $250 for oil, $200 for gas or propane, $200 for a heat pump, and $0 for electric resistance. It compares fuel or electricity plus service on both sides. A full-service oil contract may already include the tune-up. A room-by-room load calculation is needed to choose equipment.</p>
    <h2>How much CO₂ could a heat pump save?</h2>
    <p>The calculator estimates direct CO₂ from heating oil, propane or natural gas using <a href="https://www.eia.gov/environment/emissions/co2_vol_mass.php">U.S. EIA fuel factors</a>. It also estimates electricity emissions for the current system and heat pump using the <a href="https://www.epa.gov/system/files/documents/2025-06/summary_tables_rev2.pdf">EPA eGRID New England non-baseload factor</a>, adjusted for grid losses. The displayed net savings subtract heat-pump electricity emissions from current-heating emissions for one heating season. This is a planning estimate and excludes upstream fuel production, refrigerants and equipment manufacturing.</p>
    <h2>Where do the rates come from?</h2>
    <p>The default heating oil and propane rates come from the <a href="https://www.mass.gov/info-details/massachusetts-home-heating-fuels-prices">Massachusetts DOER fuel survey</a> on September 21, 2026. Electric and gas defaults come from published utility rates in the site's September 2026 data. The heat-pump electricity price uses the utility’s winter heat-pump rate where available; enrollment and eligibility apply. Check your own bill for a more accurate comparison. See the <a href="https://www.eia.gov/consumption/residential/data/2020/state/pdf/ce5.4.st.pdf">EIA state fuel-use table</a> for the oil-use benchmark. The federal energy-efficient home improvement tax credit ended for heat pumps placed in service after December 31, 2025, according to the <a href="https://www.irs.gov/instructions/i5695">IRS</a>.</p>
    <p><a href="/start?intent=heat-pump">Get a home-specific heat pump estimate</a></p>
  </main>`;
  const html = replacePageHead(indexHtml, pages[ROUTE], ROUTE)
    .replace('</head>', `${structuredData}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  if (!html.includes(`<title>${title}</title>`) || !html.includes('<div id="root"><main>')) {
    throw new Error('Could not prerender calculator page');
  }
  return html;
}

module.exports = { ROUTE, title, description, renderCalculatorPage };
