const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseCsv, extractLeads, withinSendWindow, renderTemplate, buildAlertText,
  FbLeadSmsPoller, DEFAULT_TEMPLATE, DEFAULT_FOLLOWUP_TEMPLATE,
} = require('../dist/services/fbLeadSms');

const HEADER = 'id,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,form_name,is_organic,platform,what_are_you_looking_for?,when_are_you_looking_to_install?,email,full_name,phone_number,zip_code,lead_status';

function row(id, time, name, phone, zip = '01960') {
  return `${id},${time},ag:1,"Quote, with comma",as:1,Instant Form - MA,c:1,Heatpump Leads,f:1,Form,false,fb,whole-home_heat_pump,as_soon_as_possible,x@y.com,${name},p:${phone},z:${zip},CREATED`;
}

const CFG = (over = {}) => ({
  sheetId: 'sheet', knownGids: ['1'], template: DEFAULT_TEMPLATE,
  alertTo: ['+17653379678', '+14016123443'],
  bookingUrl: '', followupTemplate: DEFAULT_FOLLOWUP_TEMPLATE, followupAfterMs: 24 * 3600 * 1000,
  ...over,
});

function memoryPrisma() {
  const rows = new Map();
  return {
    rows,
    fbLeadSms: {
      findUnique: async ({ where }) => rows.get(where.id) || null,
      findMany: async ({ where }) => [...rows.values()].filter(r =>
        (!('status' in where) || r.status === where.status) &&
        (!('followupSentAt' in where) || (r.followupSentAt ?? null) === where.followupSentAt)),
      create: async ({ data }) => { rows.set(data.id, { sentAt: null, followupSentAt: null, ...data }); return data; },
      update: async ({ where, data }) => { const r = { ...rows.get(where.id), ...data }; rows.set(where.id, r); return r; },
    },
  };
}

test('CSV parsing honors quoted commas; test rows and bad phones dropped; intent extracted', () => {
  const csv = [
    HEADER,
    row('l:1', '2026-10-06T07:24:15-05:00', 'Linda Gillingham', '+16037236264', '03581'),
    'l:2,2026-10-06T08:00:00-05:00,,,,,,,f:1,Form,true,,<test lead: dummy data>,<test lead: dummy>,test@meta.com,<test lead: dummy>,p:<test lead: dummy>,z:<dummy>,CREATED',
    row('l:3', '2026-10-06T09:00:00-05:00', 'No Phone', 'invalid'),
  ].join('\n');
  assert.equal(parseCsv(csv)[1][3], 'Quote, with comma');
  const leads = extractLeads(csv);
  assert.equal(leads.length, 1);
  assert.equal(leads[0].phone, '+16037236264');
  assert.equal(leads[0].looking, 'whole-home heat pump');
  assert.equal(leads[0].timeline, 'as soon as possible');
});

test('alert text includes contact, intent, and out-of-state flag', () => {
  const [nh] = extractLeads([HEADER, row('l:1', '2026-10-06T07:24:15-05:00', 'Linda Gillingham', '+16037236264', '03581')].join('\n'));
  assert.match(buildAlertText(nh), /^Hanson new lead: Linda Gillingham \+16037236264 \| zip 03581 \(OUT OF STATE\) \| whole-home heat pump \| as soon as possible\./);
  const [ma] = extractLeads([HEADER, row('l:2', '2026-10-06T07:24:15-05:00', 'Jaqueline Duarte', '+17814694819', '01960')].join('\n'));
  assert.doesNotMatch(buildAlertText(ma), /OUT OF STATE/);
});

test('send window is 8:00-20:30 Eastern', () => {
  assert.equal(withinSendWindow(new Date('2026-10-07T03:00:00-04:00')), false);
  assert.equal(withinSendWindow(new Date('2026-10-07T08:00:00-04:00')), true);
  assert.equal(withinSendWindow(new Date('2026-10-07T20:30:00-04:00')), true);
  assert.equal(withinSendWindow(new Date('2026-10-07T21:00:00-04:00')), false);
});

