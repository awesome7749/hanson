const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createRequestsRouter } = require('../dist/routes/requests');

test('both lead endpoints require explicit tracking consent for Meta events', async () => {
  const events = [];
  const receipt = { id: 'test-lead', createdAt: new Date().toISOString(), status: 'new', created: true };
  const database = { createPartialRequest: async () => receipt, createWebsiteRequest: async () => receipt };
  const app = express().use(express.json()).use('/requests', createRequestsRouter(database, undefined, { capi: { send: async event => events.push(event) } }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const draft = { ...Object.fromEntries(['unit','size','year','concerns','gas','assessmentYear','discount','preferredDate','additionalName','additionalContact','referral'].map(key => [key, ''])), id: '11111111-1111-4111-8111-111111111111', intent: 'heat-pump', street: '12 Example Lane', city: 'Lexington', state: 'MA', zip: '02420', ownership: 'I own my home', homeType: 'Single-family', heating: 'Not sure', fuel: 'Oil', cooling: 'Window units', vents: 'Not sure', condition: 'Not sure', timeline: 'Just exploring', electric: 'Not sure', assessment: 'Not yet', firstName: 'Launch', lastName: 'Test', email: 'launch@example.com', phone: '202-555-0120', contactMethod: 'Email', language: 'English', additional: false, consent: true, marketing: false };
  try {
    for (const path of ['/partial', '/']) {
      for (const consent of [undefined, false, 'true', true]) {
        const before = events.length;
        const response = await fetch(`http://127.0.0.1:${server.address().port}/requests${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draft, trackingConsent: consent }) });
        assert.equal(response.status, 201);
        assert.equal(events.length - before, consent === true ? 1 : 0);
      }
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});

const { requiresTrackingConsent, canTrackRequest, requiresConsentForLocation } = require('../dist/services/trackingPolicy');
const { createApiRouter } = require('../dist/routes/api');
test('California and unknown IP locations require consent, including IPv6', () => {
  for (const ip of ['128.32.0.1', '127.0.0.1', undefined, 'bad-ip', '8.8.8.8', '2607:f8b0:4007:80b::200e']) assert.equal(requiresTrackingConsent(ip), true, ip);
  assert.equal(requiresTrackingConsent('18.0.0.1'), false);
  assert.equal(requiresConsentForLocation({ country: { iso_code: 'US' } }), true);
  assert.equal(requiresConsentForLocation({ country: { iso_code: 'US' }, subdivisions: [{ names: { en: 'Unknown' } }] }), true);
  assert.equal(requiresConsentForLocation({ country: { iso_code: 'GB' } }), false);
  assert.equal(canTrackRequest({ ip: '128.32.0.1', body: { trackingConsent: true, trackingConsentSource: 'regional' } }), false);
  assert.equal(canTrackRequest({ ip: '18.0.0.1', body: { trackingConsent: true, trackingConsentSource: 'regional' } }), true);
  assert.equal(canTrackRequest({ ip: '128.32.0.1', body: { trackingConsent: true, trackingConsentSource: 'explicit' } }), true);
  assert.equal(canTrackRequest({ ip: '18.0.0.1', body: { trackingConsent: false, trackingConsentSource: 'regional' } }), false);
});

test('policy uses the trusted proxy IP, ignores spoofed earlier entries and cannot be cached', async () => {
  const app = express();
  app.set('trust proxy', 1);
  app.use('/api', createApiRouter({}, {}, {}, {}, 'test-password'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    for (const [forwarded, required] of [['18.0.0.1, 128.32.0.1', true], ['128.32.0.1, 18.0.0.1', false], ['127.0.0.1', true]]) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/tracking-policy`, { headers: { 'X-Forwarded-For': forwarded } });
      assert.match(response.headers.get('cache-control'), /no-store/);
      assert.deepEqual(await response.json(), { requiresConsent: required });
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
