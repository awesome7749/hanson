import React, { useState } from "react";
import { Link } from "react-router-dom";
import { usePreview } from "./Store";
import { Lead, LeadStatus, formatAddress, labels } from "./model";
import { Review } from "./Intake";
import { Icon } from "./Shared";
import { photoGuides } from "./Project";
function LeadDetail({ lead }: { lead: Lead }) {
  const { updateLead, photos } = usePreview();
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes);
  const [appointment, setAppointment] = useState(lead.appointment);
  const [message, setMessage] = useState("");
  return (
    <>
      <div className="staff-detail-header">
        <div>
          <span className="eyebrow">
            {lead.sample ? "SAMPLE LEAD" : "THIS SESSION"}
          </span>
          <h2>
            {lead.draft.firstName} {lead.draft.lastName}
          </h2>
          <p>{formatAddress(lead.draft)}</p>
        </div>
        <Link className="text-link" to={`/project/${lead.id}`}>
          Customer view <Icon name="arrow" size={16} />
        </Link>
      </div>
      <form
        className="staff-controls"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            status === "assessment_scheduled" &&
            (!appointment || Number.isNaN(Date.parse(appointment)))
          ) {
            setMessage(
              "Add an appointment date and time before marking it scheduled.",
            );
            return;
          }
          updateLead(lead.id, {
            status,
            notes,
            appointment:
              status === "assessment_scheduled"
                ? appointment
                : lead.appointment,
          });
          setMessage("Preview updated. No notification was sent.");
        }}
      >
        <div className="form-grid">
          <label className="field">
            <span>Preview status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
            >
              {Object.entries(labels).map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Sample appointment</span>
            <input
              type="datetime-local"
              value={appointment}
              onChange={(e) => setAppointment(e.target.value)}
              required={status === "assessment_scheduled"}
            />
          </label>
        </div>
        <label className="field">
          <span id="staff-notes-label">Internal notes</span>
          <textarea
            aria-labelledby="staff-notes-label"
            rows={3}
            value={notes}
            placeholder="Add follow-up context for the team…"
            onChange={(e) => setNotes(e.target.value)}
          />
          <small>
            Internal notes are omitted from the customer view. This is not a
            secured staff portal.
          </small>
        </label>
        <div className="inline-actions">
          <button className="button small" type="submit">
            Save preview changes
          </button>
          {message && (
            <span role="status" className="inline-message">
              {message}
            </span>
          )}
        </div>
      </form>
      <Review d={lead.draft} />
      <section className="staff-photos">
        <h3>Equipment photos</h3>
        <div className="staff-photo-grid">
          {photoGuides.map(([k, l]) => {
            const p = photos[`${lead.id}:${k}`];
            return (
              <div key={k}>
                {p ? (
                  <img src={p.url} alt={l} />
                ) : (
                  <div className="photo-missing">
                    <Icon name="camera" />
                    <span>
                      {lead.photoNames[k] ? "Needs reattachment" : "Not added"}
                    </span>
                  </div>
                )}
                <small>{l}</small>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
export default function Staff() {
  const { leads } = usePreview();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(leads[0]?.id);
  const filtered = leads.filter(
    (l) =>
      (status === "all" || l.status === status) &&
      `${l.draft.firstName} ${l.draft.lastName} ${l.draft.city} ${l.draft.email}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const lead = leads.find((l) => l.id === selected);
  return (
    <div className="workspace wrap staff-workspace">
      <div className="workspace-breadcrumb">
        <Link to="/">Hanson Home</Link>
        <span>/</span>
        <span>Staff preview</span>
      </div>
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">THE NEXT CONVERSATION STARTS HERE</span>
          <h1>Your home requests.</h1>
          <p>A preview of how customer details come together for your team.</p>
        </div>
        <Link className="button ghost small" to="/start">
          Try the customer intake <Icon name="arrow" size={17} />
        </Link>
      </div>
      <div className="notice">
        <Icon name="info" size={19} />
        <span>
          Sample data and requests from this browser session only. This preview
          has no staff authentication or live customer records.
        </span>
      </div>
      <div className="stat-grid">
        {[
          ["Total requests", leads.length],
          ["New requests", leads.filter((l) => l.status === "new").length],
          [
            "Assessment requests",
            leads.filter((l) => l.status === "assessment_requested").length,
          ],
          [
            "Proposals ready",
            leads.filter((l) => l.status === "proposal_ready").length,
          ],
        ].map(([t, v]) => (
          <div className="stat" key={t}>
            <span>{t}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>
      <div className="staff-grid">
        <section className="panel lead-list-panel">
          <label className="field">
            <span>Find a request</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, town or email"
              type="search"
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All requests</option>
              {Object.entries(labels).map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <div className="lead-list">
            {filtered.length ? (
              filtered.map((l) => (
                <button
                  key={l.id}
                  className={
                    "lead-button " + (selected === l.id ? "selected" : "")
                  }
                  onClick={() => setSelected(l.id)}
                >
                  <div className="lead-avatar">
                    {l.draft.firstName[0]}
                    {l.draft.lastName[0]}
                  </div>
                  <div>
                    <b>
                      {l.draft.firstName} {l.draft.lastName}
                    </b>
                    <span>
                      {l.draft.city} ·{" "}
                      {l.draft.intent === "heat-pump"
                        ? "Heat pump"
                        : "Assessment"}
                    </span>
                    <small>{labels[l.status]}</small>
                  </div>
                  <Icon name="chevron" size={16} />
                </button>
              ))
            ) : (
              <p className="empty-list">No requests match these filters.</p>
            )}
          </div>
        </section>
        <section className="panel staff-detail">
          {lead ? (
            <LeadDetail lead={lead} key={lead.id} />
          ) : (
            <p>Select a request to review its details.</p>
          )}
        </section>
      </div>
    </div>
  );
}
