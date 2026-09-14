const fs = require('node:fs');
const path = require('node:path');
if (process.env.REACT_APP_DEPLOYMENT_MODE !== 'live') {
  throw new Error('The public build requires REACT_APP_DEPLOYMENT_MODE=live.');
}
const root = path.join(__dirname, '../build');
const htmlPath = path.join(root, 'index.html');
fs.writeFileSync(htmlPath, fs.readFileSync(htmlPath, 'utf8').replace('noindex,nofollow', 'index,follow'));
fs.writeFileSync(path.join(root, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /staff\nDisallow: /project\nDisallow: /api/\nSitemap: https://hansonhome.us/sitemap.xml\n');
const routes = ['', '/heat-pumps', '/pricing', '/assessment', '/how-it-works', '/warranty', '/about', '/service-area', '/contact', '/privacy'];
fs.writeFileSync(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + routes.map(route => '<url><loc>https://hansonhome.us' + route + '</loc></url>').join('') + '</urlset>');
