import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadTrackingPolicy, setTrackingChoice, trackingChoice } from "./pixel";

export default function TrackingConsent() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let active = true;
    void loadTrackingPolicy().then((required) => {
      if (active && required && !trackingChoice()) setOpen(true);
    });
    return () => { active = false; };
  }, []);
  const choose = (allowed: boolean) => { setTrackingChoice(allowed); setOpen(false); };
  return <>
    <button className="tracking-preferences" onClick={() => setOpen(true)} aria-label="Tracking preferences">Privacy choices</button>
    {open && <section className="tracking-consent" aria-labelledby="tracking-title" aria-describedby="tracking-description">
      <h2 id="tracking-title">Optional Meta tracking</h2>
      <p id="tracking-description">Allow Meta to receive visits, ad identifiers and request contact details to measure ads? Declining won’t affect your use of this site.</p>
      <Link to="/privacy">Privacy details</Link>
      <div className="tracking-actions">
        <button className="tracking-choice" onClick={() => choose(false)} aria-label="Decline tracking">Decline</button>
        <button className="tracking-choice" onClick={() => choose(true)} aria-label="Allow Meta tracking">Allow</button>
      </div>
    </section>}
  </>;
}
