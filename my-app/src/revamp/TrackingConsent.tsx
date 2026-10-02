import React, { useState } from "react";
import { Link } from "react-router-dom";
import { setTrackingChoice, trackingChoice } from "./pixel";

export default function TrackingConsent() {
  const [open, setOpen] = useState(() => !trackingChoice());
  const choose = (allowed: boolean) => { setTrackingChoice(allowed); setOpen(false); };
  return <>
    <button className="tracking-preferences" onClick={() => setOpen(true)}>Tracking preferences</button>
    {open && <section className="tracking-consent" aria-labelledby="tracking-title" aria-describedby="tracking-description">
      <h2 id="tracking-title">Your choice about Meta tracking</h2>
      <p id="tracking-description">Optional advertising tracking is off until you allow it. With your permission, we share visits, interactions, ad identifiers and request contact information with Meta to measure advertising. California visitors and all other visitors can decline and still use our site.</p>
      <Link to="/privacy">Read our privacy notice</Link>
      <div className="tracking-actions">
        <button className="button light" onClick={() => choose(false)}>Decline tracking</button>
        <button className="button" onClick={() => choose(true)}>Allow Meta tracking</button>
      </div>
    </section>}
  </>;
}
