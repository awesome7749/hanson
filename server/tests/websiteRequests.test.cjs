const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { DatabaseService, prisma } = require('../dist/services/databaseService');
const { parseWebsiteRequest, websiteLeadData } = require('../dist/services/websiteRequest');
const { createApiRouter } = require('../dist/routes/api');
const { issueAdminToken, verifyAdminToken } = require('../dist/services/adminAuth');

function draft(intent = 'heat-pump') {
  const d = Object.fromEntries(['unit','size','year','concerns','gas','assessmentYear','discount','preferredDate','phone','additionalName','additionalContact','referral'].map(k => [k, '']));
  return { ...d, id: '11111111-1111-4111-8111-111111111111', intent, street: '12 Example Lane', city: 'Lexington', state: 'MA', zip: '02420', ownership: 'I own my home', homeType: 'Single-family', heating: 'Not sure', fuel: 'Oil', cooling: 'Window units', vents: 'Not sure', condition: 'Not sure', timeline: 'Just exploring', electric: 'Not sure', assessment: 'Not yet', firstName: 'Launch', lastName: 'Test', email: 'launch@example.com', phone: '202-555-0120', contactMethod: 'Email', language: 'English', additional: false, consent: true, marketing: false };
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
    for (const patch of [{ consent: false }, { zip: '10001' }, { contactMethod: 'invalid' }, { email: 'bad' }, { firstName: '' }, { phone: '' }, { phone: '123' }, { concerns: 'a'.repeat(4001) }]) {
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

test('partial leads save on step one, notify once and upgrade to full requests', async () => {
  const rows = new Map();
  const original = { upsert: prisma.lead.upsert, findUnique: prisma.lead.findUnique, create: prisma.lead.create, update: prisma.lead.update, transaction: prisma.$transaction };
  prisma.$transaction = callback => callback(prisma);
  prisma.lead.findUnique = async ({ where }) => rows.has(where.id) ? { id: where.id, ...rows.get(where.id) } : null;
  prisma.lead.create = async ({ data }) => { rows.set(data.id, { ...data, createdAt: new Date() }); return { id: data.id, ...rows.get(data.id) }; };
  prisma.lead.update = async ({ where, data }) => { rows.set(where.id, { ...rows.get(where.id), ...data }); return { id: where.id, ...rows.get(where.id) }; };
  prisma.lead.upsert = async ({ where, create }) => {
    if (!rows.has(where.id)) rows.set(where.id, { ...create, createdAt: new Date() });
    return { id: where.id, ...rows.get(where.id) };
  };
  const notices = [];
  const capiEvents = [];
  const db = new DatabaseService();
  const api = createApiRouter({}, {}, db, {}, 'test-password', undefined, {
    notifier: { partialLead: async notice => { notices.push(notice); } },
    capi: { send: async event => { capiEvents.push(event); } },
  });
  const app = express().use(express.json()).use('/api', api);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const post = (path, body) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const partial = { id: '44444444-4444-4444-8444-444444444444', intent: 'heat-pump', zip: '01801', firstName: 'Ada', lastName: 'Example', phone: '202-555-0155', email: '' };
    const utm = { utm_source: 'facebook', utm_medium: 'paid', utm_campaign: 'heatpump-leads', junk: 'dropped' };
    const first = await post('/requests/partial', { draft: partial, utm, fbp: 'fb.1.1.2', sourceUrl: 'https://hansonhome.us/start?intent=heat-pump' });
    assert.equal(first.status, 201);
    const receipt = (await first.json()).receipt;
    assert.equal(receipt.status, 'partial');
    assert.equal(notices.length, 1);
    assert.equal(notices[0].utm.utm_source, 'facebook');
    assert.equal(notices[0].utm.junk, undefined);
    assert.equal(capiEvents.length, 1);
    assert.equal(capiEvents[0].eventName, 'Lead');
    assert.equal(capiEvents[0].eventId, receipt.id);
    // A repeated step-one submit updates the contact but never re-notifies.
    const retry = await post('/requests/partial', { draft: { ...partial, phone: '202-555-0156' } });
    assert.equal(retry.status, 201);
    assert.equal((await retry.json()).receipt.id, receipt.id);
    assert.equal(rows.get(receipt.id).phone, '202-555-0156');
    assert.equal(notices.length, 1);
    for (const patch of [{ phone: '' }, { phone: '123' }, { zip: '10001' }, { firstName: '' }]) {
      assert.equal((await post('/requests/partial', { draft: { ...partial, ...patch } })).status, 400);
    }
    // The full request upgrades the same record and keeps ad attribution.
    const full = { ...draft(), id: partial.id, firstName: 'Ada', lastName: 'Example', phone: '202-555-0156' };
    const completed = await post('/requests', { draft: full });
    assert.equal(completed.status, 201);
    const completedReceipt = (await completed.json()).receipt;
    assert.equal(completedReceipt.id, receipt.id);
    assert.equal(rows.get(receipt.id).status, 'new');
    const saved = JSON.parse(rows.get(receipt.id).corrections);
    assert.equal(saved.partial, undefined);
    assert.equal(saved.utm.utm_source, 'facebook');
    assert.equal(saved.draft.street, '12 Example Lane');
    assert.equal(capiEvents.length, 2);
    assert.equal(capiEvents[1].eventName, 'CompleteRegistration');
    assert.equal(capiEvents[1].eventId, `${receipt.id}-complete`);
  } finally {
    prisma.lead.upsert = original.upsert;
    prisma.lead.findUnique = original.findUnique;
    prisma.lead.create = original.create;
    prisma.lead.update = original.update;
    prisma.$transaction = original.transaction;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
});

test('reviews and chat endpoints degrade gracefully and hand off phone numbers', async () => {
  const { createChatProvider } = require('../dist/services/chatService');
  const handoffs = [];
  const notifier = { partialLead: async () => {}, chatLead: async notice => { handoffs.push(notice); } };
  const api = createApiRouter({}, {}, {}, {}, 'test-password', undefined, { chat: createChatProvider(notifier) });
  const app = express().use(express.json()).use('/api', api);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const post = (path, body) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    // Reviews are optional: unconfigured deployments must not break the page.
    assert.deepEqual(await (await fetch(url + '/reviews')).json(), { configured: false });
    assert.equal((await post('/chat', {})).status, 400);
    const priced = await post('/chat', { sessionId: 'chat-1', messages: [{ role: 'visitor', text: 'How much does it cost?' }] });
    assert.equal(priced.status, 200);
    assert.match((await priced.json()).reply.text, /quote/i);
    const handoff = await post('/chat', { sessionId: 'chat-1', messages: [{ role: 'visitor', text: 'Sure, call me at 401-555-0123' }] });
    const reply = (await handoff.json()).reply;
    assert.equal(reply.handoff, true);
    assert.equal(handoffs.length, 1);
    assert.match(handoffs[0].phone, /401/);
    // A second phone message in the same session must not re-email the team.
    await post('/chat', { sessionId: 'chat-1', messages: [{ role: 'visitor', text: '401-555-0123 again' }] });
    assert.equal(handoffs.length, 1);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
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
