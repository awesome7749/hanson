const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createApiRouter } = require('../dist/routes/api');

test('admin credentials stay in a cookie and protect reads and writes', async () => {
  const app = express();
  app.use(express.json());
  const database = {
    getLeads: async () => [],
    updateLead: async (id, fields) => ({ id, ...fields }),
  };
  app.use('/api', createApiRouter({}, {}, database, {}, 'a-long-test-password'));
  const server = app.listen(0);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const login = await fetch(`${base}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ password: 'a-long-test-password' }),
    });
    assert.equal(login.status, 200);
    assert.deepEqual(await login.json(), { authenticated: true });
    const cookie = login.headers.get('set-cookie').split(';')[0];
    assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
    assert.match(login.headers.get('set-cookie'), /SameSite=Strict/i);

    const leads = `${base}/api/admin/leads`;
    assert.equal((await fetch(leads)).status, 401);
    assert.equal((await fetch(`${leads}?token=${cookie.split('=')[1]}`)).status, 401);
    assert.equal((await fetch(leads, { headers: { Authorization: `Bearer ${cookie.split('=')[1]}` } })).status, 401);
    const authorized = await fetch(leads, { headers: { Cookie: cookie } });
    assert.equal(authorized.status, 200);
    assert.equal(authorized.headers.get('cache-control'), 'no-store');

    const patch = `${base}/api/leads/example`;
    const body = JSON.stringify({ status: 'contacted' });
    const headers = { Cookie: cookie, 'Content-Type': 'application/json' };
    assert.equal((await fetch(patch, { method: 'PATCH', headers: { ...headers, Origin: 'https://other.example' }, body })).status, 403);
    assert.equal((await fetch(patch, { method: 'PATCH', headers: { ...headers, Origin: base }, body })).status, 200);
    const logout = await fetch(`${base}/api/admin/logout`, { method: 'POST', headers: { Cookie: cookie, Origin: base } });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/i);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('repeated bad passwords are rate limited', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter({}, {}, {}, {}, 'a-long-test-password'));
  const server = app.listen(0);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const login = () => fetch(`${base}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ password: 'wrong' }),
    });
    for (let i = 0; i < 5; i++) assert.equal((await login()).status, 401);
    const blocked = await login();
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
