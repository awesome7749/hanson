import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './Home.css';

const Home: React.FC = () => {
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
    <div className="home">
      {/* Hero */}
      <Hero
        title="The Modern Way to Upgrade Your Home Comfort"
        subtitle="Replace your outdated furnace with a high-efficiency heat pump system. All-inclusive pricing. Single-day installation. Save up to 40% on energy bills."
        primaryCta={{ text: 'Get Your Quote', to: '/get-quote' }}
        secondaryCta={{ text: 'Learn More', to: '/how-it-works' }}
        background="gradient-blue"
      />

      {/* Value Props */}
      <section className="section home__value-props" ref={addFadeRef}>
        <div className="container fade-in" ref={addFadeRef}>
          <div className="value-props__grid">
            <div className="value-prop">
              <div className="value-prop__icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 24l6 6 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="value-prop__title">Up to 40% Savings</h3>
              <p className="value-prop__text">
                Drastically reduce your monthly energy bills by switching from gas to an electric heat pump system.
              </p>
            </div>

            <div className="value-prop">
              <div className="value-prop__icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="2"/>
                  <path d="M24 14v10l6 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="value-prop__title">Single-Day Installation</h3>
              <p className="value-prop__text">
                Our expert team handles everything in one day. No weeks of disruption, no multiple contractor visits.
              </p>
            </div>

            <div className="value-prop">
              <div className="value-prop__icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="2"/>
                  <path d="M17 30h14M20 22h8M22 14h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="value-prop__title">All-Inclusive Pricing</h3>
              <p className="value-prop__text">
                One transparent price covers equipment, permits, electrical work, and installation. No hidden fees, ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="section section--gray home__process" ref={addFadeRef}>
        <div className="container fade-in" ref={addFadeRef}>
          <h2 className="home__section-title">How It Works</h2>
          <p className="home__section-subtitle">
            Three simple steps to upgrade your home.
          </p>

          <div className="process__grid">
            <div className="process__step">
              <span className="process__number">01</span>
              <h3 className="process__title">Instant Online Quote</h3>
              <p className="process__text">
                Enter your address and answer a few questions. Our system designs the perfect upgrade and gives you an all-inclusive price.
              </p>
            </div>

            <div className="process__step">
              <span className="process__number">02</span>
              <h3 className="process__title">Virtual Walkthrough</h3>
              <p className="process__text">
                Submit photos of your existing equipment. Our advisors confirm all aspects of your upgrade and prepare for installation.
              </p>
            </div>

            <div className="process__step">
              <span className="process__number">03</span>
              <h3 className="process__title">Single-Day Switch</h3>
              <p className="process__text">
                Our team arrives fully prepared. We remove the old system, install the new one, and get you connected to the Hanson app.
              </p>
            </div>
          </div>

          <div className="text-center home__process-cta">
            <Link to="/how-it-works" className="btn btn--secondary">
              See Full Process
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section section--dark home__stats" ref={addFadeRef}>
        <div className="container fade-in" ref={addFadeRef}>
          <div className="stats__grid">
            <div className="stat">
              <span className="stat__number">80M+</span>
              <span className="stat__label">Homes in the U.S. still rely on fossil fuels for heating</span>
            </div>
            <div className="stat">
              <span className="stat__number">370%</span>
              <span className="stat__label">Efficiency of modern heat pump systems</span>
            </div>
            <div className="stat">
              <span className="stat__number">50K</span>
              <span className="stat__label">Lbs of CO&#8322; saved over 10 years per home</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section home__final-cta" ref={addFadeRef}>
        <div className="container text-center fade-in" ref={addFadeRef}>
          <h2 className="home__cta-title">Clean Energy Starts at Home</h2>
          <p className="home__cta-text">
            Join thousands of homeowners who have already made the switch to smarter, cleaner home comfort.
          </p>
          <div className="btn-group">
            <Link to="/get-quote" className="btn btn--primary btn--lg">
              Get Your Quote
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
