import React, { useState } from "react";
import "./Video.css";
import { redirectToCrmSignup } from "../../utils/authRedirect";

const Video = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="video-section" id="demo">
      <div className="video-section__header">
        <span className="video-section__badge">VISUAL WALKTHROUGH</span>
        <h2 className="h2 video-section__title">
          From Meta Ad Click to Closed Won in <span className="video-section__gradient">60 Seconds</span>
        </h2>
        <p className="text-reg video-section__subtitle">
          See the end-to-end workflow: Zero-second webhook capture, instant WhatsApp engagement, and real-time pipeline management.
        </p>
      </div>

      <div className="video__container">
        {/* Mock CRM Video Player Canvas */}
        <div className="video__player-canvas">
          <div className="video__browser-chrome">
            <div className="video__chrome-dots">
              <span className="dot dot--red" />
              <span className="dot dot--yellow" />
              <span className="dot dot--green" />
            </div>
            <span className="video__chrome-url">app.mycrm.io/pipeline/leads</span>
            <span className="video__chrome-status">Active Session</span>
          </div>

          <div className="video__screen-content">
            <div className="video__flow-steps">
              <div className="flow-step flow-step--active">
                <span className="flow-step__number">01</span>
                <div className="flow-step__meta">
                  <strong>Meta Ad Webhook</strong>
                  <span>Instant JSON Ingestion</span>
                </div>
              </div>
              <div className="flow-step-arrow">→</div>
              <div className="flow-step flow-step--active">
                <span className="flow-step__number">02</span>
                <div className="flow-step__meta">
                  <strong>WhatsApp Ping</strong>
                  <span>1-Click Message Sent</span>
                </div>
              </div>
              <div className="flow-step-arrow">→</div>
              <div className="flow-step flow-step--active">
                <span className="flow-step__number">03</span>
                <div className="flow-step__meta">
                  <strong>Socket Timeline</strong>
                  <span>Audit Trail Logged</span>
                </div>
              </div>
              <div className="flow-step-arrow">→</div>
              <div className="flow-step flow-step--active">
                <span className="flow-step__number">04</span>
                <div className="flow-step__meta">
                  <strong>Deal Closed Won</strong>
                  <span>+$4,500 Pipeline Won</span>
                </div>
              </div>
            </div>

            <div className="video__dashboard-preview">
              <div className="preview-stat-card">
                <span className="stat-label">Response Time</span>
                <span className="stat-val stat-val--emerald">28s</span>
                <span className="stat-sub">vs. 4h industry avg</span>
              </div>
              <div className="preview-stat-card">
                <span className="stat-label">Contact Rate</span>
                <span className="stat-val stat-val--cyan">91.4%</span>
                <span className="stat-sub">+3.2x vs. phone call</span>
              </div>
              <div className="preview-stat-card">
                <span className="stat-label">ROAS Boost</span>
                <span className="stat-val stat-val--gold">+148%</span>
                <span className="stat-sub">From recovered leads</span>
              </div>
            </div>

            <div className="video__overlay-cta">
              <button
                type="button"
                onClick={() => redirectToCrmSignup()}
                className="hero__submit-btn video__cta-btn"
              >
                Experience The Speed Yourself — Start Free Trial →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Video;
