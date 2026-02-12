import React, { useState } from 'react';
import Hero from '../components/Hero';
import './GetQuote.css';

const GetQuote: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      // No backend - just UI for now
    }
  };

  return (
    <div className="get-quote">
      <Hero
        title="Get Your Instant Quote"
        subtitle="Find out how much you can save by switching to an all-electric home comfort system."
        background="gradient-blue"
        fullHeight={false}
      />

      <section className="section get-quote__main">
        <div className="container container--narrow text-center">
          <div className="quote__card">
            <div className="quote__badge">Coming Soon</div>
            <h2 className="quote__title">Our Instant Quote Engine Is Almost Ready</h2>
            <p className="quote__text">
              We're building a tool that will let you enter your address and get
              an all-inclusive price estimate for your HVAC upgrade in seconds.
              No contractor visits, no phone calls, no waiting.
            </p>

            {!submitted ? (
              <form className="quote__form" onSubmit={handleSubmit}>
                <p className="quote__form-label">
                  Be the first to know when it launches:
                </p>
                <div className="quote__input-group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="quote__input"
                    required
                  />
                  <button type="submit" className="btn btn--primary btn--lg">
                    Notify Me
                  </button>
                </div>
              </form>
            ) : (
              <div className="quote__success">
                <div className="quote__success-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="23" stroke="var(--color-success)" strokeWidth="2"/>
                    <path d="M16 24l6 6 10-12" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>You're on the list!</h3>
                <p>We'll send you an email as soon as the instant quote tool is live.</p>
              </div>
            )}

            <div className="quote__features">
              <div className="quote__feature">
                <strong>Instant Pricing</strong>
                <span>Get a complete quote in under 2 minutes</span>
              </div>
              <div className="quote__feature">
                <strong>All-Inclusive</strong>
                <span>Equipment, permits, and installation covered</span>
              </div>
              <div className="quote__feature">
                <strong>No Obligation</strong>
                <span>Explore your options with zero commitment</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GetQuote;