test('fresh lead: team alerted immediately, customer texted in window, backlog skipped', async () => {
  const now = new Date('2026-10-07T10:00:00-04:00');
  const csv = [HEADER,
    row('l:new', '2026-10-07T09:30:00-04:00', 'Fresh Lead', '+15085550100'),
    row('l:old', '2026-10-03T01:02:48-05:00', 'Old Lead', '+15085550101'),
  ].join('\n');
  const sent = [];
  const prisma = memoryPrisma();
  const deps = {
    fetchText: async url => (url.includes('htmlview') ? 'gid=1' : csv),
    sendSms: async (to, text) => sent.push({ to, text }),
    prisma, now: () => now,
  };
  const poller = new FbLeadSmsPoller(CFG(), deps);

  await poller.poll();
  assert.equal(sent.length, 3);
  assert.equal(sent[0].to, '+17653379678');
  assert.match(sent[0].text, /^Hanson new lead: Fresh Lead \+15085550100/);
  assert.equal(sent[1].to, '+14016123443');
  assert.equal(sent[2].to, '+15085550100');
  assert.match(sent[2].text, /Hi Fresh, this is Hanson Home/);
  assert.equal(prisma.rows.get('l:new').status, 'sent');
  assert.equal(prisma.rows.get('l:old').status, 'skipped_backlog');

  await poller.poll();
  assert.equal(sent.length, 3, 'second poll resends nothing');
});

test('overnight lead: alert goes out at night, customer text waits for morning', async () => {
  const csv = [HEADER, row('l:night', '2026-10-08T01:45:00-04:00', 'Night Owl', '+15085550102')].join('\n');
  const sent = [];
  const prisma = memoryPrisma();
  const mk = now => new FbLeadSmsPoller(CFG(), {
    fetchText: async url => (url.includes('htmlview') ? '' : csv),
    sendSms: async (to, text) => sent.push({ to, text }),
    prisma, now: () => now,
  });

  await mk(new Date('2026-10-08T02:00:00-04:00')).poll();
  assert.equal(sent.length, 2, 'both team alerts sent at 2 AM');
  assert.equal(prisma.rows.get('l:night').status, 'alerted');

  await mk(new Date('2026-10-08T02:30:00-04:00')).poll();
  assert.equal(sent.length, 2, 'no duplicate alerts');

  await mk(new Date('2026-10-08T08:05:00-04:00')).poll();
  assert.equal(sent.length, 3);
  assert.equal(sent[2].to, '+15085550102');
  assert.equal(prisma.rows.get('l:night').status, 'sent');
});

test('send failure is recorded and not retried into a duplicate text', async () => {
  const now = new Date('2026-10-07T10:00:00-04:00');
  const csv = [HEADER, row('l:f', '2026-10-07T09:45:00-04:00', 'Fail Case', '+15085550103')].join('\n');
  const prisma = memoryPrisma();
  let attempts = 0;
  const poller = new FbLeadSmsPoller(CFG({ alertTo: [] }), {
    fetchText: async url => (url.includes('htmlview') ? '' : csv),
    sendSms: async () => { attempts++; throw new Error('RC down'); },
    prisma, now: () => now,
  });
  await poller.poll();
  await poller.poll();
  assert.equal(attempts, 1);
  assert.equal(prisma.rows.get('l:f').status, 'failed');
});

test('follow-up: booking link after 24h of silence, skipped for repliers', async () => {
  const csv = [HEADER,
    row('l:quiet', '2026-10-07T09:00:00-04:00', 'Quiet Customer', '+15085550104'),
    row('l:chatty', '2026-10-07T09:00:00-04:00', 'Chatty Customer', '+15085550105'),
  ].join('\n');
  const sent = [];
  const prisma = memoryPrisma();
  const cfg = CFG({ alertTo: [], bookingUrl: 'https://hansonhome.us/book' });
  const mk = now => new FbLeadSmsPoller(cfg, {
    fetchText: async url => (url.includes('htmlview') ? '' : csv),
    sendSms: async (to, text) => sent.push({ to, text }),
    hasInbound: async phone => phone === '+15085550105',
    prisma, now: () => now,
  });

  await mk(new Date('2026-10-07T10:00:00-04:00')).poll();
  assert.equal(sent.length, 2, 'initial texts only');

  await mk(new Date('2026-10-08T10:30:00-04:00')).poll();
  const followups = sent.slice(2);
  assert.equal(followups.length, 1, 'only the silent customer gets a follow-up');
  assert.equal(followups[0].to, '+15085550104');
  assert.match(followups[0].text, /Hi Quiet, Hanson Home here/);
  assert.match(followups[0].text, /hansonhome\.us\/book/);
  assert.equal(prisma.rows.get('l:chatty').status, 'replied');

  await mk(new Date('2026-10-09T10:30:00-04:00')).poll();
  assert.equal(sent.length, 3, 'follow-up sent at most once');
});
