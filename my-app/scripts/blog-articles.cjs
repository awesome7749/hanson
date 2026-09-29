const articles = [...require('../src/revamp/blogArticles.json'), ...require('../src/revamp/blogTranslations.json')];
const { replacePageHead } = require('./seo-pages.cjs');
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
));
const sectionId = (section, index) => section.id || `section-${index + 1}`;

function renderBlogArticle(indexHtml, article) {
  const route = `/blog/${article.slug}`;
  const ui = { back: 'All homeowner guides', reviewed: 'Reviewed', minutes: 'minute read', contents: 'In this guide', sources: 'Sources', language: 'Article language', ...article.ui };
  const languages = article.translationGroup ? articles.filter((item) => item.translationGroup === article.translationGroup) : [];
  const meta = { title: `${article.title} | Hanson Home`, description: article.description };
  const citations = (ids, numbered = false) => ids.map((id) => {
    const index = article.sources.findIndex((item) => item.id === id);
    if (index < 0) throw new Error(`Unknown source ${id} in ${article.slug}`);
    return `<a href="#source-${esc(id)}"${numbered ? ` aria-label="${esc(article.sources[index].label)}"` : ''}>${numbered ? `[${index + 1}]` : esc(article.sources[index].label)}</a>`;
  }).join(', ');
  const renderTable = (table) => `<div role="region" aria-label="${esc(table.caption)}" tabindex="0"><table><caption>${esc(table.caption)}</caption><thead><tr>${table.columns.map((column) => `<th scope="col">${esc(column)}</th>`).join('')}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.cells.map((cell, index) => index === 0 ? `<th scope="row">${esc(cell)}${row.sourceIds ? ` ${citations(row.sourceIds, true)}` : ''}</th>` : `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const body = [
    `<main><article lang="${esc(article.locale || 'en')}"><header><p><a href="/blog">${esc(ui.back)}</a></p>`,
    languages.length > 1 ? `<nav aria-label="${esc(ui.language)}">${languages.map((item) => `<a href="/blog/${esc(item.slug)}" lang="${esc(item.locale)}" hreflang="${esc(item.locale)}"${item.slug === article.slug ? ' aria-current="page"' : ''}>${esc(item.languageLabel)}</a>`).join(' · ')}</nav>` : '',
    `<h1>${esc(article.title)}</h1>`,
    `<p>${esc(article.intro)}</p><p>${esc(ui.reviewed)} ${esc(article.reviewed)}${article.readingMinutes ? ` · ${article.readingMinutes} ${esc(ui.minutes)}` : ''}</p></header>`,
    article.disclosure ? `<p>${esc(article.disclosure)}</p>` : '',
    article.image ? `<figure><img src="${esc(article.image.src)}" alt="${esc(article.image.alt)}" width="1800" height="1350"/><figcaption>${esc(article.image.caption)}</figcaption></figure>` : '',
    article.showContents ? `<nav aria-label="${esc(ui.contents)}"><h2>${esc(ui.contents)}</h2><ol>${article.sections.map((section, index) => `<li><a href="#${esc(sectionId(section, index))}">${esc(section.heading)}</a></li>`).join('')}</ol></nav>` : '',
    ...article.sections.map((section, index) => [
      `<section id="${esc(sectionId(section, index))}"><h2>${esc(section.heading)}</h2>`,
      ...section.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`),
      section.bullets ? `<ul>${section.bullets.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : '',
      section.table ? renderTable(section.table) : '',
      section.takeaway ? `<aside><p>${esc(section.takeaway)}</p></aside>` : '',
      section.sourceIds.length ? `<p>${esc(ui.sources)}: ${citations(section.sourceIds)}</p>` : '',
      '</section>',
    ].join('')),
    `<aside><h2>${esc(article.ctaTitle)}</h2><p>${esc(article.ctaText)}</p><p><a href="${esc(article.ctaPath || '/start?intent=heat-pump')}">${esc(article.ctaLabel || 'Get my estimate')}</a></p></aside>`,
    `<footer><h2>${esc(ui.sources)}</h2>${ui.sourceIntro ? `<p>${esc(ui.sourceIntro.replace('{date}', article.reviewed))}</p>` : ''}<ol>`,
    ...article.sources.map((source) => `<li id="source-${esc(source.id)}"><a href="${esc(source.url)}">${esc(source.label)}</a>${source.note ? `<p>${esc(source.note)}</p>` : ''}</li>`),
    '</ol></footer></article></main>',
  ].join('');
  const structuredData = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: article.title, description: article.description,
    inLanguage: article.locale || 'en',
    url: `https://hansonhome.us${route}`, mainEntityOfPage: `https://hansonhome.us${route}`,
    author: { '@type': 'Organization', name: 'Hanson Home', url: 'https://hansonhome.us/' },
    publisher: { '@type': 'Organization', name: 'Hanson Home', url: 'https://hansonhome.us/' },
    ...(article.reviewedIso ? { dateModified: article.reviewedIso } : {}),
    ...(article.image ? { image: `https://hansonhome.us${article.image.src}` } : {}),
  };
  let html = replacePageHead(indexHtml, meta, route)
    .replace(/<html\b[^>]*>/, `<html lang="${esc(article.locale || 'en')}">`)
    .replace('<meta property="og:type" content="website"/>', '<meta property="og:type" content="article"/>')
    .replace('</head>', `<script id="blog-structured-data" type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script></head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  if (languages.length > 1) html = html.replace('</head>', languages.map((item) => `<link rel="alternate" data-blog-language="true" hreflang="${esc(item.locale)}" href="https://hansonhome.us/blog/${esc(item.slug)}"/>`).join('') + `<link rel="alternate" data-blog-language="true" hreflang="x-default" href="https://hansonhome.us/blog/${esc(article.translationGroup)}"/></head>`);
  html = html.replace('</head>', `<meta property="og:locale" content="${({ es: 'es_US', 'zh-Hans': 'zh_CN', 'pt-BR': 'pt_BR' })[article.locale] || 'en_US'}"/></head>`);
  if (article.image) html = html.replace('content="https://hansonhome.us/logo512.png"', `content="https://hansonhome.us${esc(article.image.src)}"`);
  return html;
}
module.exports = { articles, renderBlogArticle };
