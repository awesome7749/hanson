const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseCsv, extractLeads, withinSendWindow, renderTemplate, FbLeadSmsPoller, DEFAULT_TEMPLATE,
} = require('../dist/services/fbLeadSms');

const HEADER = 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,form_name,is_organic,platform,what_are_you_looking_for?,when_are_you_looking_to_install?,email,full_name,phone_number,zip_code,lead_status';

function row(id, time, name, phone, zip = '01960') {
  return `${id},${time},ag:1,"Quote, with comma",as:1,Instant Form - MA,c:1,Heatpump Leads,f:1,Form,false,fb,whole-home,asap,x@y.com,${name},p:${phone},z:${zip},CREATED`;
}

test('CSV parsing honors quoted commas and test rows are dropped', () => {
  const csv = [
    HEADER,
    row('l:1', '2026-10-06T07:24:15-05:00', 'Linda Gillingham', '+16037236264', '03581'),
    'l:2,2026-10-06T08:00:00-05:00,,,,,,,f:1,Form,true,,<test lead: dummy data>,<test lead: dummy>,test@meta.com,<test lead: dummy>,p:<test lead: dummy>,z:<dummy>,CREATED',
    row('l:3', '2026-10-06T09:00:00-05:00', 'No Phone', 'invalid'),
  ].join('\n');
  const parsed = parseCsv(csv);
  assert.equal(parsed[1][3], 'Quote, with comma');
  const leads = extractLeads(csv);
  assert.equal(leads.length, 1);
  assert.equal(leads[0].id, 'l:1');
  assert.equal(leads[0].phone, '+16037236264');
  assert.equal(leads[0].zip, '03581');
});

test('send window is 8:00-20:30 Eastern', () => {
  assert.equal(withinSendWindow(new Date('2026-10-07T03:00:00-04:00')), false); // 3 AM ET
  assert.equal(withinSendWindow(new Date('2026-10-07T08:00:00-04:00')), true);
  assert.equal(withinSendWindow(new Date('2026-10-07T20:30:00-04:00')), true);
  assert.equal(withinSendWindow(new Date('2026-10-07T21:00:00-04:00')), false);
});

test('template renders first name with fallback', () => {
  const lead = { id: 'l:1', createdTime: new Date(), name: 'Jaqueline Duarte', phone: '+17814694819', zip: '01960', adName: '' };
  assert.match(renderTemplate(DEFAULT_TEMPLATE, lead), /^Hi Jaqueline, this is Hanson Home/);
  assert.match(renderTemplate('{firstName}', { ...lead, name: '' }), /^there$/);
});

function memoryPrisma() {
  const rows = new Map();
  return {
    rows,
    fbLeadSms: {
      findUnique: async ({ where }) => rows.get(where.id) || null,
      create: async ({ data }) => { rows.set(data.id, data); return data; },
      update: async ({ where, data }) => { const r = { ...rows.get(where.id), ...data }; rows.set(where.id, r); return r; },
    },
  };
}

test('poller texts fresh leads once, skips backlog, holds overnight leads', async () => {
  const now = new Date('2026-10-07T10:00:00-04:00'); // inside window
  const fresh = row('l:new', '2026-10-07T09:30:00-04:00', 'Fresh Lead', '+15085550100');
  const old = row('l:old', '2026-10-03T01:02:48-05:00', 'Old Lead', '+15085550101');
  const csv = [HEADER, fresh, old].join('\n');
  const sent = [];
  const prisma = memoryPrisma();
  const poller = new FbLeadSmsPoller(
    { sheetId: 'sheet', knownGids: ['1'], template: DEFAULT_TEMPLATE },
    {
      fetchText: async url => (url.includes('htmlview') ? 'gid=1' : csv),
      sendSms: async (to, text) => sent.push({ to, text }),
      prisma,
      now: () => now,
    },
  );

  await poller.poll();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, '+15085550100');
  assert.match(sent[0].text, /Hi Fresh, this is Hanson Home/);
  assert.equal(prisma.rows.get('l:new').status, 'sent');
  assert.equal(prisma.rows.get('l:old').status, 'skipped_backlog');

  // Second poll: nothing new, nothing re-sent.
  await poller.poll();
  assert.equal(sent.length, 1);

  // Overnight lead is held (no row written), then sent when the window opens.
  const night = new Date('2026-10-08T02:00:00-04:00');
  const nightCsv = [HEADER, fresh, old, row('l:night', '2026-10-08T01:45:00-04:00', 'Night Owl', '+15085550102')].join('\n');
  const nightPoller = new FbLeadSmsPoller(
    { sheetId: 'sheet', knownGids: ['1'], template: DEFAULT_TEMPLATE },
    { fetchText: async url => (url.includes('htmlview') ? '' : nightCsv), sendSms: async (to, text) => sent.push({ to, text }), prisma, now: () => night },
  );
  await nightPoller.poll();
  assert.equal(prisma.rows.has('l:night'), false);
  assert.equal(sent.length, 1);

  const morning = new Date('2026-10-08T08:05:00-04:00');
  const morningPoller = new FbLeadSmsPoller(
    { sheetId: 'sheet', knownGids: ['1'], template: DEFAULT_TEMPLATE },
    { fetchText: async url => (url.includes('htmlview') ? '' : nightCsv), sendSms: async (to, text) => sent.push({ to, text }), prisma, now: () => morning },
  );
  await morningPoller.poll();
  assert.equal(sent.length, 2);
  assert.equal(sent[1].to, '+15085550102');
  assert.equal(prisma.rows.get('l:night').status, 'sent');
});

test('send failure is recorded and not retried into a duplicate text', async () => {
  const now = new Date('2026-10-07T10:00:00-04:00');
  const csv = [HEADER, row('l:f', '2026-10-07T09:45:00-04:00', 'Fail Case', '+15085550103')].join('\n');
  const prisma = memoryPrisma();
  let attempts = 0;
  const poller = new FbLeadSmsPoller(
    { sheetId: 'sheet', knownGids: ['1'], template: DEFAULT_TEMPLATE },
    {
      fetchText: async url => (url.includes('htmlview') ? '' : csv),
      sendSms: async () => { attempts++; throw new Error('RC down'); },
      prisma,
      now: () => now,
    },
  );
  await poller.poll();
  await poller.poll();
  assert.equal(attempts, 1);
  assert.equal(prisma.rows.get('l:f').status, 'failed');
  assert.match(prisma.rows.get('l:f').error, /RC down/);
});
