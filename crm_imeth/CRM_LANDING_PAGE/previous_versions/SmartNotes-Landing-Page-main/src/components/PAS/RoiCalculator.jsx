import React, { useState } from "react";
import { redirectToCrmSignup } from "../../utils/authRedirect";

export default function RoiCalculator() {
  const [adSpend, setAdSpend] = useState(5000);

  // Industry heuristics for Meta lead-gen:
  // Avg CPL: $30
  // Estimated monthly leads = adSpend / 30
  const monthlyLeads = Math.round(adSpend / 30);
  // 68% lost due to >15min delayed response
  const lostLeads = Math.round(monthlyLeads * 0.68);
  // Average deal value estimate: $750, 10% close rate on contacted leads
  const revenueLost = Math.round(lostLeads * 0.10 * 750);
  // Recovered pipeline with 0-sec WhatsApp routing (3.2x contact rate)
  const recoveredPipeline = Math.round(revenueLost * 0.75);

  return (
    <div className="roi-calculator">
      <div className="roi-calculator__top">
        <span className="roi-calculator__badge">⚡ INTERACTIVE AUDIT</span>
        <h4 className="roi-calculator__title">Calculate Your "Speed-to-Lead" Ad Spend Leak</h4>
        <p className="roi-calculator__subtitle">
          See how much revenue your agency or team loses every month to delayed email & phone follow-ups.
        </p>
      </div>

      <div className="roi-calculator__slider-group">
        <div className="roi-calculator__slider-header">
          <label htmlFor="ad-spend-slider" className="roi-calculator__label">
            Monthly Meta Ad Spend:
          </label>
          <span className="roi-calculator__spend-value">
            ${adSpend.toLocaleString()} / mo
          </span>
        </div>
        <input
          id="ad-spend-slider"
          type="range"
          min="1000"
          max="50000"
          step="500"
          value={adSpend}
          onChange={(e) => setAdSpend(Number(e.target.value))}
          className="roi-calculator__slider"
        />
        <div className="roi-calculator__slider-markers">
          <span>$1,000/mo</span>
          <span>$25,000/mo</span>
          <span>$50,000/mo</span>
        </div>
      </div>

      <div className="roi-calculator__results">
        <div className="roi-card roi-card--loss">
          <span className="roi-card__tag">CRITICAL LEAK</span>
          <span className="roi-card__amount">-${revenueLost.toLocaleString()}</span>
          <span className="roi-card__label">Monthly revenue lost to &gt;15min replies</span>
          <span className="roi-card__detail">~{lostLeads} ad leads go cold per month</span>
        </div>

        <div className="roi-card roi-card--gain">
          <span className="roi-card__tag">RECOVERED WITH MYCRM</span>
          <span className="roi-card__amount">+${recoveredPipeline.toLocaleString()}</span>
          <span className="roi-card__label">Estimated pipeline saved via WhatsApp</span>
          <span className="roi-card__detail">Instant 0-sec response • 91% contact rate</span>
        </div>
      </div>

      <div className="roi-calculator__cta-bar">
        <button
          type="button"
          onClick={() => redirectToCrmSignup()}
          className="hero__submit-btn roi-calculator__btn"
        >
          Plug The Leak — Start 14-Day Free Trial →
        </button>
        <span className="roi-calculator__guarantee">
          ✓ No credit card required • Instant 2-minute setup
        </span>
      </div>
    </div>
  );
}
