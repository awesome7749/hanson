export type Intent = "heat-pump" | "assessment";
export interface Draft {
  id: string;
  intent: Intent;
  street: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  ownership: string;
  homeType: string;
  size: string;
  year: string;
  heating: string;
  fuel: string;
  cooling: string;
  vents: string;
  condition: string;
  timeline: string;
  concerns: string;
  electric: string;
  gas: string;
  assessment: string;
  assessmentYear: string;
  discount: string;
  preferredDate: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contactMethod: string;
  language: string;
  additional: boolean;
  additionalName: string;
  additionalContact: string;
  consent: boolean;
  partnerConsent: boolean;
  marketing: boolean;
  referral: string;
}
export type LeadStatus =
  | "new"
  | "reviewing"
  | "assessment_requested"
  | "assessment_scheduled"
  | "assessment_completed"
  | "proposal_ready"
  | "closed";
export interface Lead {
  id: string;
  draft: Draft;
  createdAt: string;
  status: LeadStatus;
  notes: string;
  appointment: string;
  sample: boolean;
  photoNames: Record<string, string>;
}
export const labels: Record<LeadStatus, string> = {
  new: "New request",
  reviewing: "In review",
  assessment_requested: "Assessment requested",
  assessment_scheduled: "Assessment scheduled",
  assessment_completed: "Assessment completed",
  proposal_ready: "Proposal ready",
  closed: "Closed",
};
export function makeDraft(): Draft {
  return {
    id:
      globalThis.crypto?.randomUUID?.() ||
      `hh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    intent: "heat-pump",
    street: "",
    unit: "",
    city: "",
    state: "MA",
    zip: "",
    ownership: "",
    homeType: "",
    size: "",
    year: "",
    heating: "",
    fuel: "",
    cooling: "",
    vents: "",
    condition: "",
    timeline: "",
    concerns: "",
    electric: "",
    gas: "",
    assessment: "",
    assessmentYear: "",
    discount: "",
    preferredDate: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    contactMethod: "Email",
    language: "English",
    additional: false,
    additionalName: "",
    additionalContact: "",
    consent: false,
    partnerConsent: false,
    marketing: false,
    referral: "",
  };
}
export function changeDraft<K extends keyof Draft>(
  d: Draft,
  key: K,
  value: Draft[K],
): Draft {
  const next = { ...d, [key]: value };
  if (key === "consent") next.partnerConsent = value === true;
  if (key === "intent" && value !== d.intent) { next.consent = false; next.partnerConsent = false; }
  if (key === "fuel" && value !== "Natural gas") next.gas = "";
  if (key === "assessment" && value !== "Completed") next.assessmentYear = "";
  if (key === "additional" && !value) {
    next.additionalName = "";
    next.additionalContact = "";
  }
  if (key === "intent" && value === "heat-pump") next.preferredDate = "";
  return next;
}
export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function validDate(s: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s &&
    s >= todayLocal()
  );
}
export function validateStep(d: Draft, step: number) {
  const e: Record<string, string> = {};
  const need = (k: keyof Draft, m: string) => {
    if (!String(d[k]).trim()) e[k] = m;
  };
  if (step === 0) {
    need("street", "Enter your street address.");
    need("city", "Enter your city or town.");
    if (d.state.trim().toUpperCase() !== "MA")
      e.state =
        "This experience is for Massachusetts homes. Choose Massachusetts, or contact us about another location.";
    if (!/^0(?:1\d|2[0-7])\d{2}$/.test(d.zip))
      e.zip = "Enter a five-digit Massachusetts ZIP code.";
  }
  if (step === 1) {
    need("ownership", "Choose an ownership option.");
    need("homeType", "Choose your home type.");
    if (
      d.intent === "heat-pump" &&
      d.size &&
      (!Number.isFinite(Number(d.size)) ||
        Number(d.size) < 100 ||
        Number(d.size) > 100000)
    )
      e.size =
        "Enter an approximate size between 100 and 100,000 sq ft, or leave it blank.";
    if (
      d.intent === "heat-pump" &&
      d.year &&
      (!Number.isInteger(Number(d.year)) ||
        Number(d.year) < 1600 ||
        Number(d.year) > new Date().getFullYear() + 1)
    )
      e.year = "Enter a valid year, or leave it blank.";
  }
  if (step === 2) {
    need("fuel", "Choose your heating fuel, or Not sure.");
    if (d.intent === "heat-pump") {
      need("heating", "Choose your current heating system, or Not sure.");
      need("cooling", "Choose your current cooling, or Not sure.");
      need("vents", "Choose an option, or Not sure.");
      need("condition", "Choose your system condition.");
    }
    need("timeline", "Choose when you are thinking of making a change.");
  }
  if (step === 3) {
    need("electric", "Choose your electricity provider, or Not sure.");
    if (d.fuel === "Natural gas")
      need("gas", "Choose your gas provider, or Not sure.");
    need("assessment", "Choose your assessment status, or Not sure.");
    if (d.preferredDate && !validDate(d.preferredDate))
      e.preferredDate = "Choose today or a future date.";
  }
  if (step === 4) {
    need("firstName", "Enter your first name.");
    need("lastName", "Enter your last name.");
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email);
    const phone = /^(1)?\d{10}$/.test(d.phone.replace(/\D/g, ""));
    if (d.email && !email) e.email = "Enter a valid email address.";
    if (d.phone && !phone) e.phone = "Enter a valid US phone number.";
    if (d.contactMethod === "Email" && !email)
      e.email = "Add an email for your preferred contact method.";
    if (d.contactMethod !== "Email" && !phone)
      e.phone = "Add a phone number for your preferred contact method.";
    if (!d.consent)
      e.consent = "Please allow contact about this request to continue.";
    if (d.additional) {
      need("additionalName", "Enter the additional contact name.");
      need("additionalContact", "Enter their email or phone.");
    }
  }
  return e;
}
export function validateAll(d: Draft) {
  return [0, 1, 2, 3, 4].reduce(
    (all, n) => ({ ...all, ...validateStep(d, n) }),
    {} as Record<string, string>,
  );
}
export function formatAddress(d: Draft) {
  return [
    d.street,
    d.unit && `Unit ${d.unit}`,
    `${d.city}, ${d.state} ${d.zip}`,
  ]
    .filter(Boolean)
    .join(", ");
}
export function sampleLeads(): Lead[] {
  return [
    [
      "sample-avery",
      "Avery",
      "Morgan",
      "Lexington",
      "heat-pump",
      "reviewing",
      "12 Example Lane",
      "Oil",
    ],
    [
      "sample-jordan",
      "Jordan",
      "Lee",
      "Woburn",
      "assessment",
      "assessment_requested",
      "24 Sample Street",
      "Natural gas",
    ],
    [
      "sample-casey",
      "Casey",
      "Taylor",
      "Somerville",
      "heat-pump",
      "proposal_ready",
      "36 Demo Road",
      "Electricity",
    ],
  ].map(([id, firstName, lastName, city, intent, status, street, fuel], i) => ({
    id,
    draft: {
      ...makeDraft(),
      id,
      firstName,
      lastName,
      city,
      street,
      intent: intent as Intent,
      fuel,
      zip: i === 0 ? "02420" : i === 1 ? "01801" : "02143",
      ownership: "I own my home",
      homeType: "Single-family",
      size: "1800",
      year: "1968",
      heating: "Furnace / forced air",
      cooling: "Window units",
      vents: "Yes",
      condition: "Working, but getting older",
      timeline: "In the next few months",
      electric: "Eversource",
      gas: fuel === "Natural gas" ? "National Grid" : "",
      assessment: "Not yet",
      discount: "Prefer to discuss",
      email: `${firstName.toLowerCase()}@example.com`,
      phone: "202-555-01" + String(i + 10),
      consent: true,
    },
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    status: status as LeadStatus,
    notes:
      i === 0
        ? "Example: customer is interested in improving upstairs comfort."
        : "",
    appointment: "",
    sample: true,
    photoNames: {},
  }));
}
