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
