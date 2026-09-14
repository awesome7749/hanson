import React from "react";
import { Link, useParams } from "react-router-dom";
import { usePreview } from "./Store";
import { formatAddress } from "./model";
import { Icon } from "./Shared";

export default function Receipt() {
  const { id } = useParams();
  const { leads, newDraft } = usePreview();
  const lead = leads.find((item) => item.id === id && !item.sample);
  if (!lead) return <section className="wrap narrow section prose">
    <h1>Looking for your request?</h1>
    <p>Your confirmation is available in the browser tab where you submitted it. Closing that tab does not cancel a request already sent to Hanson Home.</p>
    <Link className="button" to="/contact">Contact Hanson Home</Link>
  </section>;
  return <section className="wrap narrow section prose">
    <span className="round-icon"><Icon name="check" size={30} /></span>
    <span className="eyebrow">REQUEST RECEIVED</span>
    <h1>Thank you, {lead.draft.firstName}.</h1>
    <p>Hanson Home has received your {lead.draft.intent === "assessment" ? "energy assessment" : "heat-pump"} request for {formatAddress(lead.draft)}.</p>
    <div className="panel">
      <h2>What happens next?</h2>
      {lead.draft.partnerConsent && <p>Your request is coordinated with our sister business Ventrix. The team will confirm the next step and any appointment separately.</p>}
      <p>Our team will review your details and follow up by {lead.draft.contactMethod.toLowerCase()} to discuss your home and the next step.</p>
      {lead.draft.preferredDate && <p>Preferred assessment date: <strong>{lead.draft.preferredDate}</strong>. Your team will confirm availability separately.</p>}
      <p>No appointment is booked and there is no obligation to proceed.</p>
      <p><small>Request reference: <span style={{ overflowWrap: "anywhere" }}>{lead.id}</span><br />Received: {new Date(lead.createdAt).toLocaleString()}</small></p>
    </div>
    <div className="inline-actions">
      <Link className="button" to="/">Back to home</Link>
      <Link className="text-link" to="/start" onClick={newDraft}>Start another request</Link>
    </div>
  </section>;
}
