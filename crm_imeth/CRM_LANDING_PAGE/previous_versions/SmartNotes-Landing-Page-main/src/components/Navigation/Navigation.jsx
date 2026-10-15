import React from "react";
import "./Navigation.css";
import arrow from "../../assets/arrow.svg";
import { redirectToCrmSignup, redirectToCrmLogin } from "../../utils/authRedirect";

const Navigation = () => {
  return (
    <nav className="navigation">
      <div className="navigation__logo-section">
        <div className="navigation__brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="navigation__brand-text">
          <span className="navigation__name">MyCRM</span>
          <span className="navigation__subname">Meta & WhatsApp</span>
        </div>
      </div>

      <ul className="navigation__link-section">
        <li>
          <a href="#solution" className="navigation__link">
            Solution
          </a>
        </li>
        <li>
          <a href="#features" className="navigation__link">
            Features
          </a>
        </li>
        <li>
          <a href="#demo" className="navigation__link">
            Demo
          </a>
        </li>
        <li>
          <a href="#pricing" className="navigation__link">
            Pricing
          </a>
        </li>
        <li>
          <a href="#faq" className="navigation__link">
            FAQ
          </a>
        </li>
      </ul>

      <div className="navigation__action-group">
        <button
          type="button"
          onClick={() => redirectToCrmLogin()}
          className="navigation__login-btn"
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={() => redirectToCrmSignup()}
          className="navigation__cta"
        >
          <span>Free Trial</span>
          <img className="navigation__arrow" src={arrow} alt="arrow" />
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
