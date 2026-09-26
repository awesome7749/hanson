const aliases: Record<string, string> = {
  '/get-quote': '/start',
  '/products': '/heat-pumps',
};

const appOnlyRoutes = new Set(['/start', '/start/thank-you', '/project']);

export const OPS_HOST = 'ops.hansonhome.us';

export function isOpsHost(host: string | undefined): boolean {
  return host?.toLowerCase().replace(/:\d+$/, '') === OPS_HOST;
}

export function isStaffApi(pathname: string): boolean {
  return /^\/(admin|leads)(\/|$)/.test(pathname) || pathname === '/rentcast' || pathname === '/predict-hvac';
}

export function apiAllowedOnHost(pathname: string, host: string | undefined): boolean {
  if (pathname === '/health') return true;
  return isOpsHost(host) === isStaffApi(pathname);
}

export function opsPage(pathname: string): 'dashboard' | 'robots' | 'asset' | 'missing' {
  if (pathname === '/') return 'dashboard';
  if (pathname === '/robots.txt') return 'robots';
  if (/^\/static\//.test(pathname) || ['/favicon.ico', '/logo192.png'].includes(pathname)) return 'asset';
  return 'missing';
}

export function siteRoute(pathname: string): {
  redirect?: string;
  redirectStatus?: 301 | 308;
  appOnly: boolean;
} {
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/+$/, '');
  if (normalized !== pathname) return { redirect: normalized, redirectStatus: 308, appOnly: false };
  if (aliases[pathname]) return { redirect: aliases[pathname], redirectStatus: 301, appOnly: false };
  const appOnly = appOnlyRoutes.has(pathname) || /^\/project\/[^/]+$/.test(pathname);
  return { appOnly };
}
