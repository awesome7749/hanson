import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

interface HeroProps {
  title: string;
  subtitle?: string;
  primaryCta?: { text: string; to: string };
  secondaryCta?: { text: string; to: string };
  background?: 'light' | 'dark' | 'gradient-blue' | 'gradient-green' | 'gradient-warm';
  fullHeight?: boolean;
  children?: React.ReactNode;
}

const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  background = 'light',
  fullHeight = true,
  children,
}) => {
  return (
    <section
      className={`hero hero--${background} ${fullHeight ? 'hero--full' : 'hero--half'}`}
    >
      <div className="hero__content">
        <h1 className="hero__title">{title}</h1>
        {subtitle && <p className="hero__subtitle">{subtitle}</p>}
        {children}
        {(primaryCta || secondaryCta) && (
          <div className="hero__actions btn-group">
            {primaryCta && (
              <Link
                to={primaryCta.to}
                className={`btn btn--lg ${
                  background === 'dark' || background === 'gradient-blue'
                    ? 'btn--white'
                    : 'btn--primary'
                }`}
              >
                {primaryCta.text}
              </Link>
            )}
            {secondaryCta && (
              <Link
                to={secondaryCta.to}
                className={`btn btn--lg ${
                  background === 'dark' || background === 'gradient-blue'
                    ? 'btn--outline-white'
                    : 'btn--secondary'
                }`}
              >
                {secondaryCta.text}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Decorative gradient overlay for visual interest */}
      <div className="hero__overlay" />
    </section>
  );
};

export default Hero;
