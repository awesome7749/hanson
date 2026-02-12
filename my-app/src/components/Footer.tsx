import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__grid">
          <div className="footer__brand">
            <h3 className="footer__logo">Hanson</h3>
            <p className="footer__tagline">
              The modern way to upgrade your home comfort.
            </p>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Company</h4>
            <Link to="/about" className="footer__link">About</Link>
            <Link to="/how-it-works" className="footer__link">How It Works</Link>
            <Link to="/products" className="footer__link">Products</Link>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Get Started</h4>
            <Link to="/get-quote" className="footer__link">Get a Quote</Link>
            <a href="mailto:hello@hansonhvac.com" className="footer__link">Contact Us</a>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Legal</h4>
            <Link to="/" className="footer__link">Privacy Policy</Link>
            <Link to="/" className="footer__link">Terms of Service</Link>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} Hanson. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
