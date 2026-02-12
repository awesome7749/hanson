import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './Products.css';

const Products: React.FC = () => {
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
    <div className="products">
      <Hero
        title="Smart All-Electric Comfort for Your Whole Home"
        subtitle="Working for your comfort 24/7: our smart all-electric lineup puts your whole home's performance at your fingertips."
        background="gradient-warm"
        fullHeight={true}
        primaryCta={{ text: 'Get Your Quote', to: '/get-quote' }}
      />

      {/* Heat Pump */}
      <section className="section products__item" ref={addFadeRef}>
        <div className="container fade-in" ref={addFadeRef}>
          <div className="product__layout">
            <div className="product__visual">
              <div className="product__image-placeholder product__image--heatpump">
                {/* Replace with real product image */}
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <rect x="20" y="30" width="80" height="60" rx="8" stroke="currentColor" strokeWidth="2.5"/>
                  <circle cx="60" cy="60" r="20" stroke="currentColor" strokeWidth="2"/>
                  <path d="M60 44v32M44 60h32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M30 30V20M50 30V22M70 30V22M90 30V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div className="product__info">
              <span className="product__label">Heating & Cooling</span>
              <h2 className="product__title">The Heat Pump</h2>
              <p className="product__subtitle">The smart heating & cooling system</p>
              <p className="product__description">
                Experience year-round comfort and energy savings without the hassle.
                Our advanced heat pump adapts to your home's needs, providing efficient
                heating and cooling while keeping costs low. Enjoy clean, reliable climate
                control that works with you and the environment.
              </p>

              {/* Tesla-style specs */}
              <div className="specs">
                <div className="specs__grid">
                  <div className="spec">
                    <span className="spec__value">370%</span>
                    <span className="spec__label">Efficiency</span>
                  </div>
                  <div className="spec">
                    <span className="spec__value">-13&deg;F</span>
                    <span className="spec__label">Min Operating Temp</span>
                  </div>
                  <div className="spec">
                    <span className="spec__value">25yr</span>
                    <span className="spec__label">Expected Lifespan</span>
                  </div>
                  <div className="spec">
                    <span className="spec__value">40%</span>
                    <span className="spec__label">Energy Bill Savings</span>
                  </div>
                </div>

                <details className="specs__details">
                  <summary>Full Specifications</summary>
                  <div className="specs__table">
                    <div className="specs__section">
                      <h4>Performance</h4>
                      <div className="specs__row">
                        <span>Heating Capacity</span>
                        <span>18,000 - 60,000 BTU</span>
                      </div>
                      <div className="specs__row">
                        <span>Cooling Capacity</span>
                        <span>18,000 - 48,000 BTU</span>
                      </div>
                      <div className="specs__row">
                        <span>SEER2 Rating</span>
                        <span>Up to 22</span>
                      </div>
                      <div className="specs__row">
                        <span>HSPF2 Rating</span>
                        <span>Up to 10</span>
                      </div>
                    </div>
                    <div className="specs__section">
                      <h4>Features</h4>
                      <div className="specs__row">
                        <span>Variable-Speed Compressor</span>
                        <span>Yes</span>
                      </div>
                      <div className="specs__row">
                        <span>Smart Thermostat Integration</span>
                        <span>Yes</span>
                      </div>
                      <div className="specs__row">
                        <span>Wi-Fi Enabled</span>
                        <span>Yes</span>
                      </div>
                    </div>
                    <div className="specs__section">
                      <h4>Warranty</h4>
                      <div className="specs__row">
                        <span>Parts</span>
                        <span>10 years</span>
                      </div>
                      <div className="specs__row">
                        <span>Compressor</span>
                        <span>12 years</span>
                      </div>
                      <div className="specs__row">
                        <span>Labor</span>
                        <span>2 years</span>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Water Heater */}
      <section className="section section--gray products__item" ref={addFadeRef}>
        <div className="container fade-in" ref={addFadeRef}>
          <div className="product__layout product__layout--reverse">
            <div className="product__visual">
              <div className="product__image-placeholder product__image--water">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <rect x="35" y="15" width="50" height="80" rx="10" stroke="currentColor" strokeWidth="2.5"/>
                  <circle cx="60" cy="55" r="12" stroke="currentColor" strokeWidth="2"/>
                  <path d="M56 52l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M50 95v10M60 95v10M70 95v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M45 25h30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div className="product__info">
              <span className="product__label">Hot Water</span>
              <h2 className="product__title">The Water Heater</h2>
              <p className="product__subtitle">The most efficient water system</p>
              <p className="product__description">
                Enjoy reliable hot water and lower energy bills with ease.
                Smart optimization keeps costs down by adapting to your usage,
                so you always have hot water when you need it — without waste or worry.
              </p>

              <div className="specs">
                <div className="specs__grid">
                  <div className="spec">
                    <span className="spec__value">3.5x</span>
                    <span className="spec__label">More Efficient</span>
                  </div>
                  <div className="spec">
                    <span className="spec__value">65gal</span>
                    <span className="spec__label">Tank Capacity</span>
                  </div>
                  <div className="spec">
                    <span className="spec__value">$300+</span>
                    <span className="spec__label">Annual Savings</span>
                  </div>
                  <div className="spec">
                    <span className="spec__value">10yr</span>
                    <span className="spec__label">Warranty</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Home App */}
      <section className="section products__item" ref={addFadeRef}>
        <div className="container fade-in" ref={addFadeRef}>
          <div className="product__layout">
            <div className="product__visual">
              <div className="product__image-placeholder product__image--app">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <rect x="30" y="10" width="60" height="100" rx="12" stroke="currentColor" strokeWidth="2.5"/>
                  <rect x="38" y="24" width="44" height="68" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="60" cy="104" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M46 42h28M46 54h20M46 66h24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="74" cy="42" r="6" fill="var(--color-success)" opacity="0.8"/>
                </svg>
              </div>
            </div>
            <div className="product__info">
              <span className="product__label">Smart Control</span>
              <h2 className="product__title">The Hanson App</h2>
              <p className="product__subtitle">Your energy control center</p>
              <p className="product__description">
                Manage your home's climate from anywhere with ease. The Hanson app lets you adjust settings,
                monitor home energy usage, and make smart choices — all in one simple interface.
              </p>

              <div className="app-features">
                <div className="app-feature">
                  <h4>Monitor Energy Flow</h4>
                  <p>See how much energy your system is generating and how it's helping you save.</p>
                </div>
                <div className="app-feature">
                  <h4>Customize Preferences</h4>
                  <p>Optimize your generated energy for savings, comfort, or both.</p>
                </div>
                <div className="app-feature">
                  <h4>Get Urgent Alerts</h4>
                  <p>Receive updates on system status and get alerts about issues before they escalate.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section section--dark products__benefits" ref={addFadeRef}>
        <div className="container text-center fade-in" ref={addFadeRef}>
          <h2 className="products__benefits-title">Why Switch to Electric?</h2>
          <div className="benefits__grid">
            <div className="benefit">
              <h3 className="benefit__title">Reduce Costs</h3>
              <p className="benefit__text">
                Hanson automatically runs when energy is at its cleanest and cheapest, storing heat for future use.
                Use heat and hot water whenever you want at the lowest price.
              </p>
            </div>
            <div className="benefit">
              <h3 className="benefit__title">Reduce Bills</h3>
              <p className="benefit__text">
                Get immediate and continuous energy bill reductions by replacing gas with energy harvested from the air.
                Pays for itself in as little as five years.
              </p>
            </div>
            <div className="benefit">
              <h3 className="benefit__title">Reduce Emissions</h3>
              <p className="benefit__text">
                Switching to Hanson cuts more emissions from home heating than going from a gas car to an EV.
                Make an outsized impact starting at home.
              </p>
            </div>
          </div>
          <Link to="/get-quote" className="btn btn--white btn--lg products__benefits-cta">
            Get Your Quote
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Products;
