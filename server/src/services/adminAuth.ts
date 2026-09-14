import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

function signature(payload: string, password: string) {
  return createHmac('sha256', password).update('hanson-admin-v1:' + payload).digest('hex');
}
export function validPassword(input: unknown, password: string) {
  return typeof input === 'string' && timingSafeEqual(createHash('sha256').update(input).digest(), createHash('sha256').update(password).digest());
}
export function issueAdminToken(password: string, now = Date.now()) {
  const payload = `${now + 8 * 60 * 60 * 1000}.${randomBytes(24).toString('hex')}`;
  return `${payload}.${signature(payload, password)}`;
}
export function verifyAdminToken(token: string, password: string, now = Date.now()) {
  const parts = token.split('.');
  if (parts.length !== 3 || !/^\d{13}$/.test(parts[0]) || !/^[a-f0-9]{48}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return false;
  const expires = Number(parts[0]);
  return expires > now && expires <= now + 8 * 60 * 60 * 1000 && timingSafeEqual(Buffer.from(parts[2], 'hex'), Buffer.from(signature(`${parts[0]}.${parts[1]}`, password), 'hex'));
}
