const articles = require('../src/revamp/blogArticles.json');
const { replacePageHead } = require('./seo-pages.cjs');

const esc = (value) => String(value).replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
));

function renderBlogArticle(indexHtml, article) {
  const route = `/blog/${article.slug}`;
  const meta = { title: `${article.title} | Hanson Home`, description: article.description };
  const body = [
    `<main><article><header><p><a href="/blog">All homeowner guides</a></p><h1>${esc(article.title)}</h1>`,
    `<p>${esc(article.intro)}</p><p>Reviewed ${esc(article.reviewed)}</p></header>`,
    ...article.sections.map((section) => [
      `<section><h2>${esc(section.heading)}</h2>`,
      ...section.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`),
      `<p>Sources: ${section.sourceIds.map((id) => {
        const source = article.sources.find((item) => item.id === id);
        if (!source) throw new Error(`Unknown source ${id} in ${article.slug}`);
        return `<a href="#source-${esc(id)}">${esc(source.label)}</a>`;
      }).join(', ')}</p></section>`,
    ].join('')),
    `<aside><h2>${esc(article.ctaTitle)}</h2><p>${esc(article.ctaText)}</p><p><a href="/start?intent=heat-pump">Get my estimate</a></p></aside>`,
    '<footer><h2>Sources</h2><ul>',
    ...article.sources.map((source) => `<li id="source-${esc(source.id)}"><a href="${esc(source.url)}">${esc(source.label)}</a></li>`),
    '</ul></footer></article></main>',
  ].join('');
  return replacePageHead(indexHtml, meta, route)
    .replace('<meta property="og:type" content="website"/>', '<meta property="og:type" content="article"/>')
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

module.exports = { articles, renderBlogArticle };
