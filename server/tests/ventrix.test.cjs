const { test } = require('node:test');
const assert = require('node:assert/strict');
const { VentrixService } = require('../dist/services/ventrixService');
const { ventrixPayload } = require('../dist/services/ventrixPayload');
const { createRequestsRouter } = require('../dist/routes/requests');
const express = require('express');

const draft = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', intent: 'assessment', street: '12 Example Lane', unit: '2', city: 'Woburn', state: 'MA', zip: '01801', ownership: 'I own my home', homeType: 'Single-family', size: '', year: '', heating: '', fuel: 'Oil', cooling: '', vents: '', condition: '', timeline: 'Just exploring', concerns: 'Synthetic test', electric: 'Not sure', gas: '', assessment: 'Not yet', assessmentYear: '', discount: '', preferredDate: '2099-01-01', firstName: 'Test', lastName: 'Example', email: 'test@example.com', phone: '202-555-0110', contactMethod: 'Email', language: 'English', additional: false, additionalName: '', additionalContact: '', consent: true, partnerConsent: true, marketing: false, referral: '',
};
function memoryStore() {
  let row = { leadId: 'web-test', status: 'pending', payload: ventrixPayload('web-test', draft), attempts: 0, updatedAt: new Date(), lastAttemptAt: null, remoteId: null, sentAt: null, lastError: null };
  return {
    get: async () => ({ ...row }),
    claim: async (snapshot, token) => {
      if (row.status !== snapshot.status || row.attempts !== snapshot.attempts) return false;
      row = { ...row, status: 'sending', attempts: row.attempts + 1, lastAttemptAt: new Date(), claimToken: token };
      return true;
    },
    finish: async (id, token, status, error, remoteId) => {
      assert.equal(row.claimToken, token);
      row = { ...row, status, lastError: error, remoteId: remoteId || null, sentAt: remoteId ? new Date() : null, claimToken: null };
    },
  };
}
test('maps both request types into documented fields and requires sharing permission', () => {
  const p = ventrixPayload('web-test', draft);
  assert.equal(p.address, '12 Example Lane, Unit 2');
  assert.equal(p.zip, '01801');
  assert.equal(p.phone, '+12025550110');
  assert.match(p.notes, /Preferred contact method: Email/);
  assert.equal(p.preferred_hea_date, '2099-01-01');
  assert.match(p.notes, /^Request type: Home Energy Assessment \(HEA\)/);
  assert.ok(!('marketing' in p));
  const heatPump = ventrixPayload('web-heat-pump', { ...draft, intent: 'heat-pump', heating: 'Furnace', fuel: 'Oil', vents: 'Yes' });
  assert.equal(heatPump.external_lead_id, 'web-heat-pump');
  assert.match(heatPump.notes, /^Request type: Heat-pump installation \/ quote/);
  assert.match(heatPump.notes, /Heating system: Furnace/);
  assert.ok(!('preferred_hea_date' in heatPump));
  for (const intent of ['assessment', 'heat-pump']) {
    assert.throws(() => ventrixPayload('web-test', { ...draft, intent, partnerConsent: false }));
    assert.throws(() => ventrixPayload('web-test', { ...draft, intent, consent: false }));
  }
});
test('concurrent delivery and repeated submissions send once and retain the Ventrix ID', async () => {
  let calls = 0;
  const store = memoryStore();
  const service = new VentrixService(store, 'private-test-key', async (url, request) => {
    calls++;
    assert.equal(url, 'https://erp.ventrixsupply.com/api/d2d/partner-portal/submit');
    assert.equal(request.headers['X-Api-Key'], 'private-test-key');
    assert.equal(request.redirect, 'error');
    return { ok: true, json: async () => ({ success: true, id: 'ventrix-test-id' }) };
  });
  await Promise.all([service.deliver('web-test'), service.deliver('web-test')]);
  await service.deliver('web-test', { retry: true });
  assert.equal(calls, 1);
  assert.equal((await store.get()).remoteId, 'ventrix-test-id');
});
test('timeouts remain uncertain and require an explicit duplicate check before retry', async () => {
  let calls = 0;
  const store = memoryStore();
  const service = new VentrixService(store, 'private-test-key', async (_, request) => {
    calls++;
    return new Promise((resolve, reject) => request.signal.addEventListener('abort', () => reject(new Error('private-test-key confidential payload'))));
  }, 10);
  await service.deliver('web-test');
  await service.deliver('web-test', { retry: true });
  assert.equal(calls, 1);
  const row = await store.get();
  assert.equal(row.status, 'unknown');
  assert.ok(!row.lastError.includes('private-test-key'));
  await service.deliver('web-test', { retry: true, confirmDuplicateCheck: true });
  assert.equal(calls, 2);
});
test('definite rejection is visible and staff can retry after fixing the connection', async () => {
  const store = memoryStore();
  await new VentrixService(store, 'key', async () => ({ ok: false, status: 401 })).deliver('web-test');
  assert.equal((await store.get()).status, 'failed');
  await new VentrixService(store, 'new-key', async () => ({ ok: true, json: async () => ({ success: true, id: 'recovered' }) })).deliver('web-test', { retry: true });
  assert.equal((await store.get()).status, 'sent');
});
test('partner failure never loses either local request; sharing needs permission', async () => {
  let queued;
  let saved = 0;
  let forwarded = 0;
  const database = { createWebsiteRequest: async (d, enabled) => { saved++; queued = enabled && d.partnerConsent; return { id: 'web-test', createdAt: new Date(), status: d.intent === 'assessment' ? 'assessment_requested' : 'new' }; } };
  const partner = { deliver: async () => { forwarded++; throw new Error('private connection details'); } };
  const app = express().use(express.json()).use('/api/requests', createRequestsRouter(database, partner));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const send = d => fetch(`http://127.0.0.1:${server.address().port}/api/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draft: d }) });
  try {
    const response = await send(draft);
    assert.equal(response.status, 201); assert.equal((await response.json()).receipt.id, 'web-test');
    assert.equal(queued, true); assert.equal(forwarded, 1);
    const stale = await send({ ...draft, partnerConsent: false });
    assert.equal(stale.status, 400);
    assert.match((await stale.json()).error, /Refresh this page/);
    assert.equal(saved, 1); assert.equal(forwarded, 1);
    const heatPump = { ...draft, intent: 'heat-pump', heating: 'Not sure', cooling: 'Not sure', vents: 'Not sure', condition: 'Not sure' };
    const responseHP = await send(heatPump);
    assert.equal(responseHP.status, 201); assert.equal((await responseHP.json()).receipt.status, 'new');
    assert.equal(queued, true); assert.equal(forwarded, 2);
    for (const value of [false, undefined]) {
      const oldForm = await send({ ...heatPump, partnerConsent: value });
      assert.equal(oldForm.status, 400);
      assert.match((await oldForm.json()).error, /Your answers will be kept/);
    }
    assert.equal(saved, 2); assert.equal(forwarded, 2);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
