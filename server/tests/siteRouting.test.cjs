const { test } = require('node:test');
const assert = require('node:assert/strict');
const { siteRoute, isOpsHost, apiAllowedOnHost, opsPage } = require('../dist/services/siteRouting');

test('canonicalizes alternate page URLs', () => {
  assert.deepEqual(siteRoute('/acton/'), { redirect: '/acton', redirectStatus: 308, appOnly: false });
  assert.deepEqual(siteRoute('/contact/'), { redirect: '/contact', redirectStatus: 308, appOnly: false });
  assert.deepEqual(siteRoute('/products'), { redirect: '/heat-pumps', redirectStatus: 301, appOnly: false });
  assert.deepEqual(siteRoute('/get-quote'), { redirect: '/start', redirectStatus: 301, appOnly: false });
  assert.deepEqual(siteRoute('/staff'), { appOnly: false });
});

test('keeps request flows available without indexing them', () => {
  for (const path of ['/start', '/start/thank-you', '/project', '/project/abc']) {
    assert.deepEqual(siteRoute(path), { appOnly: true });
  }
  assert.deepEqual(siteRoute('/admin'), { appOnly: false });
  assert.deepEqual(siteRoute('/missing'), { appOnly: false });
  assert.deepEqual(siteRoute('/acton'), { appOnly: false });
});

test('serves staff routes only on the ops hostname', () => {
  assert.equal(isOpsHost('ops.hansonhome.us'), true);
  assert.equal(isOpsHost('OPS.HANSONHOME.US:443'), true);
  assert.equal(isOpsHost('hansonhome.us'), false);
  for (const path of ['/admin/login', '/admin/leads', '/leads/123', '/rentcast', '/predict-hvac']) {
    assert.equal(apiAllowedOnHost(path, 'ops.hansonhome.us'), true, path);
    assert.equal(apiAllowedOnHost(path, 'hansonhome.us'), false, path);
    assert.equal(apiAllowedOnHost(path, 'hanson-app.example.run.app'), false, path);
  }
  for (const path of ['/requests', '/requests/partial', '/reviews', '/chat']) {
    assert.equal(apiAllowedOnHost(path, 'ops.hansonhome.us'), false, path);
    assert.equal(apiAllowedOnHost(path, 'hansonhome.us'), true, path);
  }
  assert.equal(opsPage('/'), 'dashboard');
  assert.equal(opsPage('/static/js/main.js'), 'asset');
  assert.equal(opsPage('/robots.txt'), 'robots');
  assert.equal(opsPage('/admin'), 'missing');
  assert.equal(opsPage('/woburn'), 'missing');
});
