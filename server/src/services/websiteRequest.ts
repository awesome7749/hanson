import { createHash } from 'crypto';

const stringFields = ['id', 'intent', 'street', 'unit', 'city', 'state', 'zip', 'ownership', 'homeType', 'size', 'year', 'heating', 'fuel', 'cooling', 'vents', 'condition', 'timeline', 'concerns', 'electric', 'gas', 'assessment', 'assessmentYear', 'discount', 'preferredDate', 'firstName', 'lastName', 'email', 'phone', 'contactMethod', 'language', 'additionalName', 'additionalContact', 'referral'] as const;
const booleanFields = ['additional', 'consent', 'marketing', 'partnerConsent'] as const;
type WebsiteDraft = Record<typeof stringFields[number], string> & Record<typeof booleanFields[number], boolean>;
export class RequestValidationError extends Error {}
export class RequestConflictError extends Error {}

export function parseWebsiteRequest(input: unknown): WebsiteDraft {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new RequestValidationError('Please check your request details.');
  const raw = input as Record<string, unknown>;
  const draft = {} as WebsiteDraft;
  for (const key of stringFields) {
    if (typeof raw[key] !== 'string' || (raw[key] as string).length > (key === 'concerns' ? 4000 : 320)) throw new RequestValidationError('Please check your answers and shorten any unusually long entries.');
    draft[key] = (raw[key] as string).trim();
  }
  for (const key of booleanFields) {
    if (key === 'partnerConsent' && raw[key] === undefined) { draft[key] = false; continue; }
    if (typeof raw[key] !== 'boolean') throw new RequestValidationError('Please review your contact permissions.');
    draft[key] = raw[key] as boolean;
  }
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(draft.id)) throw new RequestValidationError('Please start a new request.');
  if (!['heat-pump', 'assessment'].includes(draft.intent)) throw new RequestValidationError('Choose a heat-pump or assessment request.');
  if (draft.state.toUpperCase() !== 'MA' || !/^0(?:1\d|2[0-7])\d{2}$/.test(draft.zip)) throw new RequestValidationError('Enter a Massachusetts address and ZIP code.');
  draft.state = 'MA';
  const required: (keyof WebsiteDraft)[] = ['street', 'city', 'ownership', 'homeType', 'fuel', 'timeline', 'electric', 'assessment', 'firstName', 'lastName'];
  if (draft.intent === 'heat-pump') required.push('heating', 'cooling', 'vents', 'condition');
  if (draft.fuel === 'Natural gas') required.push('gas');
  if (draft.additional) required.push('additionalName', 'additionalContact');
  if (required.some(key => !draft[key])) throw new RequestValidationError('Please complete the required home and contact details.');
  if (!['Email', 'Phone call', 'Text message'].includes(draft.contactMethod)) throw new RequestValidationError('Choose a contact method.');
  const emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email);
  const phoneOK = /^1?\d{10}$/.test(draft.phone.replace(/\D/g, ''));
  if ((draft.email && !emailOK) || (draft.phone && !phoneOK) || (draft.contactMethod === 'Email' ? !emailOK : !phoneOK)) throw new RequestValidationError('Please check your email address and phone number.');
  if (!draft.consent) throw new RequestValidationError('Please allow contact about this request to continue.');
  if (draft.size && (!Number.isFinite(Number(draft.size)) || Number(draft.size) < 100 || Number(draft.size) > 100000)) throw new RequestValidationError('Please check your home size.');
  if (draft.year && (!Number.isInteger(Number(draft.year)) || Number(draft.year) < 1600 || Number(draft.year) > new Date().getFullYear() + 1)) throw new RequestValidationError('Please check the year your home was built.');
  if (draft.preferredDate) {
    const date = new Date(draft.preferredDate);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.preferredDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== draft.preferredDate || draft.preferredDate < today) throw new RequestValidationError('Choose today or a future preferred date.');
  }
  if (draft.fuel !== 'Natural gas') draft.gas = '';
  if (draft.assessment !== 'Completed') draft.assessmentYear = '';
  if (!draft.additional) { draft.additionalName = ''; draft.additionalContact = ''; }
  if (draft.intent === 'heat-pump') draft.preferredDate = '';
  return draft;
}

export function websiteLeadData(draft: WebsiteDraft) {
  // An isolated ID namespace makes retries atomic without changing existing records.
  const id = 'web-' + createHash('sha256').update(draft.id).digest('hex').slice(0, 32);
  // Preserve the full intake in the existing text field; no schema change is needed.
  const corrections = JSON.stringify({ source: 'hansonhome.us', schemaVersion: 1, contactConsentVersion: '2026-09-13', ...(draft.partnerConsent ? { partnerConsentVersion: '2026-09-14-ventrix-service-requests' } : {}), draft }, null, 2);
  return {
    id, corrections,
    addressRaw: [draft.street, draft.unit && `Unit ${draft.unit}`, `${draft.city}, MA ${draft.zip}`].filter(Boolean).join(', '),
    firstName: draft.firstName, lastName: draft.lastName, email: draft.email || null, phone: draft.phone || null,
    status: draft.intent === 'assessment' ? 'assessment_requested' : 'new',
    ownershipStatus: draft.ownership, currentHeating: [draft.heating, draft.fuel].filter(Boolean).join(' / '),
    hasDuctwork: draft.vents, installationTimeline: draft.timeline,
    electricityProvider: draft.electric, gasProvider: draft.gas,
  };
}
