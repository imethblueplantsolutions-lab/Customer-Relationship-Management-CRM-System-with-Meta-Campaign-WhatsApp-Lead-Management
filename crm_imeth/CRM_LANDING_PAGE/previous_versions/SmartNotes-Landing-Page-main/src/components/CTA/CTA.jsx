import React, { useState } from "react";
import "./CTA.css";
import arrow from "../../assets/arrow.svg";
import { redirectToCrmSignup } from "../../utils/authRedirect";

const CTA = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    redirectToCrmSignup({ email, plan: "agency_growth" });
  };

  return (
    <section className="cta">
      <div className="cta-content">
        <div className="cta-content__center">
          <span className="cta__badge">14-DAY RISK-FREE ACCESS</span>
          <h2 className="h2 cta__heading">
            Stop Wasting Meta Ad Spend.
            <br />
            Start Closing on WhatsApp Today.
          </h2>
          <p className="text-reg cta__description">
            Cut your lead response time to under 60 seconds, boost your contact rate to 91%, and track every dollar of pipeline in real time.
          </p>

          <form onSubmit={handleSubmit} className="hero__action-form cta__form">
            <input
              className="hero__email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              required
              autoComplete="email"
            />
            <button type="submit" className="hero__submit-btn">
              <span>Start 14-Day Free Trial</span>
              <img className="hero__arrow" src={arrow} alt="arrow" />
            </button>
          </form>

          <div className="cta__guarantees">
            <span>✓ No credit card required</span>
            <span>✓ 2-minute onboarding</span>
            <span>✓ Zero Meta ban risk</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
