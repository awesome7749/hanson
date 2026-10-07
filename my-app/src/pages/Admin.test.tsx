import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Admin from './Admin';

test('staff status, notes and Ventrix retry all use authenticated requests', async () => {
  const lead = { id: 'web-test', firstName: 'Test', lastName: 'Lead', email: 'test@example.com', createdAt: '2026-09-14T01:00:00Z', status: 'assessment_requested', addressRaw: '12 Example Lane', _count: { predictions: 0, photos: 1 }, predictions: [], photos: [{ id: 'photo-1', photoKey: 'Attic' }], adminNotes: '', partnerDelivery: { status: 'failed', remoteId: null, attempts: 1, sentAt: null, lastAttemptAt: null, lastError: 'Please retry later.' } };
  const request = jest.fn().mockImplementation(async (url, options) => {
    if (url === '/api/admin/session') return { ok: true };
    if (options?.method) {
      expect(options.headers?.Authorization).toBeUndefined();
      return { ok: true, json: async () => ({ lead: { ...lead, partnerDelivery: { ...lead.partnerDelivery, status: 'sent', remoteId: 'ventrix-test-id' } } }) };
    }
    return { ok: true, json: async () => url === '/api/admin/leads' ? { leads: [lead] } : { lead } };
  });
  global.fetch = request;
  const view = render(<Admin />);
  fireEvent.click(await screen.findByRole('button', { name: 'Test Lead' }));
  expect(await screen.findByRole('link', { name: 'Attic' })).toHaveAttribute('href', '/api/admin/photos/photo-1');
  fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'contacted' } });
  await waitFor(() => expect(request).toHaveBeenCalledWith('/api/leads/web-test', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'contacted' }) })));
  fireEvent.change(screen.getByPlaceholderText('Add notes about this lead...'), { target: { value: 'Follow up tomorrow.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Notes' }));
  await waitFor(() => expect(request).toHaveBeenCalledWith('/api/leads/web-test', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ adminNotes: 'Follow up tomorrow.' }) })));
  fireEvent.click(screen.getByRole('button', { name: 'Retry delivery' }));
  await screen.findByText('Ventrix reference: ventrix-test-id');
  expect(request).toHaveBeenCalledWith('/api/admin/leads/web-test/ventrix/retry', expect.objectContaining({ method: 'POST' }));
  view.unmount();
});

test('sign-in and sign-out use the server session without exposing a token to JavaScript', async () => {
  const request = jest.fn().mockImplementation(async (url, options) => {
    if (url === '/api/admin/session') return { ok: false, status: 401 };
    if (url === '/api/admin/login') return { ok: true, json: async () => ({ authenticated: true }) };
    if (url === '/api/admin/leads') return { ok: true, json: async () => ({ leads: [] }) };
    if (url === '/api/admin/logout') return { ok: true };
    throw new Error(`Unexpected request: ${url}`);
  });
  global.fetch = request;
  const view = render(<Admin />);
  fireEvent.change(await screen.findByLabelText('Admin password'), { target: { value: 'staff-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
  await screen.findByText('Lead Dashboard');
  expect(sessionStorage.getItem('admin_token')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Log Out' }));
  await screen.findByRole('button', { name: 'Sign In' });
  expect(request).toHaveBeenCalledWith('/api/admin/logout', { method: 'POST' });
  view.unmount();
});
