import type { Request } from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { Reader, CityResponse } from 'maxmind';

let database: Reader<CityResponse> | undefined;
try {
  database = new Reader<CityResponse>(readFileSync(path.join(__dirname, '../../data/tracking-city.mmdb')));
} catch {
  console.error('IP location database unavailable; tracking requires explicit consent.');
}
const maxDatabaseAgeMs = 90 * 24 * 60 * 60 * 1000;
const usRegions = new Set(('Alabama Alaska Arizona Arkansas California Colorado Connecticut Delaware Florida Georgia Hawaii Idaho Illinois Indiana Iowa Kansas Kentucky Louisiana Maine Maryland Massachusetts Michigan Minnesota Mississippi Missouri Montana Nebraska Nevada New_Hampshire New_Jersey New_Mexico New_York North_Carolina North_Dakota Ohio Oklahoma Oregon Pennsylvania Rhode_Island South_Carolina South_Dakota Tennessee Texas Utah Vermont Virginia Washington West_Virginia Wisconsin Wyoming District_of_Columbia Puerto_Rico Guam American_Samoa Northern_Mariana_Islands U.S._Virgin_Islands').split(' ').map(name => name.replace(/_/g, ' ')));

export function requiresConsentForLocation(location: CityResponse | null | undefined): boolean {
  const country = location?.country?.iso_code;
  if (!country || !/^[A-Z]{2}$/.test(country)) return true;
  if (country !== 'US') return false;
  const region = location?.subdivisions?.[0]?.names?.en;
  if (!region || !usRegions.has(region)) return true;
  return region === 'California';
}

// Cloud Run's trusted final proxy sets req.ip. Never use the caller-controlled
// first entry of X-Forwarded-For to decide whether consent is required.
export function getTrackingPolicy(ip: string | undefined): { requiresConsent: boolean; showNotice: boolean } {
  const unknown = { requiresConsent: true, showNotice: false };
  try {
    if (!database || !ip || Date.now() - database.metadata.buildEpoch.getTime() > maxDatabaseAgeMs) return unknown;
    const location = database.get(ip);
    return {
      requiresConsent: requiresConsentForLocation(location),
      showNotice: location?.country?.iso_code === 'US' && location?.subdivisions?.[0]?.names?.en === 'California',
    };
  } catch {
    return unknown;
  }
}

export function requiresTrackingConsent(ip: string | undefined): boolean {
  return getTrackingPolicy(ip).requiresConsent;
}

export function canTrackRequest(req: Request): boolean {
  if (req.body?.trackingConsent !== true) return false;
  // Older versions of the site only sent true after an explicit opt-in.
  if (req.body.trackingConsentSource === undefined || req.body.trackingConsentSource === 'explicit') return true;
  return req.body.trackingConsentSource === 'regional' && !requiresTrackingConsent(req.ip);
}
