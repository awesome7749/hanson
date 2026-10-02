// Optional Meta advertising tracking requires explicit browser consent.
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const CONSENT_KEY = "hanson-meta-consent-v1";
let choice: string | null = null;
try { choice = localStorage.getItem(CONSENT_KEY); } catch {}
export function trackingAllowed() { return choice === "granted"; }
export function trackingChoice() { return choice; }

export function initializePixel() {
  if (!trackingAllowed() || !["hansonhome.us", "www.hansonhome.us"].includes(window.location.hostname)) return;
  if (window.fbq) return;
  const queue: unknown[][] = [];
  const fbq: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void } = (...args) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else queue.push(args);
  };
  Object.assign(fbq, { queue, push: fbq, loaded: true, version: "2.0" });
  window.fbq = fbq;
  (window as Window & { _fbq?: typeof fbq })._fbq = fbq;
  fbq("consent", "grant");
  fbq("init", "28505388679095518");
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

export function setTrackingChoice(allowed: boolean) {
  choice = allowed ? "granted" : "denied";
  try { localStorage.setItem(CONSENT_KEY, choice); } catch {}
  if (allowed) {
    initializePixel();
    window.fbq?.("consent", "grant");
    captureUtm(window.location.search);
    fbqTrack("track", "PageView");
  } else {
    window.fbq?.("consent", "revoke");
    try { sessionStorage.removeItem(UTM_KEY); } catch {}
    for (const name of ["_fbp", "_fbc"]) {
      for (const domain of ["", window.location.hostname, ".hansonhome.us"]) {
        document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
      }
    }
  }
}

export function fbqTrack(...args: unknown[]) {
  if (!trackingAllowed()) return;
  try { window.fbq?.(...args); } catch {}
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
  if (!trackingAllowed()) return;
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
  if (!trackingAllowed()) return {};
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
  if (!trackingAllowed()) return ids;
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
