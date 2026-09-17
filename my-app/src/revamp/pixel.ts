// Meta Pixel helpers. The base pixel only initializes on hansonhome.us
// (see public/index.html), so every call here must no-op safely elsewhere.
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function fbqTrack(...args: unknown[]) {
  try {
    window.fbq?.(...args);
  } catch {}
}

const UTM_KEY = "hanson-utm-v1";
const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

// Save ad attribution from the landing URL so it survives navigation from
// the home page to /start. New UTM values replace a previously stored visit.
export function captureUtm(search: string) {
  try {
    const params = new URLSearchParams(search);
    const found: Record<string, string> = {};
    for (const key of UTM_PARAMS) {
      const value = params.get(key);
      if (value) found[key] = value.slice(0, 500);
    }
    if (Object.keys(found).length) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(found));
    }
  } catch {}
}

export function getStoredUtm(): Record<string, string> {
  try {
    const stored = JSON.parse(sessionStorage.getItem(UTM_KEY) || "null");
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      const utm: Record<string, string> = {};
      for (const key of UTM_PARAMS) {
        if (typeof stored[key] === "string" && stored[key]) utm[key] = stored[key];
      }
      return utm;
    }
  } catch {}
  return {};
}

function readCookie(name: string): string {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}

// Browser identifiers for the Conversions API; omitted when unavailable.
export function getMetaBrowserIds(): { fbp?: string; fbc?: string } {
  const ids: { fbp?: string; fbc?: string } = {};
  const fbp = readCookie("_fbp");
  if (fbp) ids.fbp = fbp;
  const fbc = readCookie("_fbc");
  if (fbc) ids.fbc = fbc;
  else {
    const fbclid = getStoredUtm().fbclid;
    if (fbclid) ids.fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  return ids;
}
