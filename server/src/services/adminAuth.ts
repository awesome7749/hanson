import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { Request, Response } from 'express';

const SESSION_MS = 8 * 60 * 60 * 1000;
const production = process.env.NODE_ENV === 'production';
const cookieName = production ? '__Host-hanson_admin' : 'hanson_admin';

export function readAdminSession(req: Request): string | undefined {
  const entry = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`));
  return entry?.slice(cookieName.length + 1);
}

export function setAdminSession(res: Response, token: string): void {
  res.cookie(cookieName, token, { httpOnly: true, secure: production, sameSite: 'strict', path: '/', maxAge: SESSION_MS });
}

export function clearAdminSession(res: Response): void {
  res.clearCookie(cookieName, { httpOnly: true, secure: production, sameSite: 'strict', path: '/' });
}

function signature(payload: string, password: string) {
  return createHmac('sha256', password).update('hanson-admin-v1:' + payload).digest('hex');
}
export function validPassword(input: unknown, password: string) {
  return typeof input === 'string' && timingSafeEqual(createHash('sha256').update(input).digest(), createHash('sha256').update(password).digest());
}
export function issueAdminToken(password: string, now = Date.now()) {
  const payload = `${now + SESSION_MS}.${randomBytes(24).toString('hex')}`;
  return `${payload}.${signature(payload, password)}`;
}
export function verifyAdminToken(token: string, password: string, now = Date.now()) {
  const parts = token.split('.');
  if (parts.length !== 3 || !/^\d{13}$/.test(parts[0]) || !/^[a-f0-9]{48}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return false;
  const expires = Number(parts[0]);
  return expires > now && expires <= now + SESSION_MS && timingSafeEqual(Buffer.from(parts[2], 'hex'), Buffer.from(signature(`${parts[0]}.${parts[1]}`, password), 'hex'));
}
