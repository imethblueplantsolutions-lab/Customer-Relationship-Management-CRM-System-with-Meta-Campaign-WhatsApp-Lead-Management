import React from "react";
import "./PricingTile.css";
import check from "../../assets/check.png";
import arrowDark from "../../assets/arrow.svg";
import { redirectToCrmSignup } from "../../utils/authRedirect";

const PricingTile = ({
  id,
  plan,
  planPriceMonthly,
  planPriceYearly,
  isYearly,
  badge,
  description,
  bullets,
  CallToAction,
  darkMode,
}) => {
  const isPopular = darkMode;
  const currentPrice = isYearly ? planPriceYearly : planPriceMonthly;
  const periodLabel = isYearly ? "/ month, billed yearly" : "/ month";

  return (
    <div className={`pricing-tile ${isPopular ? "pricing-tile--popular" : ""} mobile-snap-card`}>
      {badge && <div className="pricing-tile__badge">{badge}</div>}

      <div className="plan-section">
        <h3 className="plan-section__plan">{plan}</h3>
        {description && <p className="plan-section__desc">{description}</p>}
      </div>

      <div className="pricing-section">
        <div className="price-row">
          <span className="price-currency">$</span>
          <span className="price-number">{currentPrice}</span>
        </div>
        <span className="price-period">{periodLabel}</span>
      </div>

      <div className="bullets-section">
        {bullets.map((bullet, i) => (
          <div className="pricing-bullet" key={i}>
            <span className="bullet-check">✓</span>
            <span className="pricing-bullet__text">{bullet}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => redirectToCrmSignup({ plan: id })}
        className={`pricing-cta ${isPopular ? "pricing-cta--popular" : ""}`}
      >
        <span>{CallToAction}</span>
        <img className="pricing-cta__icon" src={arrowDark} alt="arrow" />
      </button>

      <p className="pricing-tile__guarantee">
        14-day free trial • No credit card required
      </p>
    </div>
  );
};

export default PricingTile;
