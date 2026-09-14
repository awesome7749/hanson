import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon } from "./Shared";
import { usePreview } from "./Store";
import { formatAddress, labels, todayLocal, validDate } from "./model";
import { Review } from "./Intake";
export const photoGuides = [
  [
    "indoor",
    "Indoor heating equipment",
    "Stand back so the whole unit and the area around it are visible.",
  ],
  [
    "outdoor",
    "Outdoor equipment, if you have it",
    "Include the unit and the space around it. Skip this if you have no outdoor unit.",
  ],
  [
    "label",
    "Equipment label",
    "A clear, close view of the model label on the outside of your equipment.",
  ],
  [
    "panel",
    "Electrical panel",
    "Photograph the closed panel, or visible breaker labels with the normal door open. Never remove a cover.",
  ],
  [
    "space",
    "A wider view of the space",
    "Show access, nearby walls and any obstacles around the equipment.",
  ],
];
export default function Project() {
  const { id } = useParams();
  const { leads, newDraft, updateLead, photos, setPhoto } = usePreview();
  const nav = useNavigate();
  const lead = id
    ? leads.find((l) => l.id === id)
    : leads.find((l) => !l.sample);
  const [tab, setTab] = useState("Overview");
  const [photoError, setPhotoError] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [dateMessage, setDateMessage] = useState("");
  if (!lead)
    return (
      <div className="wrap empty-state">
        <span className="round-icon">
          <Icon name="home" size={32} />
        </span>
        <h1>
          {id ? "We couldn’t find that preview." : "Your home’s next chapter."}
        </h1>
        <p>
          {id
            ? "This request may belong to a different browser session."
            : "Start a request to see your home summary, photo checklist and next steps here."}
        </p>
        <div className="inline-actions">
          <Link className="button" to="/start">
            Start my request <Icon name="arrow" />
          </Link>
          <Link className="button ghost" to="/project/sample-avery">
            Explore a sample project
          </Link>
        </div>
      </div>
    );
  const d = lead.draft;
  const done = ["assessment_completed", "proposal_ready"].includes(lead.status);
  const scheduled = lead.status === "assessment_scheduled";
  const count = photoGuides.filter(([k]) => photos[`${lead.id}:${k}`]).length;
  function choosePhoto(key: string, file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError("That image is too large. Choose one under 8 MB.");
      return;
    }
    setPhotoError("");
    setPhoto(lead!.id, key, file);
  }
  return (
    <div className="workspace wrap">
      <div className="workspace-breadcrumb">
        <Link to="/">Hanson Home</Link>
        <span>/</span>
        <span>My project</span>
        <span className="badge">PREVIEW REQUEST</span>
      </div>
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">YOUR HOME, ALL TOGETHER</span>
          <h1>Welcome, {d.firstName}.</h1>
          <p>
            <Icon name="pin" size={18} />
            {formatAddress(d)}
          </p>
        </div>
        <button
          className="button ghost small"
          onClick={() => {
            newDraft();
            nav("/start");
          }}
        >
          Start another request <Icon name="arrow" size={17} />
        </button>
      </div>
      <nav className="tabs" aria-label="Project sections">
        {["Overview", "Home details", "Photos"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-current={tab === t ? "page" : undefined}
            className={tab === t ? "active" : ""}
          >
            {t}
            {t === "Photos" && <span>{count}</span>}
          </button>
        ))}
      </nav>
      <div className="project-grid">
        <div>
          {tab === "Overview" && (
            <>
              <section className="panel status-panel">
                <span className="eyebrow">
                  {lead.status === "new"
                    ? "A GREAT PLACE TO START"
                    : "YOUR NEXT STEP"}
                </span>
                <h2>
                  {lead.status === "new"
                    ? "Your home profile is ready."
                    : labels[lead.status] + "."}
                </h2>
                <p>
                  {lead.status === "closed"
                    ? "This sample request has been closed. You can start another request whenever you’re ready."
                    : scheduled
                      ? "Your sample appointment is shown below. This preview has not booked a real visit."
                      : done
                        ? "Your assessment context is together. The next step is reviewing your project scope and options."
                        : "You’ve brought the important details together. An advisor would review your home, assessment needs and next steps."}
                </p>
                <div className="status-foot">
                  <span className="badge warm">{labels[lead.status]}</span>
                  <span>
                    Saved{" "}
                    {new Date(lead.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </section>
              <section className="panel">
                <div className="card-title">
                  <h3>What happens next?</h3>
                  <Icon name="list" />
                </div>
                <ol className="journey-list">
                  <li className="done">
                    <span>
                      <Icon name="check" size={15} />
                    </span>
                    <div>
                      <h4>Your home profile</h4>
                      <p>
                        Your address, goals and contact preferences, in one
                        place.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>2</span>
                    <div>
                      <h4>
                        {d.intent === "assessment"
                          ? "Assessment coordination"
                          : "A closer look at your home"}
                      </h4>
                      <p>
                        {d.intent === "assessment"
                          ? "The team reviews your assessment history and preferred date."
                          : "Add equipment photos to help prepare for a project review."}
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>3</span>
                    <div>
                      <h4>A clear plan to move forward</h4>
                      <p>
                        Review the scope, potential incentives and next steps
                        with the team.
                      </p>
                    </div>
                  </li>
                </ol>
                <button
                  className="text-link plain-button"
                  onClick={() => setTab("Photos")}
                >
                  Open my photo checklist <Icon name="arrow" size={18} />
                </button>
              </section>
              {lead.status === "proposal_ready" && (
                <section className="panel">
                  <span className="eyebrow">ILLUSTRATIVE PROPOSAL</span>
                  <h3>A heat-pump plan for your home.</h3>
                  <p>
                    This example shows how a future proposal will be presented.
                    Equipment, price and incentives still require
                    project-specific review.
                  </p>
                  <div className="price-placeholder">
                    <span>Project estimate</span>
                    <strong>Awaiting final scope</strong>
                  </div>
                  <ul className="check-list">
                    <li>
                      <Icon name="check" /> Recommended heating and cooling
                      equipment
                    </li>
                    <li>
                      <Icon name="check" /> Installation scope and any
                      additional work
                    </li>
                    <li>
                      <Icon name="check" /> Itemized pricing and incentive
                      assumptions
                    </li>
                  </ul>
                </section>
              )}
            </>
          )}
          {tab === "Home details" && (
            <section className="panel">
              <div className="card-title">
                <h3>Your home profile</h3>
                <button
                  className="text-link plain-button"
                  onClick={() => {
                    nav(`/start?edit=${lead.id}`);
                  }}
                >
                  Edit details <Icon name="edit" size={16} />
                </button>
              </div>
              <Review d={d} />
            </section>
          )}
          {tab === "Photos" && (
            <section className="panel">
              <span className="eyebrow">A VIRTUAL LOOK AROUND</span>
              <h2>Show us your setup.</h2>
              <p>
                A few photos help tell your home's story. JPG, PNG or WebP, up
                to 8 MB each. Photos stay on this device and need to be
                reattached after a refresh.
              </p>
              {photoError && (
                <div className="error-banner" role="alert">
                  {photoError}
                </div>
              )}
              <div className="photo-checklist">
                {photoGuides.map(([key, label, hint]) => {
                  const photo = photos[`${lead.id}:${key}`];
                  return (
                    <article className="photo-row" key={key}>
                      <div className="photo-preview">
                        {photo ? (
                          <img src={photo.url} alt={label} />
                        ) : (
                          <Icon name="camera" size={30} />
                        )}
                      </div>
                      <div>
                        <h3>{label}</h3>
                        <p>{hint}</p>
                        {lead.photoNames[key] && !photo && (
                          <small className="reattach">
                            Please reattach {lead.photoNames[key]}
                          </small>
                        )}
                        <div className="photo-actions">
                          <label className="upload-button">
                            {photo ? "Replace photo" : "Add a photo"}
                            <input
                              aria-label={`Add ${label}`}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => {
                                choosePhoto(key, e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          {photo && (
                            <button
                              className="plain-button remove-button"
                              onClick={() => setPhoto(lead.id, key)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {photo && (
                          <small className="file-name">{photo.file.name}</small>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="notice">
                <Icon name="shield" size={18} />
                <span>
                  Only photograph equipment you can access safely. Keep all
                  protective covers in place.
                </span>
              </div>
            </section>
          )}
        </div>
        <aside>
          <section className="panel advisor-panel">
            <img src="/images/hanson-mascot.png" alt="Hanson mascot" />
            <h3>Here for your next step.</h3>
            <p>
              Good questions deserve clear answers. Your home profile helps the
              team start in the right place.
            </p>
            <Link className="button dark full-width" to="/contact">
              Contact options <Icon name="arrow" size={18} />
            </Link>
          </section>
          <section className="panel">
            <div className="card-title">
              <h3>Energy assessment</h3>
              <Icon name="calendar" />
            </div>
            <p className="small-copy">
              {d.assessment === "Completed"
                ? "You told us an assessment is already complete. The team would review those details before arranging anything new."
                : "Tell us when an assessment might work for you. A team member would confirm the appointment separately."}
            </p>
            {scheduled && lead.appointment ? (
              <div className="date-summary">
                <b>Sample appointment</b>
                <span>
                  {new Date(lead.appointment).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            ) : done ? (
              <div className="date-summary">
                <b>Assessment complete</b>
                <span>Shown as a preview status.</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const requestedDate = date ?? d.preferredDate;
                  if (!validDate(requestedDate)) {
                    setDateMessage("Choose today or a future date.");
                    return;
                  }
                  updateLead(lead.id, {
                    draft: { ...d, preferredDate: requestedDate },
                    status: "assessment_requested",
                  });
                  setDateMessage(
                    "Date preference saved in this preview. No appointment has been booked.",
                  );
                }}
              >
                <label className="field">
                  <span>Preferred date</span>
                  <input
                    aria-label="Preferred assessment date"
                    type="date"
                    min={todayLocal()}
                    value={date ?? d.preferredDate}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <button className="button ghost full-width small" type="submit">
                  Save date preference
                </button>
                {d.preferredDate && (
                  <small className="saved-date">
                    Requested: {d.preferredDate}
                    <br />
                    Awaiting confirmation
                  </small>
                )}
              </form>
            )}
            {dateMessage && (
              <p className="inline-message" role="status">
                {dateMessage}
              </p>
            )}
          </section>
          <div className="sidebar-note">
            <Icon name="info" size={18} />
            <p>
              Preview only. No details have been sent to Hanson Home or an
              assessment partner.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
