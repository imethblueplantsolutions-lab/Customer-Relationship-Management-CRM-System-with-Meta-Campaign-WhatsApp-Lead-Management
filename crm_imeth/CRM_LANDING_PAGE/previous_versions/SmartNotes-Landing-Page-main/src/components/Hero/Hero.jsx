import React, { useState } from "react";
import "./Hero.css";
import arrow from "../../assets/arrow.svg";
import HeroDemo from "../HeroDemo/HeroDemo";
import { redirectToCrmSignup } from "../../utils/authRedirect";

const Hero = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    redirectToCrmSignup({ email, plan: "agency_growth" });
  };

  return (
    <section className="hero">
      <div className="hero__column hero__column--text">
        <div className="hero__eyebrow">
          <span className="hero__eyebrow-pulse" />
          <span>Built for Agencies & High-Ticket Closers</span>
        </div>

        <h1 className="h1 hero__heading">
          Convert{" "}
          <span className="hero__heading-gradient">Meta Ad Leads</span>
          <br />
          Instantly on{" "}
          <span className="hero__heading-gradient">WhatsApp</span>
        </h1>

        <p className="text-reg hero__subheading">
          Stop losing 70% of ad leads to slow email replies. Ingest Facebook & Instagram leads in real-time, launch 1-click WhatsApp chats in under 60 seconds, and track deals through a visual sales pipeline.
        </p>

        <form onSubmit={handleSubmit} className="hero__action-form">
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

        <div className="hero__guarantee-row">
          <span className="guarantee-item">✓ No credit card required</span>
          <span className="guarantee-item">✓ 2-minute setup</span>
          <span className="guarantee-item">✓ Cancel anytime</span>
        </div>
      </div>

      <div className="hero__column hero__column--demo">
        <HeroDemo />
      </div>
    </section>
  );
};

export default Hero;
