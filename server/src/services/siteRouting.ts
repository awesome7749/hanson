const aliases: Record<string, string> = {
  '/get-quote': '/start',
  '/products': '/heat-pumps',
};

const appOnlyRoutes = new Set(['/start', '/start/thank-you', '/admin', '/project']);

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
