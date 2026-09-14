const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { DatabaseService, prisma } = require('../dist/services/databaseService');
const { parseWebsiteRequest, websiteLeadData } = require('../dist/services/websiteRequest');
const { createApiRouter } = require('../dist/routes/api');
const { issueAdminToken, verifyAdminToken } = require('../dist/services/adminAuth');

function draft(intent = 'heat-pump') {
  const d = Object.fromEntries(['unit','size','year','concerns','gas','assessmentYear','discount','preferredDate','phone','additionalName','additionalContact','referral'].map(k => [k, '']));
  return { ...d, id: '11111111-1111-4111-8111-111111111111', intent, street: '12 Example Lane', city: 'Lexington', state: 'MA', zip: '02420', ownership: 'I own my home', homeType: 'Single-family', heating: 'Not sure', fuel: 'Oil', cooling: 'Window units', vents: 'Not sure', condition: 'Not sure', timeline: 'Just exploring', electric: 'Not sure', assessment: 'Not yet', firstName: 'Launch', lastName: 'Test', email: 'launch@example.com', contactMethod: 'Email', language: 'English', additional: false, consent: true, marketing: false };
}

test('basic requests validate, save once, preserve answers and stay private', async () => {
  const rows = new Map();
  const deliveries = new Map();
  const original = prisma.lead.upsert;
  const originalDelivery = prisma.partnerDelivery.upsert;
  const originalTransaction = prisma.$transaction;
  prisma.$transaction = callback => callback(prisma);
  prisma.lead.upsert = async ({ where, create, update }) => {
    assert.deepEqual(update, {});
    if (!rows.has(where.id)) rows.set(where.id, { ...create, createdAt: new Date() });
    return rows.get(where.id);
  };
  prisma.partnerDelivery.upsert = async ({ where, create, update }) => {
    assert.deepEqual(update, {});
    if (!deliveries.has(where.leadId)) deliveries.set(where.leadId, create);
    return deliveries.get(where.leadId);
  };
  const db = new DatabaseService();
  let failed = false;
  const service = { createWebsiteRequest: (d, enabled) => failed ? Promise.reject(new Error('private database connection details')) : db.createWebsiteRequest(d, enabled) };
  // Basic intake remains usable when the optional partner service is disabled.
  const api = createApiRouter({}, {}, service, {}, 'test-password');
  const app = express().use(express.json()).use('/api', api);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const post = (path, body) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const d = draft();
    const first = await post('/requests', { draft: d });
    assert.equal(first.status, 201);
    const result = await first.json();
    assert.deepEqual(Object.keys(result.receipt).sort(), ['createdAt', 'id', 'status']);
    const retry = await post('/requests', { draft: d });
    assert.deepEqual(await retry.json(), result);
    assert.equal(rows.size, 1);
    assert.deepEqual(JSON.parse([...rows.values()][0].corrections).draft, parseWebsiteRequest(d));
    const changed = await post('/requests', { draft: { ...d, city: 'Boston' } });
    assert.equal(changed.status, 409);
    for (const patch of [{ consent: false }, { zip: '10001' }, { contactMethod: 'invalid' }, { email: 'bad' }, { firstName: '' }, { concerns: 'a'.repeat(4001) }]) {
      assert.equal((await post('/requests', { draft: { ...d, ...patch } })).status, 400);
    }
    const assessment = { ...draft('assessment'), id: '22222222-2222-4222-8222-222222222222', heating: '', cooling: '', vents: '', condition: '', contactMethod: 'Phone call', phone: '202-555-0110', email: '' };
    const saved = await post('/requests', { draft: assessment });
    assert.equal(saved.status, 201);
    assert.equal((await saved.json()).receipt.status, 'assessment_requested');
    assert.equal(rows.size, 2);
    assert.equal(deliveries.size, 0, 'Historical clients without sharing permission stay local');
    for (const [index, intent] of ['heat-pump', 'assessment'].entries()) {
      const consented = { ...draft(intent), id: `33333333-3333-4333-8333-33333333333${index}`, partnerConsent: true };
      const receipt = await db.createWebsiteRequest(parseWebsiteRequest(consented), true);
      assert.ok(deliveries.has(receipt.id), `${intent} must have a delivery record`);
      assert.match(deliveries.get(receipt.id).payload.notes, /^Request type:/);
      assert.equal(JSON.parse(rows.get(receipt.id).corrections).draft.partnerConsent, true);
      assert.deepEqual(await db.createWebsiteRequest(parseWebsiteRequest(consented), true), receipt);
      assert.equal(deliveries.size, index + 1, 'A retry must reuse the delivery');
    }
    failed = true;
    const failure = await post('/requests', { draft: d });
    assert.equal(failure.status, 503);
    assert.ok(!(await failure.text()).includes('private database'));
    assert.equal((await fetch(url + '/admin/leads')).status, 401);
    assert.equal((await fetch(url + '/leads/' + result.receipt.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{"adminNotes":"changed"}' })).status, 401);
    for (const path of ['/leads', '/rentcast', '/predict-hvac', '/leads/x/predict', '/leads/x/photos']) assert.equal((await post(path, {})).status, 401);
  } finally {
    prisma.lead.upsert = original;
    prisma.partnerDelivery.upsert = originalDelivery;
    prisma.$transaction = originalTransaction;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
});

test('staff tokens survive instance changes and reject tampering or expiry', () => {
  const now = Date.now();
  const token = issueAdminToken('test-password', now);
  assert.ok(verifyAdminToken(token, 'test-password', now));
  assert.ok(!verifyAdminToken(token, 'other-password', now));
  assert.ok(!verifyAdminToken(token + 'x', 'test-password', now));
  assert.ok(!verifyAdminToken(token, 'test-password', now + 8 * 60 * 60 * 1000));
  assert.notEqual(websiteLeadData(parseWebsiteRequest(draft())).id, draft().id);
});
