import type { parseWebsiteRequest } from './websiteRequest';

type Draft = ReturnType<typeof parseWebsiteRequest>;
export function ventrixPayload(leadId: string, draft: Draft) {
  if (!['assessment', 'heat-pump'].includes(draft.intent) || !draft.consent || !draft.partnerConsent) throw new Error('Only consented service requests can be sent.');
  const context: [string, string][] = [
    ['Request type', draft.intent === 'assessment' ? 'Home Energy Assessment (HEA)' : 'Heat-pump installation / quote'],
    ['Relationship to home', draft.ownership], ['Home type', draft.homeType],
    ['Home size (sq ft)', draft.size], ['Year built', draft.year],
    ['Heating system', draft.heating], ['Heating fuel', draft.fuel],
    ['Cooling', draft.cooling], ['Ductwork', draft.vents], ['System condition', draft.condition],
    ['Timeline', draft.timeline], ['Electricity provider', draft.electric], ['Gas provider', draft.gas],
    ['Assessment history', draft.assessment], ['Assessment year', draft.assessmentYear],
    ['Utility discount / assistance', draft.discount], ['Preferred contact method', draft.contactMethod],
    ['Preferred language', draft.language], ['Customer notes', draft.concerns],
  ];
  if (draft.additional) context.push(['Additional contact', draft.additionalName], ['Additional contact details', draft.additionalContact]);
  const digits = draft.phone.replace(/\D/g, '');
  return {
    external_lead_id: leadId,
    homeowner_name: `${draft.firstName} ${draft.lastName}`,
    address: [draft.street, draft.unit && `Unit ${draft.unit}`].filter(Boolean).join(', '),
    city: draft.city, state: draft.state, zip: draft.zip,
    ...(draft.email ? { email: draft.email } : {}),
    ...(digits ? { phone: '+' + (digits.length === 10 ? '1' + digits : digits) } : {}),
    ...(draft.intent === 'assessment' && draft.preferredDate ? { preferred_hea_date: draft.preferredDate } : {}),
    submitted_by_name: 'Hanson Home website',
    // The handover does not define property enum values. Keep these answers in
    // the documented notes field instead of guessing the partner's enum values.
    notes: context.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join('\n'),
  };
}
