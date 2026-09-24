import { LIVE } from "./deployment";
import { submitPartialRequest, submitRequest } from "./requests";
import { fbqTrack } from "./pixel";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "./Shared";
import { usePreview } from "./Store";
import {
  Draft,
  changeDraft,
  formatAddress,
  makeDraft,
  todayLocal,
  validateAll,
  validateStep,
} from "./model";
const steps = [
  "Your details",
  "Project address",
  "Your home",
  "Your comfort",
  "Utilities & preferences",
];
const textFor = [
  [
    "Start your\nproject request.",
    "Tell us who to prepare your quote for and how to reach you.",
  ],
  ["Where is\nthe project?", "We use this to prepare your written quote."],
  [
    "Tell us about\nyour property.",
    "These details help us plan the right scope for your home.",
  ],
  [
    "Your heating\nand cooling needs.",
    "No technical expertise needed. “Not sure” is always okay.",
  ],
  [
    "Utilities and\npreferences.",
    "Your utilities, assessment history and how we should follow up.",
  ],
];
const CALL_LINE = { display: "Call or text (339) 999-4516", tel: "tel:+13399994516" };
function Choices({
  label,
  name,
  value,
  options,
  onChange,
  error,
}: {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <fieldset className={"field choices-field " + (error ? "has-error" : "")}>
      <legend>{label}</legend>
      <div className="choices">
        {options.map((o) => (
          <label
            className={"choice " + (value === o ? "selected" : "")}
            key={o}
          >
            <input
              type="radio"
              name={name}
              value={o}
              checked={value === o}
              onChange={() => onChange(o)}
            />
            <span>{o}</span>
            <span className="choice-mark">
              {value === o && <Icon name="check" size={13} />}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </fieldset>
  );
}
export function Review({
  d,
  onEdit,
}: {
  d: Draft;
  onEdit?: (s: number) => void;
}) {
  const groups: [string, number, [string, string][]][] = [
    [
      "Your details",
      0,
      [
        [
          "Service",
          d.intent === "heat-pump"
            ? "Heat-pump estimate"
            : "Home energy assessment",
        ],
        ["Name", `${d.firstName} ${d.lastName}`],
        ["Phone", d.phone],
        ["Email", d.email || "Not added"],
      ],
    ],
    ["Project address", 1, [["Home", formatAddress(d)]]],
    [
      "Your home",
      2,
      [
        ["Ownership", d.ownership],
        ["Property", d.homeType],
        [
          "Size / built",
          [d.size && `${d.size} sq ft`, d.year].filter(Boolean).join(" / ") ||
            "Not sure",
        ],
      ],
    ],
    [
      "Your comfort",
      3,
      [
        ["Heating fuel", d.fuel],
        ...(d.intent === "heat-pump"
          ? ([
              ["Heating", d.heating],
              ["Cooling", d.cooling],
              ["Vents", d.vents],
              ["Condition", d.condition],
            ] as [string, string][])
          : []),
        ["Timing", d.timeline],
        ["Concerns", d.concerns || "None added"],
      ],
    ],
    [
      "Utilities & preferences",
      4,
      [
        ["Electricity", d.electric],
        ...(d.fuel === "Natural gas"
          ? ([["Gas", d.gas]] as [string, string][])
          : []),
        ["Assessment", d.assessment],
        ...(d.assessment === "Completed" && d.assessmentYear
          ? ([["Completed", d.assessmentYear]] as [string, string][])
          : []),
        ["Program / discount", d.discount || "Not answered"],
        ...(d.preferredDate
          ? ([["Preferred date", d.preferredDate + " (unconfirmed)"]] as [
              string,
              string,
            ][])
          : []),
        ["Contact preference", d.contactMethod],
        ["Language", d.language],
        ...(d.additional
          ? ([
              [
                "Additional contact",
                `${d.additionalName} · ${d.additionalContact}`,
              ],
            ] as [string, string][])
          : []),
        ["Referral", d.referral || "Not added"],
        ["Service contact", d.consent ? "Allowed" : "Not allowed"],
        ["Marketing emails", d.marketing ? "Opted in" : "Not opted in"],
      ],
    ],
  ];
  return (
    <div className="review-groups">
      {groups.map(([t, n, rows]) => (
        <section className="review-group" key={t}>
          <div className="card-title">
            <h3>{t}</h3>
            {onEdit && (
              <button
                className="edit-button"
                onClick={() => onEdit(n)}
                type="button"
                aria-label={`Edit ${t}`}
              >
                <Icon name="edit" size={16} /> Edit
              </button>
            )}
          </div>
          <dl>
            {rows.map(([l, v]) => (
              <div key={l}>
                <dt>{l}</dt>
                <dd>{v || "Not sure"}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
export default function Intake() {
  const {
    draft: d,
    setDraft,
    step,
    setStep,
    saveLead,
    leads,
    storageWarning,
  } = usePreview();
  const location = useLocation();
  const nav = useNavigate();
  const [review, setReview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const title = useRef<HTMLHeadingElement>(null);
  const initialized = useRef(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submitting = useRef(false);
  const leadEventSent = useRef("");
  useEffect(() => {
    fbqTrack("track", "ViewContent", { content_name: "start-heat-pump" });
  }, []);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const editId = new URLSearchParams(location.search).get("edit");
    const existing = leads.find((l) => l.id === editId);
    if (existing && !LIVE) {
      setDraft({ ...existing.draft });
      setStep(0);
      return;
    }
    const intent = new URLSearchParams(location.search).get("intent");
    const address = (location.state as { address?: string } | null)?.address;
    if (leads.some((l) => l.draft.id === d.id)) setStep(0);
    setDraft((old) => {
      const base = leads.some((l) => l.draft.id === old.id) ? makeDraft() : old;
      return {
        ...changeDraft(
          base,
          "intent",
          intent === "assessment"
            ? "assessment"
            : intent === "heat-pump"
              ? "heat-pump"
              : base.intent,
        ),
        ...(address ? { street: address } : {}),
      };
    });
  }, [location.search, location.state, setDraft, setStep, leads, d.id]);
  useEffect(() => {
    title.current?.focus();
    window.scrollTo(0, 0);
  }, [step, review]);
  const update = <K extends keyof Draft>(key: K, v: Draft[K]) => {
    setDraft((old) => changeDraft(old, key, v));
    setErrors((old) => {
      const n = { ...old };
      delete n[key];
      return n;
    });
  };
  const field = (
    key: keyof Draft,
    label: string,
    type = "text",
    hint?: string,
  ) => (
    <label
      className={"field " + (errors[key] ? "has-error" : "")}
      htmlFor={key}
    >
      <span id={`${key}-label`}>{label}</span>
      <input
        aria-labelledby={`${key}-label`}
        id={key}
        name={key}
        type={type}
        value={String(d[key])}
        onChange={(e) => update(key, e.target.value as never)}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        autoComplete={
          [
            "street",
            "city",
            "state",
            "zip",
            "firstName",
            "lastName",
            "email",
            "phone",
          ].includes(key)
            ? (
                {
                  street: "address-line1",
                  city: "address-level2",
                  state: "address-level1",
                  zip: "postal-code",
                  firstName: "given-name",
                  lastName: "family-name",
                  email: "email",
                  phone: "tel",
                } as Record<string, string>
              )[key]
            : "off"
        }
        {...(type === "number"
          ? { min: 0, inputMode: "numeric" as const }
          : {})}
        {...(key === "zip" ? { inputMode: "numeric" as const, maxLength: 5 } : {})}
        {...(type === "date" ? { min: todayLocal() } : {})}
      />
      {hint && <small>{hint}</small>}
      {errors[key] && (
        <span id={`${key}-error`} className="field-error" role="alert">
          {errors[key]}
        </span>
      )}
    </label>
  );
  const choice = (key: keyof Draft, label: string, options: string[]) => (
    <Choices
      name={key}
      label={label}
      value={String(d[key])}
      options={options}
      onChange={(v) => update(key, v as never)}
      error={errors[key]}
    />
  );
  const select = (key: keyof Draft, label: string, options: string[]) => (
    <label className="field" htmlFor={key}>
      <span id={`${key}-label`}>{label}</span>
      <select
        aria-labelledby={`${key}-label`}
        id={key}
        value={String(d[key])}
        onChange={(e) => update(key, e.target.value as never)}
        aria-invalid={!!errors[key]}
      >
        <option value="">Choose an option</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      {errors[key] && (
        <span className="field-error" role="alert">
          {errors[key]}
        </span>
      )}
    </label>
  );
  function next() {
    const e = validateStep(d, step);
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(
            '.has-error input, [aria-invalid="true"], .has-error',
          )
          ?.focus(),
      );
      return;
    }
    if (step === 0) {
      // Save a partial lead right away so we can follow up even if the rest
      // of the form is abandoned. Never block the visitor on this request.
      if (LIVE) {
        submitPartialRequest(d)
          .then((receipt) => {
            if (leadEventSent.current === d.id) return;
            leadEventSent.current = d.id;
            fbqTrack(
              "track",
              "Lead",
              { content_name: d.intent, value: 0, currency: "USD" },
              { eventID: receipt.id },
            );
          })
          .catch(() => {
            if (leadEventSent.current === d.id) return;
            leadEventSent.current = d.id;
            fbqTrack("track", "Lead", {
              content_name: d.intent,
              value: 0,
              currency: "USD",
            });
          });
      }
    }
    if (step === 1) fbqTrack("trackCustom", "StartStep2");
    if (step < 4) setStep(step + 1);
    else setReview(true);
  }
  async function submit() {
    if (submitting.current) return;
    const e = validateAll(d);
    if (Object.keys(e).length) {
      setErrors(e);
      setReview(false);
      setStep(
        [0, 1, 2, 3, 4].find((s) => Object.keys(validateStep(d, s)).length)!,
      );
      return;
    }
    submitting.current = true;
    setBusy(true);
    setSubmitError("");
    try {
    const receipt = LIVE ? await submitRequest(d) : null;
    const old = leads.find((l) => l.draft.id === d.id);
    saveLead({
      id: receipt?.id || d.id,
      draft: { ...d },
      createdAt: receipt?.createdAt || old?.createdAt || new Date().toISOString(),
      status:
        receipt?.status || old?.status ||
        (d.intent === "assessment" ? "assessment_requested" : "new"),
      notes: old?.notes || "",
      appointment: old?.appointment || "",
      sample: false,
      photoNames: old?.photoNames || {},
    });
    if (LIVE) {
      // A fixed confirmation URL lets Meta and Google count conversions.
      nav("/start/thank-you", {
        replace: true,
        state: {
          id: receipt?.id || d.id,
          firstName: d.firstName,
          intent: d.intent,
          partnerConsent: d.partnerConsent,
        },
      });
    } else {
      nav(`/project/${receipt?.id || d.id}`, { replace: true });
    }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We could not send your request. Please try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="intake-layout wrap">
      <aside className="intake-sidebar">
        <Link className="back-home" to="/">
          <span aria-hidden="true">←</span> Back to home
        </Link>
        <span className="eyebrow">YOUR HANSON HOME REQUEST</span>
        <h1 ref={title} tabIndex={-1}>
          {review ? "Review your\nproject details." : textFor[step][0]}
        </h1>
        <p>
          {review
            ? "Take a moment to check your details. You can edit anything before continuing."
            : textFor[step][1]}
        </p>
        <ol className="step-list" aria-label="Intake progress">
          {steps.map((s, i) => (
            <li
              key={s}
              className={i === step ? "current" : i < step ? "complete" : ""}
            >
              <button
                disabled={i > step}
                onClick={() => {
                  setStep(i);
                  setReview(false);
                  setErrors({});
                }}
                aria-current={i === step ? "step" : undefined}
              >
                <span className="step-number">
                  {i < step ? <Icon name="check" size={14} /> : i + 1}
                </span>
                {s}
              </button>
            </li>
          ))}
        </ol>
        <div className="mascot-tip">
          <img src="/images/hanson-mascot.png" alt="" />
          <p>No installation commitment. You’ll review the scope and price before deciding.</p>
        </div>
      </aside>
      <section className="intake-form-area">
        <div className="intake-topline">
          <span>
            {review ? "REVIEW YOUR REQUEST" : `STEP ${step + 1} OF 5`}
          </span>
          <a
            className="call-line"
            href={CALL_LINE.tel}
            onClick={() => fbqTrack("track", "Contact")}
          >
            {CALL_LINE.display}
          </a>
        </div>
        <div className="mobile-progress">
          <span style={{ width: `${((step + 1) / 5) * 100}%` }} />
        </div>
        {storageWarning && (
          <div className="notice">
            Your browser couldn't save this draft. Please keep this page open
            while you finish.
          </div>
        )}
        <form
          className="form-card"
          onSubmit={(e) => {
            e.preventDefault();
            review ? submit() : next();
          }}
          noValidate
        >
          {review ? (
            <>
              <span className="eyebrow">LOOKING GOOD</span>
              <h2>Does this look right?</h2>
              <Review
                d={d}
                onEdit={(s) => {
                  setStep(s);
                  setReview(false);
                }}
              />
              <div className="notice">
                <Icon name="info" size={18} />
                <span>
                  {LIVE ? "Send your details to Hanson Home. Our team will follow up using your preferred contact method. This does not book an appointment or commit you to an installation." : "This is a preview. Continuing creates a sample request in this browser only. It does not contact Hanson Home or book an appointment."}
                </span>
              </div>
            </>
          ) : (
            <>
              {step === 0 && (
                <>
                  <h2>Let’s get your quote started.</h2>
                  <p className="value-points">
                    Fixed all-in price · Mass Save rebates up to $8,500 · No
                    obligation
                  </p>
                  <fieldset className="intent-options">
                    <legend>What can we help with?</legend>
                    {[
                      [
                        "heat-pump",
                        "sun",
                        "A heat-pump estimate",
                        "Equipment and installation pricing for your home.",
                      ],
                      [
                        "assessment",
                        "home",
                        "An energy assessment",
                        "Review your home’s energy-saving opportunities.",
                      ],
                    ].map(([v, i, t, c]) => (
                      <label
                        key={v}
                        className={
                          "intent-option " + (d.intent === v ? "selected" : "")
                        }
                      >
                        <input
                          type="radio"
                          name="intent"
                          checked={d.intent === v}
                          onChange={() =>
                            update("intent", v as Draft["intent"])
                          }
                        />
                        <Icon name={i} size={25} />
                        <span>
                          <b>{t}</b>
                          <small>{c}</small>
                        </span>
                        <span className="choice-mark">
                          {d.intent === v && <Icon name="check" size={13} />}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <div className="form-grid">
                    {field("firstName", "First name")}
                    {field("lastName", "Last name")}
                  </div>
                  <div className="form-grid">
                    {field("phone", "Phone number", "tel")}
                    {field("zip", "ZIP code")}
                  </div>
                  {field("email", "Email address (optional)", "email")}
                  <div className="quiet-note">
                    <Icon name="shield" size={17} /> We’ll only use this to
                    contact you about your quote.{" "}
                    <Link to="/privacy">Privacy information</Link>
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h2>Where is the project?</h2>
                  <p className="form-intro">
                    We use this to prepare your written quote.
                  </p>
                  {field("street", "Street address")}
                  {field("unit", "Apartment / unit (optional)")}
                  {field("city", "City or town")}
                  {select("state", "State", ["MA", "Other"])}
                  {d.state !== "MA" && (
                    <div className="notice">
                      We're planning for Massachusetts homes.{" "}
                      <Link to="/contact">See contact options.</Link>
                    </div>
                  )}
                  <div className="quiet-note">
                    <Icon name="shield" size={17} /> Your address helps us
                    understand your home and service area.
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <h2>Tell us about your space.</h2>
                  <p className="form-intro">
                    Approximate answers are fine. Leave details blank if you're
                    not sure.
                  </p>
                  {choice("ownership", "Your relationship to the home", [
                    "I own my home",
                    "I rent",
                    "I’m the landlord",
                    "Helping the homeowner",
                  ])}
                  {choice("homeType", "What type of home is it?", [
                    "Single-family",
                    "Townhouse / condo",
                    "2–4 units",
                    "5+ units",
                    "Not sure",
                  ])}
                  {d.ownership === "I rent" && (
                    <div className="notice">
                      We can help you explore options. Your landlord may need to
                      be involved before work can move forward.
                    </div>
                  )}
                  {d.homeType === "5+ units" && (
                    <div className="notice">
                      A larger building may need a more detailed review. You can
                      still tell us about your project.
                    </div>
                  )}
                  {d.intent === "heat-pump" && (
                    <div className="form-grid">
                      {field(
                        "size",
                        "Approx. size (sq ft, optional)",
                        "number",
                      )}
                      {field("year", "Year built (optional)", "number")}
                    </div>
                  )}
                </>
              )}
              {step === 3 && (
                <>
                  <h2>
                    {d.intent === "heat-pump"
                      ? "A little more comfort."
                      : "What powers your home?"}
                  </h2>
                  <p className="form-intro">
                    Tell us what you have today. We'll work through the options
                    together.
                  </p>
                  {d.intent === "heat-pump" &&
                    choice("heating", "How is your home heated?", [
                      "Furnace / forced air",
                      "Boiler / radiators",
                      "Electric baseboards",
                      "Heat pump",
                      "Other",
                      "Not sure",
                    ])}
                  {choice("fuel", "What heating fuel do you use?", [
                    "Natural gas",
                    "Oil",
                    "Propane",
                    "Electricity",
                    "Other",
                    "Not sure",
                  ])}
                  {d.intent === "heat-pump" && (
                    <>
                      {choice("cooling", "How do you cool your home?", [
                        "Central air",
                        "Window units",
                        "Heat pump",
                        "No cooling",
                        "Other",
                        "Not sure",
                      ])}
                      {choice(
                        "vents",
                        "Do you have vents that blow warm or cool air?",
                        ["Yes", "No", "Not sure"],
                      )}
                      {choice("condition", "How is your system doing?", [
                        "Broken / needs attention",
                        "Working, but getting older",
                        "Working well",
                        "Not sure",
                      ])}
                    </>
                  )}
                  {choice(
                    "timeline",
                    "When are you thinking of making a change?",
                    [
                      "As soon as possible",
                      "In the next few months",
                      "Later this year",
                      "Just exploring",
                    ],
                  )}
                  <label className="field" htmlFor="concerns">
                    <span>Anything else we should know? (optional)</span>
                    <textarea
                      id="concerns"
                      placeholder="Cold upstairs, a noisy system, adding cooling…"
                      value={d.concerns}
                      onChange={(e) => update("concerns", e.target.value)}
                      rows={3}
                    />
                  </label>
                </>
              )}
              {step === 4 && (
                <>
                  <h2>Let's plan your next step.</h2>
                  <p className="form-intro">
                    These details help with assessment planning and a future
                    incentive review. They don't determine your eligibility
                    here.
                  </p>
                  {select("electric", "Electricity provider", [
                    "Eversource",
                    "National Grid",
                    "Unitil",
                    "Cape Light Compact",
                    "Municipal utility",
                    "Other",
                    "Not sure",
                  ])}
                  {d.fuel === "Natural gas" &&
                    select("gas", "Natural gas provider", [
                      "Eversource",
                      "National Grid",
                      "Berkshire Gas",
                      "Liberty Utilities",
                      "Unitil",
                      "Other",
                      "Not sure",
                    ])}
                  {choice(
                    "assessment",
                    "Have you had a home energy assessment?",
                    ["Not yet", "Scheduled", "Completed", "Not sure"],
                  )}
                  {d.assessment === "Completed" &&
                    field(
                      "assessmentYear",
                      "Approximately when? (optional)",
                      "text",
                      "For example: June 2025",
                    )}
                  {select(
                    "discount",
                    "Utility discount / fuel assistance (optional)",
                    ["Yes", "No", "Not sure", "Prefer to discuss"],
                  )}
                  {d.discount === "Yes" && (
                    <div className="notice">
                      Thanks for letting us know. A team member can help review
                      which assessment route is appropriate.
                    </div>
                  )}
                  {d.intent === "assessment" &&
                    field(
                      "preferredDate",
                      "Preferred assessment date (optional)",
                      "date",
                      "This is a preference, not a confirmed appointment.",
                    )}
                  {choice("contactMethod", "Preferred contact method", [
                    "Email",
                    "Phone call",
                    "Text message",
                  ])}
                  {d.contactMethod === "Email" &&
                    field("email", "Email address", "email")}
                  {select("language", "Preferred language", [
                    "English",
                    "Portuguese",
                    "Spanish",
                    "Chinese (Mandarin)",
                    "Other",
                  ])}
                  <small className="field-help">
                    Language support will be confirmed when your request is
                    reviewed.
                  </small>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={d.additional}
                      onChange={(e) => update("additional", e.target.checked)}
                    />
                    <span>Include another person in the conversation</span>
                  </label>
                  {d.additional && (
                    <div className="inset-panel">
                      {field("additionalName", "Additional contact name")}
                      {field("additionalContact", "Their email or phone")}
                      <small>
                        Please only add someone who has agreed to be contacted
                        about this project.
                      </small>
                    </div>
                  )}
                  {field(
                    "referral",
                    "Referral code or how you found us (optional)",
                  )}
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={d.consent}
                      onChange={(e) => update("consent", e.target.checked)}
                      aria-invalid={!!errors.consent}
                    />
                    <span>
                      I agree to be contacted about this request using my
                      preferred method.{" "}
                      {LIVE && <>I also agree that Hanson Home may share my request and contact details with its licensed local service partners to coordinate my {d.intent === "assessment" ? "assessment" : "heat-pump project"}.{" "}</>}
                      <Link to="/privacy">Privacy information</Link>
                    </span>
                  </label>
                  {errors.consent && (
                    <span className="field-error" role="alert">
                      {errors.consent}
                    </span>
                  )}
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={d.marketing}
                      onChange={(e) => update("marketing", e.target.checked)}
                    />
                    <span>
                      Also send me occasional home-comfort updates. (Optional)
                    </span>
                  </label>
                </>
              )}
            </>
          )}
          {submitError && <div className="notice" role="alert">{submitError}</div>}
          <div className="form-actions">
            <button
              className="button ghost"
              type="button"
              onClick={() => {
                if (review) setReview(false);
                else if (step > 0) {
                  setStep(step - 1);
                  setErrors({});
                } else nav("/");
              }}
            >
              Back
            </button>
            <button type="submit" className="button" disabled={busy}>
              {busy ? "Sending…" : review
                ? (LIVE ? "Send my request" : "Create preview request")
                : step === 0
                  ? "Get my quote"
                  : step === 4
                    ? "Review my details"
                    : "Continue"}
              <Icon name="arrow" size={18} />
            </button>
          </div>
          <div className="form-footnote">
            {review
              ? (LIVE ? "No payment required. No obligation to proceed." : "No request will be sent.")
              : "You can review and edit your answers before you finish."}
          </div>
        </form>
      </section>
    </div>
  );
}
