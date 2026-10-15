import React from "react";
import "./Footer.css";
import { redirectToCrmSignup } from "../../utils/authRedirect";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content-left">
          <div className="footer__company-container">
            <div className="navigation__brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="navigation__brand-text">
              <span className="navigation__name">MyCRM</span>
              <span className="navigation__subname">Meta & WhatsApp Lead Engine</span>
            </div>
          </div>
          <p className="text-small footer__brand-desc">
            The all-in-one lead management platform engineered for performance agencies, media buyers, and sales teams to convert ad traffic directly on WhatsApp.
          </p>
        </div>

        <div className="footer__content-right">
          <div className="footer__link-col">
            <p className="text-reg footer__col-heading">Product</p>
            <a href="#solution" className="text-small footer__link">The Problem</a>
            <a href="#features" className="text-small footer__link">Features</a>
            <a href="#demo" className="text-small footer__link">Live Demo</a>
            <a href="#pricing" className="text-small footer__link">Pricing Plans</a>
            <a href="#faq" className="text-small footer__link">FAQ</a>
          </div>

          <div className="footer__link-col">
            <p className="text-reg footer__col-heading">Platform</p>
            <a href="#demo" className="text-small footer__link">Meta Webhook Sync</a>
            <a href="#demo" className="text-small footer__link">WhatsApp 2-Way Inbox</a>
            <a href="#demo" className="text-small footer__link">Kanban Sales Pipeline</a>
            <a href="#demo" className="text-small footer__link">Activity Log & Audit</a>
          </div>

          <div className="footer__link-col">
            <p className="text-reg footer__col-heading">Legal</p>
            <a href="https://customer-relationship-management-cr-eight.vercel.app/terms" target="_blank" rel="noopener noreferrer" className="text-small footer__link">Terms of Service</a>
            <a href="https://customer-relationship-management-cr-eight.vercel.app/privacy" target="_blank" rel="noopener noreferrer" className="text-small footer__link">Privacy Policy</a>
            <a href="https://customer-relationship-management-cr-eight.vercel.app/dmca" target="_blank" rel="noopener noreferrer" className="text-small footer__link">DMCA Notice</a>
            <a href="https://customer-relationship-management-cr-eight.vercel.app/unsubscribe" target="_blank" rel="noopener noreferrer" className="text-small footer__link">Unsubscribe</a>
          </div>
        </div>
      </div>

      <div className="footer__banner">
        <p className="text-small footer__copywright">
          © 2026 MyCRM. All Rights Reserved. Protected by 256-bit encryption.
        </p>
        <button
          type="button"
          onClick={() => redirectToCrmSignup()}
          className="footer__trial-link"
        >
          Start 14-Day Free Trial →
        </button>
      </div>
    </footer>
  );
};

export default Footer;
