const { test } = require('node:test');
const assert = require('node:assert/strict');
const { siteRoute } = require('../dist/services/siteRouting');

test('canonicalizes alternate page URLs', () => {
  assert.deepEqual(siteRoute('/acton/'), { redirect: '/acton', redirectStatus: 308, appOnly: false });
  assert.deepEqual(siteRoute('/contact/'), { redirect: '/contact', redirectStatus: 308, appOnly: false });
  assert.deepEqual(siteRoute('/products'), { redirect: '/heat-pumps', redirectStatus: 301, appOnly: false });
  assert.deepEqual(siteRoute('/get-quote'), { redirect: '/start', redirectStatus: 301, appOnly: false });
  assert.deepEqual(siteRoute('/staff'), { redirect: '/admin', redirectStatus: 301, appOnly: false });
});

test('keeps staff and request flows available without indexing them', () => {
  for (const path of ['/admin', '/start', '/start/thank-you', '/project', '/project/abc']) {
    assert.deepEqual(siteRoute(path), { appOnly: true });
  }
  assert.deepEqual(siteRoute('/missing'), { appOnly: false });
  assert.deepEqual(siteRoute('/acton'), { appOnly: false });
});
