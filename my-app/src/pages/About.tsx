import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './About.css';

/* Animated counter hook */
function useCountUp(target: number, duration: number = 2000, suffix: string = '') {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref, suffix };
}

const About: React.FC = () => {
  const fadeRefs = useRef<HTMLElement[]>([]);

  const homes = useCountUp(80, 2000);
  const co2Total = useCountUp(2, 2500);
  const co2Saved = useCountUp(50, 2000);

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
    <div className="about">
      <Hero
        title="Helping You Make the Electric Choice for Your Home"
        subtitle="We believe that electrifying homes shouldn't be complicated, costly, or inconvenient. We're here to make the transition simple and accessible for everyone."
        background="gradient-green"
        fullHeight={true}
      />

      {/* Mission */}
      <section className="section about__mission" ref={addFadeRef}>
        <div className="container container--narrow text-center fade-in" ref={addFadeRef}>
          <h2 className="about__section-title">Our Mission</h2>
          <p className="about__mission-text">
            Hanson's mission is to transform homes across North America by replacing
            outdated, fossil-fueled systems with advanced electric heat pumps.
            By streamlining the process and lowering costs, we're helping homeowners
            cut emissions, save on energy, and gain control over their home's comfort
            — all without the usual hassle of working with a traditional contractor.
          </p>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section section--gray about__why" ref={addFadeRef}>
        <div className="container fade-in" ref={addFadeRef}>
          <h2 className="about__section-title">Why Choose Hanson?</h2>
          <p className="about__section-subtitle">
            We're reinventing home electrification — no more unreliable contractors
            or hidden costs, just seamless service and quality you can trust.
          </p>

          <div className="why__grid">
            <div className="why__card">
              <div className="why__icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 6l4 8 9 1.3-6.5 6.4 1.5 9.1L20 26l-8 4.8 1.5-9.1L7 15.3l9-1.3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="why__title">Proven Track Record</h3>
              <p className="why__text">
                With hundreds of homes already electrified, Hanson brings proven expertise to every project.
              </p>
            </div>

            <div className="why__card">
              <div className="why__icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 10v10l7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="why__title">100% Focused on Electrification</h3>
              <p className="why__text">
                We specialize exclusively in converting homes to smart, clean, all-electric systems.
              </p>
            </div>

            <div className="why__card">
              <div className="why__icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M8 32l6-10h12l6 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M14 22V12a6 6 0 0112 0v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="why__title">White-Glove Service</h3>
              <p className="why__text">
                From consultation and quoting to expert installation and support, we handle every step with care.
              </p>
            </div>

            <div className="why__card">
              <div className="why__icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="6" y="6" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="why__title">Commitment to Quality</h3>
              <p className="why__text">
                Our team prioritizes efficiency, reliability, and precision to ensure your home is in expert hands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="section section--dark about__impact" ref={addFadeRef}>
        <div className="container text-center fade-in" ref={addFadeRef}>
          <h2 className="about__section-title about__section-title--light">Make a Difference</h2>
          <p className="about__section-subtitle about__section-subtitle--light">
            Switching to Hanson means more than comfort — it's an easy way to cut your carbon footprint.
          </p>

          <div className="impact__grid">
            <div className="impact__stat">
              <span className="impact__number" ref={homes.ref}>{homes.count}M+</span>
              <span className="impact__label">Homes in the U.S. still rely on fossil fuels for heating</span>
            </div>
            <div className="impact__stat">
              <span className="impact__number" ref={co2Total.ref}>{co2Total.count} Billion</span>
              <span className="impact__label">Tons of CO&#8322; from residential heating annually</span>
            </div>
            <div className="impact__stat">
              <span className="impact__number" ref={co2Saved.ref}>{co2Saved.count},000</span>
              <span className="impact__label">Lbs of CO&#8322; avoided per home over 10 years</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section about__cta" ref={addFadeRef}>
        <div className="container text-center fade-in" ref={addFadeRef}>
          <h2 className="about__cta-title">Clean Energy Starts at Home</h2>
          <p className="about__cta-text">
            Ready to make the switch? Get a free, no-obligation quote in minutes.
          </p>
          <Link to="/get-quote" className="btn btn--primary btn--lg">
            Get Your Quote
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
