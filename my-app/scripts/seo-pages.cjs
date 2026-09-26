const pages = require('../src/revamp/seoPages.json');
const articles = require('../src/revamp/blogArticles.json');

const SITE = 'https://hansonhome.us';
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
));

function replacePageHead(indexHtml, page, route) {
  const url = SITE + route;
  let html = indexHtml
    .replace(/<title>[^<]*<\/title>/i, `<title>${esc(page.title)}</title>`)
    .replace(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i,
      `<meta name="description" content="${esc(page.description)}"/>`)
    .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/gi, '')
    .replace(/<meta\b(?=[^>]*\bproperty=["']og:(?:title|description|url|type|image)["'])[^>]*>\s*/gi, '');
  if (route !== '/') {
    html = html.replace(/<script\b[^>]*id=["']website-structured-data["'][^>]*>[\s\S]*?<\/script>\s*/i, '');
  }
  const head = [
    `<link rel="canonical" href="${url}"/>`,
    `<meta property="og:title" content="${esc(page.title)}"/>`,
    `<meta property="og:description" content="${esc(page.description)}"/>`,
    `<meta property="og:url" content="${url}"/>`,
    '<meta property="og:type" content="website"/>',
    `<meta property="og:image" content="${SITE}/logo512.png"/>`,
  ].join('');
  html = html.replace('</head>', `${head}</head>`);
  if (!html.includes(`<title>${esc(page.title)}</title>`) || !html.includes(`href="${url}"`)) {
    throw new Error(`Could not generate metadata for ${route}`);
  }
  return html;
}

function renderPublicPage(indexHtml, route, towns = []) {
  const page = pages[route];
  if (!page) throw new Error(`No public SEO page defined for ${route}`);
  const body = [
    `<main><h1>${esc(page.heading)}</h1><p>${esc(page.intro)}</p>`,
    '<h2>What to know</h2><ul>',
    ...page.highlights.map((text) => `<li>${esc(text)}</li>`),
    '</ul>',
    ...(route === '/service-area'
      ? ['<h2>Towns we serve</h2><ul>',
        ...towns.map((town) => `<li><a href="/${esc(town.slug)}">${esc(town.name)}, MA</a></li>`),
        '</ul>']
      : []),
    ...(route === '/blog'
      ? ['<h2>Latest articles</h2><ul>',
        ...articles.map((article) => `<li><a href="/blog/${esc(article.slug)}">${esc(article.title)}</a> — ${esc(article.summary)}</li>`),
        '</ul>']
      : []),
    '<nav aria-label="Related pages"><ul>',
    ...page.links.map((link) => `<li><a href="${esc(link.path)}">${esc(link.label)}</a></li>`),
    '</ul></nav></main>',
  ].join('');
  const html = replacePageHead(indexHtml, page, route)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  if (!html.includes('<div id="root"><main>')) throw new Error(`Could not render ${route}`);
  return html;
}

module.exports = { pages, replacePageHead, renderPublicPage };
