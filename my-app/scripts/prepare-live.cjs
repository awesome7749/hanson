const fs = require('node:fs');
const path = require('node:path');
const { towns, renderTownPage } = require('./town-pages.cjs');
const { pages, renderPublicPage } = require('./seo-pages.cjs');
const { renderCalculatorPage, ROUTE: calculatorRoute } = require('./calculator-page.cjs');
const { articles, renderBlogArticle } = require('./blog-articles.cjs');
if (process.env.REACT_APP_DEPLOYMENT_MODE !== 'live') {
  throw new Error('The public build requires REACT_APP_DEPLOYMENT_MODE=live.');
}
const root = path.join(__dirname, '../build');
const htmlPath = path.join(root, 'index.html');
const shellHtml = fs.readFileSync(htmlPath, 'utf8');
fs.writeFileSync(path.join(root, 'app-shell.html'), shellHtml);
const indexHtml = shellHtml.replace('noindex,nofollow', 'index,follow');
fs.writeFileSync(path.join(root, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://hansonhome.us/sitemap.xml\n');
// /woburn is served from build/woburn.html (the server enables extensions: ['html']).
for (const town of towns) {
  fs.writeFileSync(path.join(root, town.slug + '.html'), renderTownPage(indexHtml, town));
}
for (const route of Object.keys(pages)) {
  fs.writeFileSync(route === '/' ? htmlPath : path.join(root, route.slice(1) + '.html'),
    route === calculatorRoute ? renderCalculatorPage(indexHtml) : renderPublicPage(indexHtml, route, towns));
}
fs.mkdirSync(path.join(root, 'blog'), { recursive: true });
for (const article of articles) {
  fs.writeFileSync(path.join(root, 'blog', article.slug + '.html'), renderBlogArticle(indexHtml, article));
}
const routes = [...Object.keys(pages).map(route => route === '/' ? '' : route), ...articles.map(article => '/blog/' + article.slug), ...towns.map(t => '/' + t.slug)];
fs.writeFileSync(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + routes.map(route => '<url><loc>https://hansonhome.us' + route + '</loc></url>').join('') + '</urlset>');
