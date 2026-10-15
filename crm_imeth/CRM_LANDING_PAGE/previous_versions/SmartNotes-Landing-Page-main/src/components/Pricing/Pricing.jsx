import React, { useState } from "react";
import "./Pricing.css";
import PricingTile from "../PricingTile/PricingTile";
import { pricingData } from "../../utils/constants";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="pricing" id="pricing">
      <div className="pricing__heading-section">
        <span className="pricing__badge">TRANSPARENT PRICING</span>
        <h2 className="h2 pricing__heading">
          Plans Designed for <span className="pricing__gradient">High-Growth Closers</span>
        </h2>
        <p className="text-reg pricing__subheading">
          No per-lead surcharges, no hidden fees. Start with a 14-day free trial on us and upgrade only when you see direct ROI.
        </p>
      </div>

      <div className="pricing__billing-section">
        <button
          type="button"
          onClick={() => setIsYearly(false)}
          className={`billing-tab ${!isYearly ? "billing-tab--active" : ""}`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setIsYearly(true)}
          className={`billing-tab ${isYearly ? "billing-tab--active" : ""}`}
        >
          <span>Yearly Billing</span>
          <span className="pricing__savings-pill">Save 25%</span>
        </button>
      </div>

      <div className="pricing__tile-section mobile-snap-carousel">
        {pricingData.map((tile, i) => (
          <PricingTile key={i} {...tile} isYearly={isYearly} />
        ))}
      </div>
    </section>
  );
};

export default Pricing;
