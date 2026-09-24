import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { usePreview } from "./Store";
import { Icon } from "./Shared";
import { fbqTrack } from "./pixel";

interface ThankYouState {
  id?: string;
  firstName?: string;
  intent?: string;
  partnerConsent?: boolean;
}

// Fixed confirmation URL for ad conversion tracking (Meta CompleteRegistration,
// later Google Ads). Reached after a live request is submitted successfully.
export default function ThankYou() {
  const state = (useLocation().state || {}) as ThankYouState;
  const { newDraft } = usePreview();
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current || !state.id) return;
    tracked.current = true;
    fbqTrack(
      "track",
      "CompleteRegistration",
      { content_name: state.intent || "heat-pump" },
      { eventID: `${state.id}-complete` },
    );
  }, [state.id, state.intent]);
  return (
    <section className="wrap narrow section prose">
      <span className="round-icon">
        <Icon name="check" size={30} />
      </span>
      <span className="eyebrow">REQUEST RECEIVED</span>
      <h1>Thank you{state.firstName ? `, ${state.firstName}` : ""}.</h1>
      <p>
        A Hanson Home specialist will call you within 1 business day to go over
        your{" "}
        {state.intent === "assessment"
          ? "energy assessment"
          : "heat-pump quote"}
        .
      </p>
      <div className="panel">
        <h2>What happens next?</h2>
        {state.partnerConsent && (
          <p>
            Your request is coordinated with our licensed local service
            partners. The team will confirm the next step and any appointment
            separately.
          </p>
        )}
        <p>
          Want to talk sooner? Call or text us any time:{" "}
          <a
            href="tel:+13399994516"
            onClick={() => fbqTrack("track", "Contact")}
          >
            (339) 999-4516
          </a>
          .
        </p>
        <p>No appointment is booked and there is no obligation to proceed.</p>
        {state.id && (
          <p>
            <small>
              Request reference:{" "}
              <span style={{ overflowWrap: "anywhere" }}>{state.id}</span>
            </small>
          </p>
        )}
      </div>
      <div className="inline-actions">
        <Link className="button" to="/">
          Back to home
        </Link>
        <Link className="text-link" to="/start" onClick={newDraft}>
          Start another request
        </Link>
      </div>
    </section>
  );
}
