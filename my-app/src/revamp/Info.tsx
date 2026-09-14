import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FAQ, Icon } from "./Shared";
import { usePreview } from "./Store";
import { VentrixConnection } from "./Education";
import { lifestyleImages } from "./LifestylePhoto";
import { LIVE } from "./deployment";
const pages: Record<
  string,
  {
    eyebrow: string;
    title: string;
    intro: string;
    cards: [string, string, string][];
    intent?: string;
  }
> = {
  "/about": {
    eyebrow: "MEET HANSON HOME",
    title: "Your Massachusetts\nheat-pump specialists.",
    intro:
      "Hanson Home helps Massachusetts homeowners choose and install heat pumps. We bring equipment selection, clear project pricing, installation and system handover into one straightforward process.",
    cards: [
      [
        "home",
        "Heat pumps are our focus",
        "We review your rooms, current equipment and comfort needs to help select the right system.",
      ],
      [
        "list",
        "Clear scope and pricing",
        "Review the equipment, included work, exclusions and total before approving your installation.",
      ],
      [
        "shield",
        "Installation and support",
        "Understand the schedule, how to use your new system and who to contact with a question.",
      ],
    ],
  },
  "/service-area": {
    eyebrow: "CLOSE TO HOME",
    title: "Made for\nMassachusetts homes.",
    intro:
      "Our starting service area is Massachusetts. Share your town and project details so the team can confirm local coverage and the right next step.",
    cards: [
      [
        "pin",
        "Tell us your town",
        "Your full address helps the team check project coverage.",
      ],
      [
        "home",
        "A home of any shape",
        "Larger buildings and unusual setups may need individual review.",
      ],
      [
        "calendar",
        "Plan together",
        "A requested date is a starting point. Your appointment will be confirmed separately.",
      ],
    ],
  },
  "/contact": {
    eyebrow: "LET’S START WITH YOUR HOME",
    title: "Talk to Hanson Home\nabout your project.",
    intro:
      "Tell us what you want to improve: a cold bedroom, an aging heating system, summer cooling or simply a clearer plan. Share your home details and choose how you would like to continue the conversation.",
    cards: [
      [
        "sun",
        "Thinking about a heat pump?",
        "Share your current heating and cooling, comfort concerns and timing. You can leave technical details unknown and review everything before finishing.",
      ],
      [
        "home",
        "Looking for an assessment?",
        "Start with your utilities and assessment history. The right next step may be a whole-home assessment before a system decision.",
      ],
    ],
  },
};
export default function Info() {
  const { pathname } = useLocation();
  const { clearPreview } = usePreview();
  const [cleared, setCleared] = React.useState(false);
  if (pathname === "/privacy" && LIVE) return (
    <div className="wrap narrow section prose">
      <span className="eyebrow">PRIVACY</span>
      <h1>Your information and your request.</h1>
      <p>When you submit a form, Hanson Home receives your contact details, property address, home and equipment information, utility and assessment details, and any preferences or additional contact information you provide.</p>
      <h3>How we use your details</h3>
      <p>We use this information to review your request, contact you in your preferred way, discuss service coverage and plan the next step. Your contact permission and optional marketing choice are recorded with your request.</p>
      <h3>Where your information goes</h3>
      <p>Submitted requests are stored in Hanson Home’s lead system using cloud hosting and database services. Staff access requires sign-in. Submitting this form does not automatically send your details to an energy assessment partner, utility or quoting service.</p>
      <h3>Your browser draft</h3>
      <p>This tab keeps a draft and your confirmation in browser session storage so you can continue during your visit. You can clear that browser copy below. Clearing it does not delete information already sent to Hanson Home.</p>
      <button className="button ghost" onClick={() => { clearPreview(); setCleared(true); }}>Clear my browser details</button>
      {cleared && <p role="status">Your browser details have been cleared.</p>}
      <h3>Questions or changes</h3>
      <p>To correct your details, withdraw contact permission or request deletion, reply to Hanson Home when the team contacts you, or <Link to="/contact">contact us</Link> and describe your request in the form’s notes. Please do not include account passwords, payment information or government ID numbers.</p>
    </div>
  );
  if (pathname === "/privacy")
    return (
      <div className="wrap narrow section prose">
        <span className="eyebrow">ABOUT THIS PREVIEW</span>
        <h1>Your details, in this demo.</h1>
        <p>
          This design preview stores the details you enter in this browser’s
          session storage. It does not send requests to Hanson Home, Ventrix, a
          quoting service or an appointment service.
        </p>
        <h3>Use sample information</h3>
        <p>
          The staff preview can see requests created in the same browser
          session. It is a demonstration, not a secured customer or staff
          account.
        </p>
        <h3>Photos stay on your device</h3>
        <p>
          Selected images are displayed locally while the app stays open. After
          a refresh, you will need to reattach them. Nothing is uploaded.
        </p>
        <h3>Clear your preview details</h3>
        <p>
          You can clear your entered requests, draft and selected photos here.
          The example leads will be restored.
        </p>
        <button
          className="button ghost"
          onClick={() => {
            clearPreview();
            setCleared(true);
          }}
        >
          Clear my preview details
        </button>
        {cleared && (
          <p role="status">Your preview details have been cleared.</p>
        )}
        <h3>Before the website launches</h3>
        <p>
          A final privacy notice, secure data handling and live request
          processing will need to be in place. This page describes the current
          preview only.
        </p>
      </div>
    );
  const page = pages[pathname];
  const pageImage =
    pathname === "/service-area"
      ? {
          src: "/images/new-england-home.png",
          alt: "Illustration of a Massachusetts home",
        }
      : pathname === "/about"
        ? lifestyleImages.family
        : lifestyleImages.conversation;
  if (!page)
    return (
      <div className="wrap empty-state">
        <h1>Let’s get you back home.</h1>
        <p>This page isn’t part of the new website.</p>
        <Link className="button" to="/">
          Back to home <Icon name="arrow" />
        </Link>
      </div>
    );
  return (
    <>
      <section className="info-hero wrap">
        <div>
          <span className="eyebrow">{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
          <div className="inline-actions">
            <Link
              className="button"
              to={"/start?intent=" + (page.intent || "heat-pump")}
            >
              {page.intent
                ? "Request an assessment"
                : "Explore my home’s options"}
              <Icon name="arrow" size={18} />
            </Link>
            {pathname === "/contact" && (
              <Link className="text-link" to="/start?intent=assessment">
                Energy assessment <Icon name="arrow" size={17} />
              </Link>
            )}
          </div>
        </div>
        <div className="info-image">
          <img src={pageImage.src} alt={pageImage.alt} decoding="async" />
          <span>
            {pathname === "/contact"
              ? "LET’S TALK ABOUT YOUR HOME"
              : "COMFORT STARTS AT HOME"}
          </span>
        </div>
      </section>
      <section className="wrap info-cards">
        {page.cards.map(([i, t, d]) => (
          <article className="panel" key={t}>
            <span className="round-icon">
              <Icon name={i} size={27} />
            </span>
            <h3>{t}</h3>
            <p>{d}</p>
          </article>
        ))}
      </section>
      {pathname === "/about" && <VentrixConnection />}
      <section className="section wrap faq-section">
        <div>
          <span className="eyebrow">LET’S TALK IT THROUGH</span>
          <h2>A few helpful answers.</h2>
        </div>
        <FAQ />
      </section>
    </>
  );
}
