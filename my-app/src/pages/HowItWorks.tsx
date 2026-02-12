import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './HowItWorks.css';

const HowItWorks: React.FC = () => {
  const fadeRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    fadeRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addFadeRef = (el: HTMLElement | null) => {
    if (el && !fadeRefs.current.includes(el)) {
      fadeRefs.current.push(el);
    }
  };

  return (
    <div className="how-it-works">
      <Hero
        title="Easy as Flipping a Switch"
        subtitle="Our white-glove service takes care of everything for your switch to clean energy. It's better for your comfort, your wallet, and the planet."
        background="dark"
        fullHeight={true}
        primaryCta={{ text: 'Get Started', to: '/get-quote' }}
      />

      {/* Principles */}
      <section className="section hiw__principles" ref={addFadeRef}>
        <div className="container fade-in" ref={addFadeRef}>
          <h2 className="hiw__section-title">Our All-Inclusive Process</h2>
          <p className="hiw__section-subtitle">
            We make it a no-brainer to upgrade your home to electric.
          </p>
          <div className="principles__grid">
            <div className="principle">
              <h4 className="principle__title">White-Glove Service</h4>
              <p className="principle__text">We handle every detail from start to finish so you don't have to.</p>
            </div>
            <div className="principle">
              <h4 className="principle__title">Transparent Pricing</h4>
              <p className="principle__text">One all-inclusive price. No surprise charges, no hidden fees.</p>
            </div>
            <div className="principle">
              <h4 className="principle__title">Super Simple</h4>
              <p className="principle__text">Everything happens online or at your door. No store visits required.</p>
            </div>
            <div className="principle">
              <h4 className="principle__title">Fully Permitted</h4>
              <p className="principle__text">All permits and electrical work are included in your package.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 1 */}
      <section className="section section--gray hiw__step" ref={addFadeRef}>
        <div className="container fade-in" ref={addFadeRef}>
          <div className="step__layout">
            <div className="step__visual">
              <div className="step__illustration step__illustration--quote">
                <div className="step__icon-large">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <rect x="12" y="8" width="56" height="64" rx="8" stroke="currentColor" strokeWidth="2.5"/>
                    <path d="M24 24h32M24 34h24M24 44h28M24 54h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="58" cy="58" r="14" fill="var(--color-accent)" stroke="var(--color-accent)" strokeWidth="2"/>
                    <path d="M52 58l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="step__content">
              <span className="step__label">Step One</span>
              <h2 className="step__title">Instant Online Quote</h2>
              <p className="step__text">
                Our system will look up the information we need to design the perfect all-electric upgrade for your home.
                With a few simple questions, we'll give you an all-inclusive price estimate.
              </p>
              <ul className="step__features">
                <li>Enter your address to get started</li>
                <li>Answer a few questions about your home</li>
                <li>Receive a detailed, transparent price estimate</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2 */}
      <section className="section hiw__step" ref={addFadeRef}>
        <div className="container fade-in" ref={addFadeRef}>
          <div className="step__layout step__layout--reverse">
            <div className="step__visual">
              <div className="step__illustration step__illustration--walkthrough">
                <div className="step__icon-large">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <rect x="20" y="12" width="40" height="56" rx="6" stroke="currentColor" strokeWidth="2.5"/>
                    <circle cx="40" cy="60" r="3" stroke="currentColor" strokeWidth="2"/>
                    <rect x="28" y="22" width="24" height="28" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M34 34l4 4 8-8" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="step__content">
              <span className="step__label">Step Two</span>
              <h2 className="step__title">Virtual Walkthrough</h2>
              <p className="step__text">
                We'll send you a link to easily submit a few photos of your existing equipment, such as your electrical panel and home heating equipment.
              </p>
              <ul className="step__features">
                <li>Snap photos of your current HVAC system</li>
                <li>Our advisors review and confirm your upgrade scope</li>
                <li>We'll notify you if any additional work is needed</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3 */}
      <section className="section section--gray hiw__step" ref={addFadeRef}>
        <div className="container fade-in" ref={addFadeRef}>
          <div className="step__layout">
            <div className="step__visual">
              <div className="step__illustration step__illustration--install">
                <div className="step__icon-large">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <path d="M14 60h52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    <rect x="20" y="24" width="40" height="36" rx="4" stroke="currentColor" strokeWidth="2.5"/>
                    <path d="M30 44h20M40 34v20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M40 8v10" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M28 14l12-6 12 6" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="step__content">
              <span className="step__label">Step Three</span>
              <h2 className="step__title">Single-Day Switch</h2>
              <p className="step__text">
                Our expert team will arrive fully prepared and ready to take care of all the details.
                We'll remove your existing gas appliance and install your new all-electric Hanson system in a single day.
              </p>
              <ul className="step__features">
                <li>Professional removal of old equipment</li>
                <li>Expert installation of your new system</li>
                <li>System commissioning and app connection</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Living with Hanson */}
      <section className="section section--dark hiw__living" ref={addFadeRef}>
        <div className="container text-center fade-in" ref={addFadeRef}>
          <h2 className="hiw__section-title hiw__section-title--light">Living with Hanson</h2>
          <p className="hiw__section-subtitle hiw__section-subtitle--light">
            Energy savings on autopilot. Effortlessly reduce energy costs with remote monitoring,
            real-time diagnostics, and one-click support.
          </p>
          <div className="living__grid">
            <div className="living__feature">
              <h4>Remote Monitoring</h4>
              <p>We keep an eye on your system 24/7 to ensure peak performance.</p>
            </div>
            <div className="living__feature">
              <h4>Real-Time Diagnostics</h4>
              <p>Catch issues before they become problems with smart alerts.</p>
            </div>
            <div className="living__feature">
              <h4>One-Click Support</h4>
              <p>Need help? Our team is just a tap away in the Hanson app.</p>
            </div>
          </div>
          <Link to="/get-quote" className="btn btn--white btn--lg hiw__living-cta">
            Get Your Quote
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
