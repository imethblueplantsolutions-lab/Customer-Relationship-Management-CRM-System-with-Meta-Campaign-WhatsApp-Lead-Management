import React, { useState, useEffect } from "react";
import "./HeroDemo.css";

export default function HeroDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle through the 3 states every 2.8s unless hovered
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className="hero-demo"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Chrome Header */}
      <div className="hero-demo__header">
        <div className="hero-demo__dots">
          <span className="dot dot--red" />
          <span className="dot dot--yellow" />
          <span className="dot dot--green" />
        </div>
        <div className="hero-demo__title-bar">
          <span className="hero-demo__status-pill">
            <span className="status-pulse" /> LIVE STREAM
          </span>
          <span className="hero-demo__latency">Latency: 0.18s</span>
        </div>
      </div>

      {/* Interactive Step Switcher */}
      <div className="hero-demo__steps-nav">
        <button
          type="button"
          onClick={() => setActiveStep(0)}
          className={`step-btn ${activeStep === 0 ? "step-btn--active" : ""}`}
        >
          <span className="step-num">1</span> Meta Webhook
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`step-btn ${activeStep === 1 ? "step-btn--active" : ""}`}
        >
          <span className="step-num">2</span> 1-Click WhatsApp
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`step-btn ${activeStep === 2 ? "step-btn--active" : ""}`}
        >
          <span className="step-num">3</span> Kanban Qualified
        </button>
      </div>

      {/* Dynamic Interactive Stage Body */}
      <div className="hero-demo__stage">
        {/* Step 1: Meta Ad Ingestion */}
        <div
          className={`demo-card demo-card--meta ${
            activeStep === 0 ? "demo-card--visible" : ""
          }`}
        >
          <div className="demo-card__top">
            <div className="platform-tag platform-tag--meta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Meta Ads Webhook · Ingested 0.18s</span>
            </div>
            <span className="badge-new">NEW LEAD</span>
          </div>

          <div className="demo-card__content">
            <div className="lead-avatar">DM</div>
            <div className="lead-meta">
              <h4 className="lead-name">David Miller</h4>
              <p className="lead-campaign">Campaign: Kitchen Remodel High-Intent Q4</p>
              <p className="lead-phone">+1 (555) 234-8901 · San Jose, CA</p>
            </div>
          </div>

          <div className="demo-action-bar">
            <span className="response-timer">⚡ Speed to Ingest: 0.2s</span>
            <span className="routing-status">Auto-assigned to Agent Sarah</span>
          </div>
        </div>

        {/* Step 2: Instant WhatsApp 2-Way Chat */}
        <div
          className={`demo-card demo-card--whatsapp ${
            activeStep === 1 ? "demo-card--visible" : ""
          }`}
        >
          <div className="demo-card__top">
            <div className="platform-tag platform-tag--whatsapp">
              <span className="wa-icon">💬</span>
              <span>WhatsApp Cloud API · 1-Click Message</span>
            </div>
            <span className="badge-connected">OPEN CHAT</span>
          </div>

          <div className="wa-chat-box">
            <div className="wa-bubble wa-bubble--out">
              <p className="wa-text">
                Hi David! Thanks for requesting a quote for your kitchen remodel on Facebook.
                Are you looking to start within 30 days?
              </p>
              <span className="wa-time">10:42 AM · Sent ✓✓</span>
            </div>
            <div className="wa-bubble wa-bubble--in">
              <p className="wa-text">
                Yes! Need it before the holidays. Can we jump on a call today?
              </p>
              <span className="wa-time">10:43 AM · Received</span>
            </div>
          </div>

          <div className="demo-action-bar">
            <span className="wa-metric">Response Time: 28 seconds</span>
            <span className="wa-tag">🔥 High-Intent Buyer</span>
          </div>
        </div>

        {/* Step 3: Kanban Pipeline Conversion */}
        <div
          className={`demo-card demo-card--kanban ${
            activeStep === 2 ? "demo-card--visible" : ""
          }`}
        >
          <div className="demo-card__top">
            <div className="platform-tag platform-tag--kanban">
              <span>📋 Kanban Pipeline · Stage Updated</span>
            </div>
            <span className="badge-won">QUALIFIED</span>
          </div>

          <div className="kanban-preview">
            <div className="kanban-col kanban-col--contacted">
              <span className="col-title">CONTACTED</span>
              <div className="col-empty">Lead moved forward →</div>
            </div>
            <div className="kanban-col kanban-col--qualified">
              <span className="col-title">QUALIFIED DEAL</span>
              <div className="kanban-card-active">
                <div className="k-header">
                  <strong>David Miller</strong>
                  <span className="k-val">+$4,500</span>
                </div>
                <p className="k-desc">Full Kitchen Remodel Consultation</p>
                <div className="k-footer">
                  <span className="k-badge">WhatsApp Follow-Up Set</span>
                  <span className="k-agent">Agent: Sarah</span>
                </div>
              </div>
            </div>
          </div>

          <div className="demo-action-bar">
            <span className="won-metric">Pipeline Value Added: +$4,500</span>
            <span className="won-tag">✓ Zero Lead Leakage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
