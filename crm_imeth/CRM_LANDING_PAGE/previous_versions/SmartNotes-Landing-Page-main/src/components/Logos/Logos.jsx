import React from "react";
import "./Logos.css";
import { trustBadges } from "../../utils/constants";

const Logos = () => {
  return (
    <section className="trust-bar">
      <div className="trust-bar__header">
        <span className="trust-bar__lead">
          TRUSTED BY 450+ PERFORMANCE AGENCIES & HIGH-TICKET CLOSERS WORLDWIDE
        </span>
      </div>

      <div className="trust-bar__grid">
        {trustBadges.map((badge, idx) => (
          <div className="trust-badge" key={idx}>
            <span className="trust-badge__icon">{badge.icon}</span>
            <div className="trust-badge__text">
              <span className="trust-badge__title">{badge.title}</span>
              <span className="trust-badge__subtitle">{badge.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Logos;
