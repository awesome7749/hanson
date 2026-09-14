import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LIVE } from "./deployment";
export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    arrow: "M5 12h14m-5-5 5 5-5 5",
    check: "m5 12 4 4L19 6",
    home: "m3 10 9-7 9 7v10H3V10m6 10v-7h6v7",
    sun: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0",
    snow: "M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7m-12-3 3.3 3 3.3-3m-6.6 16 3.3-3 3.3 3",
    pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0ZM14 10a2 2 0 1 0-4 0 2 2 0 0 0 4 0",
    clock: "M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0M12 7v5l3 2",
    calendar: "M4 5h16v16H4V5m0 5h16M8 3v4m8-4v4",
    leaf: "M20 3C9 2 3 6 4 14c5 7 16 3 16-11ZM4 21l11-11",
    shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3m-4 9 3 3 5-6",
    camera: "M3 7h4l2-3h6l2 3h4v13H3V7m13 6a4 4 0 1 0-8 0 4 4 0 0 0 8 0",
    mail: "M3 5h18v14H3V5m0 1 9 7 9-7",
    phone: "M7 3H3c0 10 8 18 18 18v-4l-5-2-2 2a14 14 0 0 1-7-7l2-2-2-5",
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "m6 6 12 12M6 18 18 6",
    chevron: "m8 5 7 7-7 7",
    edit: "m4 16 12-12 4 4L8 20H4v-4m10-10 4 4",
    grid: "M3 3h7v7H3V3m11 0h7v7h-7V3M3 14h7v7H3v-7m11 0h7v7h-7v-7",
    list: "M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1",
    info: "M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0M12 11v6m0-10v1",
    upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
    spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.home} />
    </svg>
  );
}
export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Hanson Home homepage">
      <img src="/images/hanson-mascot.png" alt="" width="60" height="62" />
      <span>
        HANSON<span className="brand-sub">HOME</span>
      </span>
    </Link>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  const { pathname, hash } = useLocation();
  useEffect(() => {
    setMenu(false);
    if (hash) {
      requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView(),
      );
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  const compact =
    pathname.startsWith("/start") ||
    pathname.startsWith("/project") ||
    pathname.startsWith("/staff") || pathname.startsWith("/admin");
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {!LIVE && <div className="preview-bar">
        <span>DESIGN PREVIEW</span> Explore with sample details. Requests stay
        in this browser session.
      </div>}
      <header className="site-header">
        <div className="wrap nav">
          <Brand />
          {!compact && (
            <>
              <nav
                className={menu ? "nav-links open" : "nav-links"}
                aria-label="Main navigation"
              >
                <NavLink to="/heat-pumps">Heat pumps</NavLink>
                <NavLink to="/pricing">Pricing</NavLink>
                <NavLink to="/how-it-works">Installation</NavLink>
                <NavLink to="/assessment">Energy assessment</NavLink>
                <NavLink to="/warranty">Warranty</NavLink>
                <NavLink to="/about">About us</NavLink>
              </nav>
              <button
                className="menu-toggle icon-button"
                onClick={() => setMenu(!menu)}
                aria-label={menu ? "Close menu" : "Open menu"}
                aria-expanded={menu}
              >
                <Icon name={menu ? "close" : "menu"} />
              </button>
            </>
          )}
          <Link
            className={compact ? "nav-help" : "button small nav-cta"}
            to={compact ? "/contact" : "/start?intent=heat-pump"}
          >
            {compact ? "Need a hand?" : "Get an estimate"}
            {!compact && <Icon name="arrow" size={18} />}
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      {!compact && (
        <footer>
          <div className="wrap footer-top">
            <div>
              <Brand />
              <p>
                Massachusetts heat-pump specialists.
                <br />Installation. Made simple.
              </p>
            </div>
            <div>
              <b>YOUR HOME</b>
              <Link to="/heat-pumps">Heat pumps</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/assessment">Energy assessments</Link>
              <Link to="/how-it-works">How it works</Link>
              <Link to="/warranty">Warranty & care</Link>
            </div>
            <div>
              <b>HANSON HOME</b>
              <Link to="/about">About us</Link>
              <Link to="/service-area">Massachusetts service area</Link>
              <Link to="/contact">Get in touch</Link>
            </div>
            <div>
              <b>LET'S GET STARTED</b>
              <Link to="/start?intent=heat-pump">
                Get a heat-pump estimate <Icon name="arrow" size={18} />
              </Link>
              <p>Made for Massachusetts homes.</p>
            </div>
          </div>
          <div className="wrap footer-bottom">
            <span>© {new Date().getFullYear()} Hanson Home</span>
            <div>
              <Link to="/privacy">Privacy</Link>
              {!LIVE && <Link to="/project">My project</Link>}
              {!LIVE && <Link to="/staff">Staff preview</Link>}
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
export function FAQ({ items }: { items?: [string, string][] } = {}) {
  return (
    <div className="faq-list">
      {(
        items || [
          [
            "Can a heat pump handle a Massachusetts winter?",
            "Heat pumps designed for cold climates can provide heating through New England winters. The right equipment and any backup heating need to be selected for your home and its heating demand.",
          ],
          [
            "Do I need to know which system I want?",
            "No. Tell us about your home, your current heating and cooling, and what you want to improve. We can work through the options with you.",
          ],
          [
            "What about rebates and incentives?",
            "Your utility, existing system, home and project scope can affect eligibility. We will collect that context for review. Eligibility and incentive amounts must be confirmed for your project.",
          ],
          [
            "What if I already had a home energy assessment?",
            "Let us know in the form. An existing assessment can be part of your home profile, and we can review what you need next.",
          ],
          [
            "Am I committing to an installation?",
            "No. Starting an estimate or assessment request is a first conversation about your home. A final scope, price and schedule would be agreed separately.",
          ],
          [
            "How much will a heat-pump installation cost?",
            "Equipment, room coverage, electrical needs and installation work all affect the price. A useful proposal itemizes the scope and explains any incentive assumptions. The initial form gives us context for that review; it is not a fixed-price quote.",
          ],
          [
            "What should I ask about warranty coverage?",
            "Ask for the equipment warranty and installation labor coverage separately, including their periods, exclusions, registration requirements and the contact for service. Review the written terms for the proposed system before you approve the work.",
          ],
        ]
      ).map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <span aria-hidden="true">+</span>
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
