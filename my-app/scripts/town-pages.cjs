// Pre-renders the town landing pages (/woburn, /lexington, …) for search
// engines. Each page is the built index.html with its own <head> tags and a
// static copy of the key content inside #root; React replaces that content
// on load. Used by prepare-live.cjs; data comes from src/revamp/towns.json.
const towns = require('../src/revamp/towns.json');
const prices = require('../src/revamp/energyPrices.json');
const installationPhotos = require('../src/revamp/installationPhotos.json');

const SITE = 'https://hansonhome.us';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Keep in sync with townMeta() in src/revamp/towns.ts (a test checks).
function townMeta(town) {
  return {
    title: `Heat Pump Installation in ${town.name}, MA | Hanson Home`,
    description:
      (town.installs
        ? `Hanson Home has installed ${town.installs}+ heat pumps in ${town.name}, MA. `
        : `Heat-pump installation for ${town.name}, MA homes. `) +
      'Clear project pricing and professional installation. Get a free estimate.',
  };
}

// Plain-text version of the town page's heating-cost section.
function priceSummary(town) {
  const items = [
    `heating oil $${prices.oil.pricePerGallon.toFixed(2)}/gallon and propane $${prices.propane.pricePerGallon.toFixed(2)}/gallon (Massachusetts averages, ${prices.oil.asOf})`,
    ...(town.gasRates || []).filter((k) => prices.gas[k]).map((k) => `natural gas from ${k} $${prices.gas[k].perTherm.toFixed(2)}/therm`),
    ...(town.electricRates || []).filter((k) => prices.electric[k]).map((k) => `electricity from ${k} ${(prices.electric[k].heatPumpCentsPerKwh || prices.electric[k].centsPerKwh).toFixed(1)}¢/kWh`),
  ];
  return `<h2>Heating costs in ${esc(town.name)}</h2><p>Current prices: ${esc(items.join('; '))}.</p>`;
}

function renderTownPage(indexHtml, town) {
  const { title, description } = townMeta(town);
  const url = `${SITE}/${town.slug}`;
  const photos = town.photos || [];
  const bySlug = Object.fromEntries(towns.map((t) => [t.slug, t]));
  const nearby = (town.nearby || []).map((s) => bySlug[s]).filter(Boolean);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HVACBusiness',
    name: 'Hanson Home',
    url,
    telephone: '+1-339-227-6775',
    image: `${SITE}/images/hanson-mascot.png`,
    areaServed: { '@type': 'City', name: `${town.name}, MA` },
  };
  const head = [
    `<link rel="canonical" href="${url}"/>`,
    `<meta property="og:title" content="${esc(title)}"/>`,
    `<meta property="og:description" content="${esc(description)}"/>`,
    `<meta property="og:url" content="${url}"/>`,
    `<meta property="og:type" content="website"/>`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('');
  const body = [
    `<main><h1>Heat-pump installation in ${esc(town.name)}, MA</h1>`,
    `<p>${town.installs ? `Hanson Home has installed ${town.installs}+ heat pumps in ${esc(town.name)} homes. ` : ''}`,
    `We help ${esc(town.name)} homeowners choose the right system, install it professionally and get comfortable with it, with clear project pricing from the start.</p>`,
    !town.utility
      ? ''
      : town.utilityType === 'municipal'
        ? `<p>${esc(town.name)} has its own municipal electric utility, so heat-pump incentives generally come through ${esc(town.utility)} rather than the Mass Save electric program.</p>`
        : `<p>${esc(town.name)} homes on ${esc(town.utility)} may qualify for Mass Save heat-pump incentives.</p>`,
    priceSummary(town),
    ...(town.notes || []).map((n) => `<p>${esc(n)}</p>`),
    ...photos.map(
      (p) =>
        `<img src="/images/towns/${esc(town.slug)}/${esc(p.file)}" alt="${esc(p.caption || `Heat-pump installation in ${town.name}, MA`)}"/>`,
    ),
    '<h2>Hanson Home installations</h2><p>Selected installations from customer homes in our Massachusetts service area. We leave out addresses and exact locations for privacy.</p>',
    ...installationPhotos.map((photo) =>
      `<img src="/images/installations/${esc(photo.file)}" alt="${esc(photo.alt)}"/>`,
    ),
    `<p><a href="/start?intent=heat-pump&amp;town=${encodeURIComponent(town.name)}">Get a ${esc(town.name)} heat-pump estimate</a></p>`,
    nearby.length ? `<p>Nearby: ${nearby.map((t) => `<a href="/${t.slug}">${esc(t.name)}</a>`).join(', ')}</p>` : '',
    `<p><a href="/service-area">All towns we serve</a></p></main>`,
  ].join('');
  const html = indexHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace('</head>', `${head}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  for (const marker of [`<title>${esc(title)}</title>`, `content="${esc(description)}"`, '<div id="root"><main>']) {
    if (!html.includes(marker)) throw new Error(`Town page ${town.slug}: could not inject ${marker}`);
  }
  return html;
}

module.exports = { towns, townMeta, renderTownPage };
